#!/usr/bin/env bash
set -euo pipefail

# Moves specified GitHub issues' project cards into a target column (Backlog) on a Projects V2 board.
# Requires: gh CLI authenticated with project & repo scopes, jq installed.
# Usage: ./move_project_items.sh [owner] [project_number] [target_column_name] [issue1 issue2 ...]
# Defaults: owner=ml-net project_number=2 target_column_name=Backlog issues=(21 20 17 14)

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI and authenticate with project scope."
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found. Please install jq."
  exit 1
fi

OWNER="${1:-ml-net}"
PROJECT_NUMBER="${2:-2}"
TARGET_NAME="${3:-Backlog}"
shift 3 || true
if [ "$#" -ge 1 ]; then
  ISSUES=("$@")
else
  ISSUES=(21 20 17 14)
fi

echo "Owner: $OWNER, Project number: $PROJECT_NUMBER, Target: $TARGET_NAME"

# Get project id
PROJECT_QUERY='query{user(login:"'"$OWNER"'" ){projectV2(number:'"$PROJECT_NUMBER"'){id}}}'
PROJECT_ID=$(gh api graphql -f query="$PROJECT_QUERY" --preview projects-alpha | jq -r '.data.user.projectV2.id')
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
  echo "Failed to fetch project id"
  exit 2
fi

echo "Project ID: $PROJECT_ID"

# Fetch fields and their options to find single-select field that contains the target option
FIELDS_QUERY='query{user(login:"'"$OWNER"'" ){projectV2(number:'"$PROJECT_NUMBER"'){fields(first:50){nodes{__typename ... on ProjectV2SingleSelectField{id,name,options(first:50){nodes{id,name}}}}}}}'
FIELDS_JSON=$(gh api graphql -f query="$FIELDS_QUERY" --preview projects-alpha)

FIELD_ID=$(echo "$FIELDS_JSON" | jq -r --arg TARGET "$TARGET_NAME" '.data.user.projectV2.fields.nodes[]? | select(.options!=null and (.options.nodes[]?.name == $TARGET)) | .id' | head -n1)
OPTION_ID=$(echo "$FIELDS_JSON" | jq -r --arg TARGET "$TARGET_NAME" '.data.user.projectV2.fields.nodes[]? | .options.nodes[]? | select(.name == $TARGET) | .id' | head -n1)

if [ -z "$FIELD_ID" ] || [ "$FIELD_ID" == "null" ]; then
  echo "Could not find a single-select field with option '$TARGET_NAME'. Available single-select fields and options:" >&2
  echo "$FIELDS_JSON" | jq -r '.data.user.projectV2.fields.nodes[]? | "Field: " + (.name//"<no-name>") + " id:" + .id, (.options.nodes[]? | "  - option: " + .name + " id:" + .id)'
  exit 3
fi

echo "Found field id: $FIELD_ID option id: $OPTION_ID"

# Fetch project items mapping
ITEMS_QUERY='query{user(login:"'"$OWNER"'" ){projectV2(number:'"$PROJECT_NUMBER"'){items(first:500){nodes{id,content{... on Issue{number}}}}}}'
ITEMS_JSON=$(gh api graphql -f query="$ITEMS_QUERY" --preview projects-alpha)

for ISSUE in "${ISSUES[@]}"; do
  ITEM_ID=$(echo "$ITEMS_JSON" | jq -r --argjson NUM $ISSUE '.data.user.projectV2.items.nodes[]? | select(.content.number == ($NUM|tonumber)) | .id' )
  if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" == "null" ]; then
    echo "Issue #$ISSUE has no project item in project $PROJECT_NUMBER; adding it to project first..."
    gh issue edit "$ISSUE" --add-project "$(gh project view $PROJECT_NUMBER --owner $OWNER --json title --jq .title)" || true
    # refetch items
    ITEMS_JSON=$(gh api graphql -f query="$ITEMS_QUERY" --preview projects-alpha)
    ITEM_ID=$(echo "$ITEMS_JSON" | jq -r --argjson NUM $ISSUE '.data.user.projectV2.items.nodes[]? | select(.content.number == ($NUM|tonumber)) | .id')
  fi
  if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" == "null" ]; then
    echo "Could not find or create project item for issue #$ISSUE" >&2
    continue
  fi
  echo "Updating issue #$ISSUE -> item $ITEM_ID to option id $OPTION_ID"

  MUTATION='mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$value:String!){updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:$value}){projectV2Item{ id }}}'
  RESP=$(gh api graphql -f query="$MUTATION" -f projectId="$PROJECT_ID" -f itemId="$ITEM_ID" -f fieldId="$FIELD_ID" -f value="$OPTION_ID" --preview projects-alpha)
  echo "$RESP" | jq -r
  sleep 1
done

echo "Done."

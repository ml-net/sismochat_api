#!/usr/bin/env bash
# Add one or more existing GitHub issues to a project board by project title.
# Usage: ./add_issues_to_project.sh "SiSMoChat Board" 21 20 17 14
# Requires: gh CLI authenticated (gh auth login) and access to the repo and project.

set -euo pipefail
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 \"<Project Title>\" <issue-number> [issue-number ...]"
  exit 1
fi
PROJECT_TITLE="$1"
shift

for ISSUE in "$@"; do
  echo "Adding issue #$ISSUE to project '$PROJECT_TITLE'..."
  gh issue edit "$ISSUE" --add-project "$PROJECT_TITLE" || {
    echo "Failed to add issue #$ISSUE to project."
    exit 2
  }
  echo "Added #$ISSUE"
done

echo "Done. Note: gh currently adds items to the project's default column. To move items into a specific column (Backlog, To Do, etc.) use the web UI or a Projects V2 GraphQL script (see automation README)." 

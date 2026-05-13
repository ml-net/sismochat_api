Project automation notes

This folder contains helper scripts and instructions to automate common Project V2 tasks. Current helper:

- add_issues_to_project.sh — adds existing issue numbers to a project by title using `gh issue edit --add-project`.

Full automation (move cards between columns)

Notes and steps to fully automate moving Project V2 items between columns (status values):

1. Requirements
   - gh CLI installed and authenticated
   - GitHub token with `repo` and `project` scopes (Projects V2 GraphQL preview access)
   - Node.js 18+ (optional if using node script)

2. High-level approach (GraphQL Projects V2 API)
   - Query projectV2 (by owner + number) to get projectId and fields.
   - Find the single-select field used as "Status" and the option IDs for choices (Backlog, To Do, In Progress, Review, Done).
   - Query project items to get their project item node IDs.
   - Use the `updateProjectV2ItemFieldValue` GraphQL mutation to set the single-select field value for an item to the desired option (this effectively moves it).

3. Example gh GraphQL snippets (preview: projects-alpha)

- Get project id and fields:

  gh api graphql -f query='query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id,fields(first:50){nodes{... on ProjectV2SingleSelectField{id name options(first:50){nodes{id name}}}}}}}}' -f owner=ml-net -f number=2 --preview projects-alpha

- Get project items (returns project item node IDs):

  gh api graphql -f query='query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){items(first:100){nodes{id,content{... on Issue{number}}}}}}}' -f owner=ml-net -f number=2 --preview projects-alpha

- Update an item single-select field (example mutation):

  gh api graphql -f query='mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$value:String!){updateProjectV2ItemFieldValue(input:{projectId:$projectId,itemId:$itemId,fieldId:$fieldId,value:$value}){projectV2Item{ id }}}' -f projectId=PVT_kwHOAkxgT84BXkRX -f itemId=PVTI_xxx -f fieldId=PVF_xxx -f value='Backlog' --preview projects-alpha

4. When you're ready
   - I can implement a robust Node script that performs the steps above and moves items according to rules (labels, assignees, or issue numbers). Ask me to implement and I will create it and run it with the permissions you provided.

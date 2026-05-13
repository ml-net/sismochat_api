#!/usr/bin/env node
/*
Move project V2 items (issues) to a target single-select option (column) using GitHub GraphQL.
Usage: GITHUB_TOKEN=... node .github/move_project_items.js [owner] [projectNumber] [targetName] [issue1 issue2 ...]
Defaults: owner=ml-net projectNumber=2 targetName=Backlog issues=21,20,17,14

Note: token must have `repo` and `project` scopes. This script uses the GraphQL API and requests the projects preview header.
*/

let fetch;
try { fetch = globalThis.fetch; } catch(e) { fetch = undefined; }
if (!fetch) { fetch = require('node-fetch'); }

(async function(){
  const args = process.argv.slice(2);
  const owner = args[0] || 'ml-net';
  const projectNumber = parseInt(args[1] || '2', 10);
  const targetName = args[2] || 'Backlog';
  const issues = args.length > 3 ? args.slice(3).map(s => parseInt(s,10)) : [21,20,17,14];

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN or GH_TOKEN is required in environment');
    process.exit(2);
  }

  const graphql = async (query, variables = {}) => {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
        // projectV2 preview header
        'Accept': 'application/vnd.github.v3+json, application/vnd.github.inertia-preview+json, application/vnd.github.starfox-preview+json, application/vnd.github.mercy-preview+json'
      },
      body: JSON.stringify({ query, variables })
    });
    const j = await res.json();
    if (!res.ok || j.errors) {
      console.error('GraphQL error', JSON.stringify(j.errors || j, null, 2));
      throw new Error('GraphQL request failed');
    }
    return j.data;
  };

  try {
    console.log('Fetching project fields and items...');
    const query = `query($owner:String!, $number:Int!){ user(login:$owner){ projectV2(number:$number){ id fields(first:50){ nodes{ __typename ... on ProjectV2SingleSelectField{ id name options(first:50){ nodes{ id name } } } ... on ProjectV2Field{ id name } } } items(first:500){ nodes{ id content{ __typename ... on Issue{ number } } } } } } }`;

    const data = await graphql(query, { owner, number: projectNumber });
    const project = data.user.projectV2;
    if (!project) throw new Error('Project not found');
    const projectId = project.id;

    // find single-select field that contains targetName as option
    let field = null;
    for (const f of project.fields.nodes) {
      if (f.__typename === 'ProjectV2SingleSelectField' && f.options && f.options.nodes) {
        const opt = f.options.nodes.find(o => o.name === targetName);
        if (opt) { field = { id: f.id, name: f.name, optionId: opt.id }; break; }
      }
    }

    if (!field) {
      console.error('Could not find a single-select field that contains option', targetName);
      console.error('Available single-select fields and options:');
      for (const f of project.fields.nodes) {
        if (f.__typename === 'ProjectV2SingleSelectField') {
          console.error(`- Field ${f.name} (${f.id}): options=${(f.options.nodes||[]).map(o=>o.name).join(', ')}`);
        }
      }
      process.exit(3);
    }

    console.log('Using field', field.name, 'fieldId=', field.id, 'optionId=', field.optionId);

    // build map of issueNumber -> itemId
    const map = new Map();
    for (const it of project.items.nodes) {
      if (it.content && it.content.__typename === 'Issue') {
        map.set(it.content.number, it.id);
      }
    }

    for (const issueNum of issues) {
      let itemId = map.get(issueNum);
      if (!itemId) {
        console.log(`Issue #${issueNum} not in project. Adding to project (default column)...`);
        // use REST to add issue to project by editing issue and adding project
        const addResp = await fetch(`https://api.github.com/repos/${owner}/sismochat_api/issues/${issueNum}`, {
          method: 'PATCH',
          headers: { 'Authorization': `bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        // Now add-project via REST is not straightforward; use GH CLI earlier did it. Alternatively, use GraphQL mutation addProjectV2ItemById with contentId
        // Need content node id for the issue
        const issueNodeQ = `query($owner:String!,$repo:String!,$number:Int!){ repository(owner:$owner,name:$repo){ issue(number:$number){ id } } }`;
        const issueNodeData = await graphql(issueNodeQ, { owner, repo: 'sismochat_api', number: issueNum });
        const contentId = issueNodeData.repository.issue.id;
        // add item to project
        const addItemQ = `mutation($projectId:ID!,$contentId:ID!){ addProjectV2ItemById(input:{projectId:$projectId, contentId:$contentId}){item{ id }} }`;
        const added = await graphql(addItemQ, { projectId, contentId });
        itemId = added.addProjectV2ItemById.item.id;
        console.log('Added item', itemId);
      }

      console.log(`Updating item ${itemId} for issue #${issueNum} -> option ${field.optionId}`);
      const mutation = `mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $value:String!){ updateProjectV2ItemFieldValue(input:{projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:$value}){ projectV2Item{ id } } }`;
      await graphql(mutation, { projectId, itemId, fieldId: field.id, value: field.optionId });
      console.log(`Issue #${issueNum} moved to ${targetName}`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();

const github = require('@actions/github');
const core = require('@actions/core');
const fetch = require('node-fetch');

async function run() {
  try {
    // Get client and context
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const context = github.context;

    // Get languages used in the current repository
    const { data: languages } = await octokit.rest.repos.listLanguages({
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
    console.log(languages);

    // Get comments
    const { data: comments } = await octokit.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
    });

    // Fetch security lab data
    const response = await fetch('https://security-check.org/api/labs');
    const data = await response.json();
    const labs = data.labs;

    // Check comments for lab tags
    for (const comment of comments) {
      for (const lab of labs) {
        for (const tag of lab.tags) {
          if (comment.body.includes(tag)) {
            // If tag is found, add a new comment
            const body = `We noticed a potential security issue related to **${tag}** - **${lab.title}**.\n
              ${lab.description}\n
              Please check out this [resource](${lab.permalink}) for more information.`;

            await octokit.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: body,
            });
          }
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

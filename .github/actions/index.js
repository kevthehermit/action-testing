/*
MIT License

Copyright (c) 2023 Kev Breen (Immersive Labs)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


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

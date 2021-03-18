import 'esm';
import { getInput, debug, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { GitHub, context } from '@actions/github';
import path from 'path';
import yn from 'yn';

import {
  normaliseFingerprint,
  diffSizes,
  buildOutputText,
  getPullRequest,
  getAssetSizes,
} from './lib/helpers';

async function getActionInputs() {
  const workingDirectory = getInput('working-directory', { required: false });
  const usePrArtifacts = yn(getInput('use-pr-artifacts', { required: false }));
  const token = getInput('repo-token', { required: true });

  const cwd = path.join(process.cwd(), workingDirectory);
  debug(`cwd: ${cwd}`);
  debug(`token: ${token}`);

  return { token, cwd, usePrArtifacts };
}

async function diffAssets({ pullRequest, cwd, usePrArtifacts }) {
  const prAssets = await getAssetSizes({ cwd, build: !usePrArtifacts });

  await exec(`git checkout ${pullRequest.base.sha}`, [], { cwd });

  const masterAssets = await getAssetSizes({ cwd, build: true });

  const fileDiffs = diffSizes(
    normaliseFingerprint(masterAssets),
    normaliseFingerprint(prAssets),
  );

  return fileDiffs;
}

async function commentOnPR({ octokit, pullRequest, fileDiffs }) {
  const uniqueCommentIdentifier = '_Created by ember-asset-size-action_';
  const body = `${buildOutputText(fileDiffs)}\n\n${uniqueCommentIdentifier}`;

  const updateExistingComment = getInput('update-comments', { required: false });
  let existingComment = false;

  if (updateExistingComment) {
    const { data: comments } = await octokit.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pullRequest.number,
    });
    existingComment = comments.find(comment => comment.user.login === 'github-actions[bot]' && comment.body.endsWith(uniqueCommentIdentifier));
  }

  try {
    if (existingComment) {
      await octokit.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: existingComment.id,
        body,
      });
    } else {
      await octokit.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequest.number,
        body,
      });
    }
  } catch (e) {
    console.error(e);
    console.log(`Could not create a comment automatically. This could be because github does not allow writing from actions on a fork.

See https://github.community/t5/GitHub-Actions/Actions-not-working-correctly-for-forks/td-p/35545 for more information.`);

    console.log(`Copy and paste the following into a comment yourself if you want to still show the diff:

${body}`);
  }
}

export default async function run() {
  try {
    const { token, cwd, usePrArtifacts } = await getActionInputs();

    const octokit = new GitHub(token);

    const pullRequest = await getPullRequest(context, octokit);
    const fileDiffs = await diffAssets({ pullRequest, cwd, usePrArtifacts });

    await commentOnPR({ octokit, pullRequest, fileDiffs });
  } catch (error) {
    console.error(error);

    setFailed(error.message);
  }
}

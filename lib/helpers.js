import prettyBytes from 'pretty-bytes';
import { exec } from '@actions/exec';
import assetSizeReporter from 'asset-size-reporter';
import fs from 'fs';
import path from 'path';

export function normaliseFingerprint(obj) {
  const normalisedObject = {};

  Object.keys(obj).forEach((key) => {
    const filePath = key.replace(/(-|\.)([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}|\b[0-9a-f]{5,40}\b)/ig, '');
    const match = filePath.match(/(dist\/assets)\/(.+)/);

    if (match) {
      const [, , fileName] = match;
      normalisedObject[`${fileName}`] = obj[key];
    } else {
      console.log(`Ignoring file ${filePath} as it does not match known asset file pattern`);
    }
  });

  return normalisedObject;
}

export function diffSizes(baseBranch, pullRequestBranch) {
  const diffObject = {};

  Object.keys(pullRequestBranch).forEach((key) => {
    const newSize = pullRequestBranch[key];
    const originSize = baseBranch[key];

    // new file i.e. does not exist in origin
    if (!originSize) {
      diffObject[key] = {
        raw: newSize.raw,
        gzip: newSize.gzip,
      };
    } else {
      diffObject[key] = {
        raw: newSize.raw - originSize.raw,
        gzip: newSize.gzip - originSize.gzip,
      };
    }

    // TODO cater for deleted files
  });

  return diffObject;
}


export async function getPullRequest(context, octokit) {
  const pr = context.payload.pull_request;

  if (!pr) {
    console.log('Could not get pull request number from context, exiting');
    return;
  }

  const { data: pullRequest } = await octokit.pulls.get({
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    pull_number: pr.number,
  });

  return pullRequest;
}

export async function getAssetSizes({ cwd, build = true, patterns }) {
  if (build) {
    if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
      await exec('yarn --frozen-lockfile', [], { cwd });
    } else {
      await exec('npm ci', [], { cwd });
    }

    await exec('npx ember build -prod', [], { cwd });
  }

  let prAssets;

  await assetSizeReporter({
    patterns,
    json: true,
    console: {
      log(text) {
        prAssets = JSON.parse(text);
      },
    },
    cwd,
  });

  return prAssets;
}


function reportTable(data) {
  let table = `File | raw | gzip
--- | --- | ---
`;
  data.forEach((item) => {
    table += `${item.file}|${prettyBytes(item.raw, { signed: true })}|${prettyBytes(item.gzip, { signed: true })}\n`;
  });

  return table;
}

export function buildOutputText(output) {
  const files = Object.keys(output).map(key => ({
    file: key,
    raw: output[key].raw,
    gzip: output[key].gzip,
  }));

  const bigger = [];
  const smaller = [];
  const same = [];

  files.forEach((file) => {
    if (file.raw > 0) {
      bigger.push(file);
    } else if (file.raw < 0) {
      smaller.push(file);
    } else {
      same.push(file);
    }
  });

  let outputText = '';

  if (bigger.length) {
    outputText += `Files that got Bigger 🚨:\n\n${reportTable(bigger)}\n`;
  }

  if (smaller.length) {
    outputText += `Files that got Smaller 🎉:\n\n${reportTable(smaller)}\n\n`;
  }

  if (same.length) {
    outputText += `Files that stayed the same size 🤷‍:\n\n${reportTable(same)}\n\n`;
  }

  return outputText.trim();
}

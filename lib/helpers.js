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

export async function getAssetSizes({ cwd, build = true }) {
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
    patterns: ['dist/assets/**/*.js', 'dist/assets/**/*.css'],
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
  let table = `Asset | Raw | Gzip | Status
--- | --- | --- | ---
`;
  data.forEach((item) => {
    let status = '✅ No Change';

    if (item.raw > 0) {
      status = '⛔️ Size Increased';
    } else if (item.raw < 0) {
      status = '✂️ Size Decreased';
    }

    const fileName = item.file;
    const rawFormattedDiff = prettyBytes(item.raw, { signed: true });
    const gzipFormattedDiff = prettyBytes(item.gzip, { signed: true });

    table += `${fileName}|${rawFormattedDiff}|${gzipFormattedDiff}|${status}\n`;
  });

  return table;
}

export function buildOutputText(output) {
  const files = Object.keys(output).map(key => ({
    file: key,
    raw: output[key].raw,
    gzip: output[key].gzip,
  }));

  let outputText = '### Asset Size Comparison\n\n';

  outputText += reportTable(files);

  return outputText.trim();
}

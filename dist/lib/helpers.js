"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOutputText = exports.getAssetSizes = exports.getPullRequest = exports.diffSizes = exports.normaliseFingerprint = void 0;
// @ts-nocheck
const prettyBytes = require("pretty-bytes");
const exec_1 = require("@actions/exec");
const asset_size_reporter_1 = require("asset-size-reporter");
const fs = require("fs");
const path = require("path");
function normaliseFingerprint(obj) {
    const normalisedObject = {};
    Object.keys(obj).forEach((key) => {
        const match = key.match(/dist\/assets\/([\w-]+)-\w{32}(.\w+)/);
        if (match) {
            const [, fileName, extension] = match;
            normalisedObject[`${fileName}${extension}`] = obj[key];
        }
        else {
            console.log(`Ignoring file ${key} as it does not match known asset file pattern`);
        }
    });
    return normalisedObject;
}
exports.normaliseFingerprint = normaliseFingerprint;
function diffSizes(baseBranch, pullRequestBranch) {
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
        }
        else {
            diffObject[key] = {
                raw: newSize.raw - originSize.raw,
                gzip: newSize.gzip - originSize.gzip,
            };
        }
        // TODO cater for deleted files
    });
    return diffObject;
}
exports.diffSizes = diffSizes;
async function getPullRequest(context, octokit) {
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
exports.getPullRequest = getPullRequest;
async function getAssetSizes({ cwd, build = true }) {
    if (build) {
        if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
            await exec_1.exec('yarn --frozen-lockfile', [], { cwd });
        }
        else {
            await exec_1.exec('npm ci', [], { cwd });
        }
        await exec_1.exec('npx ember build -prod', [], { cwd });
    }
    let prAssets;
    await asset_size_reporter_1.assetSizeReporter({
        patterns: ['dist/assets/**.js', 'dist/assets/**.css'],
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
exports.getAssetSizes = getAssetSizes;
function reportTable(data) {
    let table = `File | raw | gzip
--- | --- | ---
`;
    data.forEach((item) => {
        table += `${item.file}|${prettyBytes(item.raw, { signed: true })}|${prettyBytes(item.gzip, { signed: true })}\n`;
    });
    return table;
}
function buildOutputText(output) {
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
        }
        else if (file.raw < 0) {
            smaller.push(file);
        }
        else {
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
exports.buildOutputText = buildOutputText;

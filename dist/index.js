module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 868:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// eslint-disable-next-line
;
module.exports = __nccwpck_require__(945);

if (process.env.NODE_ENV !== 'TEST') {
  // execute the run() function
  module.exports.default();
}


/***/ }),

/***/ 945:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {

"use strict";
// ESM COMPAT FLAG
__nccwpck_require__.r(__webpack_exports__);

// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  "default": () => /* binding */ run
});

// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/core
var core = __nccwpck_require__(235);
// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/exec
var exec = __nccwpck_require__(346);
// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github
var github = __nccwpck_require__(887);
// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");;
var external_path_default = /*#__PURE__*/__nccwpck_require__.n(external_path_namespaceObject);

// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?yn
var _notfoundyn = __nccwpck_require__(535);
var _notfoundyn_default = /*#__PURE__*/__nccwpck_require__.n(_notfoundyn);

// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?pretty-bytes
var _notfoundpretty_bytes = __nccwpck_require__(808);
var _notfoundpretty_bytes_default = /*#__PURE__*/__nccwpck_require__.n(_notfoundpretty_bytes);

// EXTERNAL MODULE: ../../../.nvm/versions/node/v14.10.1/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?asset-size-reporter
var _notfoundasset_size_reporter = __nccwpck_require__(585);
var _notfoundasset_size_reporter_default = /*#__PURE__*/__nccwpck_require__.n(_notfoundasset_size_reporter);

// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");;
var external_fs_default = /*#__PURE__*/__nccwpck_require__.n(external_fs_namespaceObject);

// CONCATENATED MODULE: ./lib/helpers.js






function normaliseFingerprint(obj) {
  const normalisedObject = {};

  Object.keys(obj).forEach((key) => {
    const match = key.match(/dist\/assets\/([\w-]+)-\w{32}(.\w+)/);

    if (match) {
      const [, fileName, extension] = match;
      normalisedObject[`${fileName}${extension}`] = obj[key];
    } else {
      console.log(`Ignoring file ${key} as it does not match known asset file pattern`);
    }
  });

  return normalisedObject;
}

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

async function getAssetSizes({ cwd, build = true }) {
  if (build) {
    if (external_fs_default().existsSync(external_path_default().join(cwd, 'yarn.lock'))) {
      await (0,exec.exec)('yarn --frozen-lockfile', [], { cwd });
    } else {
      await (0,exec.exec)('npm ci', [], { cwd });
    }

    await (0,exec.exec)('npx ember build -prod', [], { cwd });
  }

  let prAssets;

  await _notfoundasset_size_reporter_default()({
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


function reportTable(data) {
  let table = `File | raw | gzip
--- | --- | ---
`;
  data.forEach((item) => {
    table += `${item.file}|${_notfoundpretty_bytes_default()(item.raw, { signed: true })}|${_notfoundpretty_bytes_default()(item.gzip, { signed: true })}\n`;
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

// CONCATENATED MODULE: ./main.js








async function getActionInputs() {
  const workingDirectory = (0,core.getInput)('working-directory', { required: false });
  const usePrArtifacts = _notfoundyn_default()((0,core.getInput)('use-pr-artifacts', { required: false }));
  const token = (0,core.getInput)('repo-token', { required: true });

  const cwd = external_path_default().join(process.cwd(), workingDirectory);
  (0,core.debug)(`cwd: ${cwd}`);
  (0,core.debug)(`token: ${token}`);

  return { token, cwd, usePrArtifacts };
}

async function diffAssets({ pullRequest, cwd, usePrArtifacts }) {
  const prAssets = await getAssetSizes({ cwd, build: !usePrArtifacts });

  await (0,exec.exec)(`git checkout ${pullRequest.base.sha}`, [], { cwd });

  const masterAssets = await getAssetSizes({ cwd, build: true });

  const fileDiffs = diffSizes(
    normaliseFingerprint(masterAssets),
    normaliseFingerprint(prAssets),
  );


  return fileDiffs;
}

async function commentOnPR({ octokit, pullRequest, fileDiffs }) {
  const body = buildOutputText(fileDiffs);

  try {
    await octokit.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: pullRequest.number,
      body,
    });
  } catch (e) {
    console.error(e);
    console.log(`Could not create a comment automatically. This could be because github does not allow writing from actions on a fork.

See https://github.community/t5/GitHub-Actions/Actions-not-working-correctly-for-forks/td-p/35545 for more information.`);

    console.log(`Copy and paste the following into a comment yourself if you want to still show the diff:

${body}`);
  }
}


async function run() {
  try {
    const { token, cwd, usePrArtifacts } = await getActionInputs();

    const octokit = new github.GitHub(token);

    const pullRequest = await getPullRequest(github.context, octokit);
    const fileDiffs = await diffAssets({ pullRequest, cwd, usePrArtifacts });

    await commentOnPR({ octokit, pullRequest, fileDiffs });
  } catch (error) {
    console.error(error);

    (0,core.setFailed)(error.message);
  }
}


/***/ }),

/***/ 235:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 346:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 887:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 585:
/***/ ((module) => {

module.exports = eval("require")("asset-size-reporter");


/***/ }),

/***/ 808:
/***/ ((module) => {

module.exports = eval("require")("pretty-bytes");


/***/ }),

/***/ 535:
/***/ ((module) => {

module.exports = eval("require")("yn");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__nccwpck_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => module['default'] :
/******/ 				() => module;
/******/ 			__nccwpck_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(868);
/******/ })()
;
const spawn = require("cross-spawn");
const path = require("path");
const fs = require("fs");
const util = require("util");
const Mustache = require("mustache");
const opener = require("opener");
const { delay } = require("nanodelay");

const { install } = require("./deps.js");
const { handleProcessExit } = require("./process.js");
const { runScript } = require("./scriptsLoader.js");
const { log } = require("./log.js");
const { write, read } = require("./package.js");

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const copyFile = util.promisify(fs.copyFile);

const BASE_PORT = 7823;

const IS_TEST = process.env.NODE_ENV === "test";

const STYLE_ENGINES = {
  css: { ext: "css", packages: [] },
  less: { ext: "less", packages: [] },
  sass: { ext: "scss", packages: ["sass", "stylelint-scss"] },
};
/**
 * Add some magic to package.json
 * @param {object} content package.json contents
 * @param {boolean} isYarn Using yarn package manager
 * @param {object} styleEngine Styling engine
 * @param {string} styleEngine.ext Styling engine file extention
 * @returns {object}
 */
function addBasicScripts(content, isYarn, styleEngine) {
  content.main = "./src/js/index.js";

  content.browserslist = ["defaults"];

  content.scripts = {
    build: "parcel build src/index.html",
    dev: `parcel src/index.html --port ${BASE_PORT}`,
    lint: isYarn
      ? "yarn lint:js && yarn lint:css"
      : "npm run lint:js && npm run lint:css",
    "lint:js": "eslint src/**/*.js --no-error-on-unmatched-pattern",
    "lint:css": `stylelint "src/**/*.${styleEngine.ext}"`,
  };

  log("🧟‍ Scripts added");

  return content;
}
/**
 * Inject eslint
 * @param {string} root Project root folder
 * @returns {Promise<void>}
 */
async function injectEslint(root) {
  const srcStylePath = path.join(__dirname, "templates/eslintrc.json");
  const dstStylePath = path.join(root, ".eslintrc");

  await copyFile(srcStylePath, dstStylePath);

  log("👮‍ ESLint injected");
}
/**
 * Inject stylelint
 * @param {string} root Project root folder
 * @param {object} styleEngine Styling engine
 * @param {string} styleEngine.ext Styling engine file extention
 * @returns {Promise<void>}
 */
async function injectStylelint(root, styleEngine) {
  const srcStylePath = path.join(__dirname, "templates/stylelintrc.mustache");
  const dstStylePath = path.join(root, ".stylelintrc");

  const template = await readFile(srcStylePath, "utf-8");

  let plugins = "";
  let rules = "";

  if (styleEngine.ext === "scss") {
    plugins = `,\n  "plugins": ["stylelint-scss"]`;
    rules = `,\n  "rules": {\n    "at-rule-no-unknown": null,\n    "scss/at-rule-no-unknown": true\n  }`;
  }

  const stylelintConfig = Mustache.render(template, {
    plugins,
    rules,
  });

  await writeFile(dstStylePath, stylelintConfig);

  log("👨‍🎨 Stylelint injected");
}
/**
 * Inject lefthook
 * @param {string} root Project root folder
 * @param {boolean} isYarn Using yarn package manager
 * @param {object} styleEngine Styling engine
 * @param {string} styleEngine.ext Styling engine file extention
 * @returns {Promise<void>}
 */
async function injectLefthook(root, isYarn, styleEngine) {
  const srcStylePath = path.join(__dirname, "templates/lefthook.mustache");
  const dstStylePath = path.join(root, "lefthook.yml");

  const template = await readFile(srcStylePath, "utf-8");

  const hooksContent = Mustache.render(template, {
    runner: isYarn ? "yarn" : "npm run",
    stylesExt: styleEngine.ext,
  });

  await writeFile(dstStylePath, hooksContent);

  log("🥊 Lefthook injected");
}
/**
 * Inject posthtmlrc file
 * @param {string} root Project root folder
 * @returns {Promise<void>}
 */
async function injectPosthtml(root) {
  const srcStylePath = path.join(__dirname, "templates/posthtmlrc.json");
  const dstStylePath = path.join(root, ".posthtmlrc");

  await copyFile(srcStylePath, dstStylePath);

  log("📚 Posthtml injected");
}
/**
 * Add js-friendly gitignore file
 * @param {string} root Project root folder
 * @param {boolean} isYarn Using yarn package manager
 * @returns {Promise<void>}
 */
async function addGitignore(root, isYarn) {
  const srcStylePath = path.join(__dirname, "templates/gitignore");
  const dstStylePath = path.join(root, ".gitignore");

  await copyFile(srcStylePath, dstStylePath);

  let ignoreLock = "yarn.lock";

  if (isYarn) {
    ignoreLock = "package-lock.json";
  }

  await appendFile(dstStylePath, `\n${ignoreLock}\n`);

  log("🙈 Gitignore added");
}
/**
 * Add js-friendly gitignore file
 * @param {string} root Project root folder
 * @returns {Promise<void>}
 */
async function addPostcssConfig(root) {
  const srcStylePath = path.join(__dirname, "templates/postcssrc.json");
  const dstStylePath = path.join(root, ".postcssrc");

  await copyFile(srcStylePath, dstStylePath);

  log("✡️  PostCSS config added");
}
/**
 * Creates basic readme file
 * @param {string} root Project root folder
 * @param {boolean} isYarn Using yarn package manager
 * @param {string} projectName Just a project name
 * @returns {Promise<void>}
 */
async function addReadme(root, isYarn, projectName) {
  const srcStylePath = path.join(__dirname, "templates/readme.mustache");
  const dstStylePath = path.join(root, "README.md");

  const template = await readFile(srcStylePath, "utf-8");

  const readmeContent = Mustache.render(template, {
    projectName,
    manager: isYarn ? "Yarn" : "NPM",
    commands: {
      start: `${isYarn ? "yarn" : "npm run"} dev`,
      build: `${isYarn ? "yarn" : "npm run"} build`,
      lint: `${isYarn ? "yarn" : "npm run"} lint`,
    },
  });

  await writeFile(dstStylePath, readmeContent);

  log("📖 Readme injected");
}
/**
 * Creates project index file
 * @param {object} params Params object
 * @param {string} params.projectRoot Project root folder
 * @param {string} params.projectName Project name
 * @param {object} params.styleEngine Styling engine
 * @param {string} params.styleEngine.ext Styling engine file extention
 * @param {string} params.lang Target language
 * @returns {Promise<void>}
 */
async function createIndex({
  projectRoot,
  projectName,
  styleEngine,
  lang = "en",
}) {
  const templatePath = path.join(__dirname, "templates/index.mustache");
  const template = await readFile(templatePath, "utf-8");
  const styleExt = styleEngine.ext;

  const indexContent = Mustache.render(template, {
    projectName,
    styleExt,
    lang,
  });
  const destinationPath = path.join(projectRoot, "src", "index.html");

  await writeFile(destinationPath, indexContent);

  const srcStylePath = path.join(__dirname, "templates/index.css");
  const dstStylePath = path.join(
    projectRoot,
    "src",
    "styles",
    `index.${styleExt}`
  );

  await copyFile(srcStylePath, dstStylePath);

  const srcScriptPath = path.join(__dirname, "templates/index.js");
  const dstScriptPath = path.join(projectRoot, "src", "js", `index.js`);

  await copyFile(srcScriptPath, dstScriptPath);

  log("🏗  Created site root");
}
/**
 * Init git repository at the project root
 * @param {string} root Project root
 * @returns {Promise<void>}
 */
function initGit(root) {
  return new Promise((resolve, reject) => {
    const command = "git";
    const args = ["init", root];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}
/**
 * Init yarn project at the requred root
 * @param {string} root Project root
 * @returns {Promise<void>}
 */
function init(root) {
  return new Promise((resolve, reject) => {
    const command = "npm";
    const args = ["init", "-y"];

    const process = spawn(command, args, { stdio: "inherit", cwd: root });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}
/**
 * Create new project directory and setup project
 * @param {object} argv Project creation arguments.
 * @param {string} argv.name Project name
 * @param {boolean} argv.less Using less in project
 * @param {boolean} argv.sass Using sass in project
 * @param {string[]} argv.scripts Postinstall scripts list
 * @returns {Promise<void>}
 */
async function setupProject(argv) {
  let styleEngine;

  if (argv.less) {
    styleEngine = STYLE_ENGINES.less;
  } else if (argv.sass) {
    styleEngine = STYLE_ENGINES.sass;
  } else {
    styleEngine = STYLE_ENGINES.css;
  }

  await mkdir(argv.name, { recursive: true });

  const isYarn = Boolean(argv.yarn);
  const projectRoot = path.join(process.cwd(), argv.name);
  const projectName = path.basename(argv.name);
  const getPath = path.join.bind(this, projectRoot);

  await init(projectRoot);

  await initGit(projectRoot);

  await install({
    root: projectRoot,
    deps: [
      "eslint",
      "eslint-config-prettier",
      "stylelint",
      "stylelint-config-recommended",
      "stylelint-config-prettier",
      "@arkweid/lefthook",
      "prettier",
      "parcel",
      "parcel-plugin-clean-dist",
      "autoprefixer@9.8.6",
      "posthtml",
      "posthtml-modules",
      ...styleEngine.packages,
    ],
    isDev: true,
    isYarn,
  });

  const packageContent = await read(projectRoot);

  addBasicScripts(packageContent, isYarn, styleEngine);

  await Promise.all([
    write(projectRoot, packageContent),
    mkdir(getPath("dist")),
    mkdir(getPath("src")),
    mkdir(getPath("scripts")),
    injectEslint(projectRoot),
    injectStylelint(projectRoot, styleEngine),
    injectPosthtml(projectRoot),
    injectLefthook(projectRoot, isYarn, styleEngine),
    addPostcssConfig(projectRoot),
    addReadme(projectRoot, isYarn, projectName),
    addGitignore(projectRoot, isYarn),
  ]);

  const keepfile = ".gitkeep";

  await Promise.all([
    mkdir(getPath("src", "images")),
    mkdir(getPath("src", "fonts")),
    mkdir(getPath("src", "js")),
    mkdir(getPath("src", "styles")),
    writeFile(getPath("scripts", keepfile), ""),
  ]);

  await Promise.all([
    createIndex({ projectRoot, projectName, styleEngine }),
    writeFile(getPath("src", "images", keepfile), ""),
    writeFile(getPath("src", "fonts", keepfile), ""),
    writeFile(getPath("src", "js", keepfile), ""),
  ]);

  const allScripts = {};

  if (argv.scripts && argv.scripts.length) {
    for (const id of argv.scripts) {
      const { scripts } = await runScript(id, projectRoot, isYarn);

      Object.assign(allScripts, scripts);
    }
  }

  {
    const packageContent = await read(projectRoot);

    Object.assign(packageContent.scripts, allScripts);

    await write(projectRoot, packageContent);
  }

  log("🚀 We are ready to launch...");

  if (IS_TEST) return;

  const args = ["run", "dev"];

  spawn(isYarn ? "yarn" : "npm", args, {
    stdio: "inherit",
    cwd: projectRoot,
  });

  await delay(2500);

  opener(`http://localhost:${BASE_PORT}`);
}

module.exports = setupProject;

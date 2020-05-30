const spawn = require("cross-spawn");
const path = require("path");
const fs = require("fs");
const util = require("util");
const Mustache = require("mustache");
const opener = require("opener");
const { delay } = require("nanodelay");

const log = require("./log.js");

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const copyFile = util.promisify(fs.copyFile);

const BASE_PORT = 7823;

const STYLE_ENGINES = {
  css: { ext: "css", packages: [] },
  less: { ext: "less", packages: [] },
  sass: { ext: "scss", packages: ["sass"] },
};
/**
 * Callback generator for process exit callbacks.
 * @param {function} resolve Promise resolve callback
 * @param {function} reject Promise reject callback
 * @param {string} command Command invoked
 * @param {string[]} args Command args invoked
 */
function handleProcessExit(resolve, reject, command, args) {
  return (code) => {
    if (code !== 0) {
      return reject({
        command: `${command} ${args.join(" ")}`,
      });
    }
    resolve();
  };
}
/**
 * Add some magic to package.json
 * @param {string} root Project root folder
 * @param {boolean} isYarn Using yarn package manager
 * @param {object} styleEngine Styling engine
 * @param {string} styleEngine.ext Styling engine file extention
 * @returns {Promise<void>}
 */
async function modifyPackageFile(root, isYarn, styleEngine) {
  const packageJSONPath = path.join(root, "package.json");

  let packageJSONCOntent = JSON.parse(await readFile(packageJSONPath, "utf-8"));

  packageJSONCOntent["browserslist"] = ["defaults"];

  packageJSONCOntent["scripts"] = {
    build: "parcel build src/index.html",
    dev: `parcel src/index.html --port ${BASE_PORT}`,
    lint: isYarn
      ? "yarn lint:js && yarn lint:css"
      : "npm run lint:js && npm run lint:css",
    "lint:js": "eslint src/**/*.js --no-error-on-unmatched-pattern",
    "lint:css": `stylelint "src/**/*.${styleEngine.ext}"`,
  };

  await writeFile(packageJSONPath, JSON.stringify(packageJSONCOntent, null, 2));

  log("🧟‍ Precommit hooks added");
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
 * @returns {Promise<void>}
 */
async function injectStylelint(root) {
  const srcStylePath = path.join(__dirname, "templates/stylelintrc.json");
  const dstStylePath = path.join(root, ".stylelintrc");

  await copyFile(srcStylePath, dstStylePath);

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
    const command = "yarn";
    const args = ["--cwd", root, "init", "-y"];

    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", handleProcessExit(resolve, reject, command, args));
  });
}
/**
 * Install primary dependencies at project directory
 * @param {object} params
 * @param {string} params.root Project root
 * @param {string[]} params.deps Dependencies list
 * @param {boolean} params.isDev Install as dev dependencies
 * @param {boolean} params.isYarn Using Yarn package manager
 * @returns {Promise<void>}
 */
function install({ root, deps = [], isYarn, isDev = false }) {
  return new Promise((resolve, reject) => {
    const command = isYarn ? "yarn" : "npm";
    const args = [isYarn ? "add" : "install", ...deps];

    if (isDev) args.push("-D");

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
 * @returns {Promise<void>}
 */
async function setupProject(argv) {
  const projectName = argv.name;
  let styleEngine;

  if (argv.less) {
    styleEngine = STYLE_ENGINES.less;
  } else if (argv.sass) {
    styleEngine = STYLE_ENGINES.sass;
  } else {
    styleEngine = STYLE_ENGINES.css;
  }

  const isYarn = Boolean(argv.yarn);

  await mkdir(projectName);

  const projectRoot = path.join(process.cwd(), projectName);
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
      "autoprefixer",
      "posthtml",
      "posthtml-modules",
      ...styleEngine.packages,
    ],
    isDev: true,
    isYarn,
  });

  await Promise.all([
    mkdir(getPath("dist")),
    mkdir(getPath("src")),
    injectEslint(projectRoot),
    injectStylelint(projectRoot),
    injectPosthtml(projectRoot),
    injectLefthook(projectRoot, isYarn, styleEngine),
    addPostcssConfig(projectRoot),
    addReadme(projectRoot, isYarn, projectName),
    modifyPackageFile(projectRoot, isYarn, styleEngine),
    addGitignore(projectRoot, isYarn),
  ]);

  await Promise.all([
    mkdir(getPath("src", "images")),
    mkdir(getPath("src", "fonts")),
    mkdir(getPath("src", "js")),
    mkdir(getPath("src", "styles")),
  ]);

  const keepfile = ".gitkeep";

  await Promise.all([
    createIndex({ projectRoot, projectName, styleEngine }),
    writeFile(getPath("src", "images", keepfile), ""),
    writeFile(getPath("src", "fonts", keepfile), ""),
    writeFile(getPath("src", "js", keepfile), ""),
  ]);

  log("🚀 We are ready to launch...");

  const args = ["run", "dev"];

  spawn(isYarn ? "yarn" : "npm", args, {
    stdio: "inherit",
    cwd: projectRoot,
  });

  await delay(2500);

  opener(`http://localhost:${BASE_PORT}`);
}

module.exports = setupProject;

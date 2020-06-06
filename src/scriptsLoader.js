const axios = require("axios");
const { nanoid } = require("nanoid");
const fs = require("fs");
const { join } = require("path");
const { promisify } = require("util");

const { log, err } = require("./log.js");
const { install } = require("./deps.js");

const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const rmdir = promisify(fs.rmdir);

const GIST_API = "https://api.github.com/gists/";

const parseJSON = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    err("Error while parsing data");
  }

  return null;
};

const runScript = async (id, projectRoot, isYarn) => {
  const url = `${GIST_API}${id}`;
  const suffix = nanoid();
  const tmpName = `tmp-${suffix}`;
  const tmpPath = join(projectRoot, tmpName);

  try {
    log("Script contents loading started.");

    const { data } = await axios.get(url);

    const files = Object.keys(data.files);

    await mkdir(tmpPath);

    const deps = [];
    const scripts = {};
    const filesList = [];

    for (const file of files) {
      const fileData = data.files[file];

      if (file === "deps.json") {
        const innDeps = parseJSON(fileData.content);

        if (innDeps) deps.push(...innDeps);

        continue;
      }

      if (file === "scripts.json") {
        const innScripts = parseJSON(fileData.content);

        if (innScripts) Object.assign(scripts, innScripts);

        continue;
      }

      const filePath = join(tmpPath, fileData.filename);

      await writeFile(filePath, fileData.content);

      filesList.push({
        path: filePath,
        name: fileData.filename,
      });
    }

    log("Script contents loaded.");

    if (deps.length) {
      const devDeps = [];
      const plainDeps = [];

      for (const dep of deps) {
        const parts = dep.split(":");

        if (parts[1] === "dev") {
          devDeps.push(parts[0]);
        } else {
          plainDeps.push(parts[0]);
        }
      }

      if (devDeps.length) {
        await install({
          root: projectRoot,
          deps: devDeps,
          isDev: true,
          isYarn,
        });
      }

      if (plainDeps.length) {
        await install({
          root: projectRoot,
          deps: plainDeps,
          isDev: false,
          isYarn,
        });
      }
    }

    if (filesList.length) {
      log("Starting copy files.");

      const scriptsPath = join(projectRoot, "scripts");

      for (const { path, name } of filesList) {
        let targetPath = join(scriptsPath, name);

        if (await exists(targetPath)) {
          err("Filenames conflict!");
          err("Adding suffix...");

          const suffix = nanoid(4);
          const tmpName = `${suffix}-${name}`;
          targetPath = join(scriptsPath, tmpName);

          err(`Added suffix, at the moment file name is "${tmpName}"`);

          err(`Make sure you'll fix the issue before start script.`);
        }

        await copyFile(path, targetPath);
      }

      log("Copy finished.");
    }

    log("Cleaning up...");

    const contents = await readdir(tmpPath);

    for (const item of contents) {
      await unlink(join(tmpPath, item));
    }

    await rmdir(tmpPath);

    log("Done");

    return { scripts };
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

module.exports = { runScript };

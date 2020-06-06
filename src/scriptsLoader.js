const axios = require("axios");
const { nanoid } = require("nanoid");
const fs = require("fs");
const { join } = require("path");
const { promisify } = require("util");

const { install } = require("./deps");

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const rmdir = promisify(fs.rmdir);

const GIST_API = "https://api.github.com/gists/";

const isSudo = () => {
  // TODO check windows as well
  return Boolean(process.getuid && process.getuid() === 0);
};
// - scripts.json
// {
//   "scriptName": "echo kek",
// }
// - deps.json
// ["dep1:dev", "dep2:dev", "dep3", "dep4"]
// - index.js
// interface Index {
//   run: async () => {}
// }
const parseJSON = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error while parsing data");
  }

  return null;
};

const runScript = async (id, projectRoot, isYarn) => {
  if (isSudo()) {
    console.error("Error: Running Feanor as root is extremely dangerous.");
    console.error("Please, repeat the command with common access rights.");
    process.exit(1);
  }

  const url = `${GIST_API}${id}`;
  const suffix = nanoid();
  const tmpName = `tmp-${suffix}`;
  const tmpPath = join(projectRoot, tmpName);

  try {
    console.log("Script contents loading started.");

    const { data } = await axios.get(url);

    const files = Object.keys(data.files);

    await mkdir(tmpPath);

    const deps = [];
    const scripts = {};
    let hasIndex = false;

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

      if (file === "index.js") hasIndex = true;

      await writeFile(join(tmpPath, fileData.filename), fileData.content);
    }

    console.log("Script contents loaded.");

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

    if (hasIndex) {
      console.log("Script execution started.");

      const { run } = require(join(tmpPath, "index.js"));

      await run();

      console.log("Script execution finished.");
    }

    console.log("Cleaning up...");

    const contents = await readdir(tmpPath);

    for (const item of contents) {
      await unlink(join(tmpPath, item));
    }

    await rmdir(tmpPath);

    console.log("Done");

    return { scripts };
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

module.exports = { runScript };

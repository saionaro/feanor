const { join } = require("path");
const fs = require("fs");
const util = require("util");

const { err } = require("./log.js");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const getPath = (root) => join(root, "package.json");

async function read(root) {
  try {
    return JSON.parse(await readFile(getPath(root), "utf-8"));
  } catch (e) {
    err(e);
    return null;
  }
}

async function write(root, content) {
  try {
    await writeFile(getPath(root), JSON.stringify(content, null, 2));
  } catch (e) {
    err(e);
  }
}

module.exports = { read, write };

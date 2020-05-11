const fs = require("fs");
const { promisify } = require("util");

const copyFile = promisify(fs.copyFile);

const run = async () => {
  try {
    await copyFile("./src/templates/binary.js", "./bin/feanor.js");
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();

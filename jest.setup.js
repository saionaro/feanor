const path = require("path");
const { exec } = require("child_process");

global.cli = (args, cwd) => {
  return new Promise((resolve) => {
    exec(
      `node ${path.resolve("./src/index")} ${args.join(" ")}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        });
      }
    );
  });
};

global.runCmd = (cmd, args, cwd) => {
  return new Promise((resolve) => {
    exec(`${cmd} ${args.join(" ")}`, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr,
      });
    });
  });
};

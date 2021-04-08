const { join } = require("path");
const fs = require("fs");
const { promisify } = require("util");

const exists = promisify(fs.exists);

const PROJECT_DIR = "tests/temp/npm-css";
const STYLE_PATH = join(PROJECT_DIR, "src", "styles", "index.css");

jest.setTimeout(1000 * 60 * 3); // 3 mins

beforeAll(async (done) => {
  await global.cli(["init", PROJECT_DIR], ".");
  done();
});

describe("npm-css", () => {
  test("should have css file", async () => {
    const result = await exists(STYLE_PATH);

    expect(result).toBeTruthy();
  });

  test("lint:js should work", async () => {
    let lintResult = await global.runCmd(
      "npm",
      ["run", "lint:js"],
      PROJECT_DIR
    );

    expect(lintResult.code).toBe(0);
  });

  test("lint:css should work", async () => {
    let lintResult = await global.runCmd(
      "npm",
      ["run", "lint:css"],
      PROJECT_DIR
    );

    expect(lintResult.code).toBe(0);
  });

  test("build should work", async () => {
    let lintResult = await global.runCmd("npm", ["run", "build"], PROJECT_DIR);

    expect(lintResult.code).toBe(0);
  });
});

const { join } = require("path");
const fs = require("fs");
const { promisify } = require("util");

const exists = promisify(fs.exists);

const PROJECT_DIR = "tests/temp/npm-sass";

jest.setTimeout(1000 * 60 * 2); // 2 mins

beforeAll(async (done) => {
  await global.cli(["init", PROJECT_DIR, "--sass"], ".");
  done();
});

describe("npm-sass", () => {
  test("should have less file", async () => {
    const stylePath = join(PROJECT_DIR, "src", "styles", "index.scss");

    const result = await exists(stylePath);

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
});

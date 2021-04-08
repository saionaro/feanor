const { join } = require("path");
const fs = require("fs");
const { promisify } = require("util");

const exists = promisify(fs.exists);
const appendFile = promisify(fs.appendFile);

const PROJECT_DIR = "tests/temp/npm-less";
const STYLE_PATH = join(PROJECT_DIR, "src", "styles", "index.less");

jest.setTimeout(1000 * 60 * 3); // 3 mins

beforeAll(async (done) => {
  await global.cli(["init", PROJECT_DIR, "--less"], ".");
  await appendFile(
    STYLE_PATH,
    `\n\n.my-mixin {
      color: black;
    }
    .my-other-mixin() {
      background: white;
    }
    .class {
      .my-mixin();
      .my-other-mixin();
    }`
  );

  done();
});

describe("npm-less", () => {
  test("should have scss file", async () => {
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

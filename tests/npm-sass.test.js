const { join } = require("path");
const fs = require("fs");
const { promisify } = require("util");

const exists = promisify(fs.exists);
const appendFile = promisify(fs.appendFile);

const PROJECT_DIR = "tests/temp/npm-sass";
const STYLE_PATH = join(PROJECT_DIR, "src", "styles", "index.scss");

jest.setTimeout(1000 * 60 * 3); // 3 mins

beforeAll(async (done) => {
  await global.cli(["init", PROJECT_DIR, "--sass"], ".");
  await appendFile(
    STYLE_PATH,
    `\n\n@mixin reset-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  @mixin horizontal-list {
    @include reset-list;
  
    li {
      display: inline-block;
      margin: {
        left: -2px;
        right: 2em;
      }
    }
  }
  
  nav ul {
    @include horizontal-list;
  }`
  );

  done();
});

describe("npm-sass", () => {
  test("should have less file", async () => {
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

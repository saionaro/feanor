# Feanor [![Build Status](https://travis-ci.org/Saionaro/feanor.svg?branch=master)](https://travis-ci.org/Saionaro/feanor) [![npm version](https://badge.fury.io/js/feanor.svg)](https://badge.fury.io/js/feanor)

The tool for creating modern static web sites. Via the only command you get an environment ready for development.

## New Project Initialization

First of all install Feanor globally:

`yarn global add feanor`

Then just create new project with the command:
`feanor init myProjectName`

Also, the bizarre (and recommended) way of using Feanor is `npx`. In this case, you should not install something globally:

`npx feanor init myProjectName`

## Options

| Name        | Type        | Default value | Description                                                                                                           |
| ----------- | ----------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--less`    | `boolean`   | false         | Use [less](http://lesscss.org) in project.<br>Only one `--less` or `--sass` allowed to be used.                       |
| `--sass`    | `boolean`   | false         | Use [scss](https://sass-lang.com) in project.<br>Only one `--less` or `--sass` allowed to be used.                    |
| `--npm`     | `boolean`   | true          | Use NPM.<br>Only one `--npm` or `--yarn` allowed to be used.                                                          |
| `--yarn`    | `boolean[]` | false         | Use [Yarn](https://yarnpkg.com).<br>Only one `--npm` or `--yarn` allowed to be used.                                  |
| `--scripts` | `string[]`  | []            | Postinstall script ids splitted via whitespace to execute.<br>See **Post-install scripts** below for more information |

Example options usage:

`npx feanor init myProjectName --sass --yarn`

## Post-install Scripts

Feanor post-install scripts are normally just Github Gists with additional project contents including dependencies and scrips.

Post-install script Gists can contain two special files:

1. `deps.json` - NPM-packages list to install. Add suffix `:dev` to install things as dev dependencies.

```
["axios", "jsdom:dev"]
```

2. `scripts.json` - additional scripts for your `package json`.

```
{
  "optimize-images": "node ./scripts/optimizer.js"
}
```

Take a look [here](https://gist.github.com/Saionaro/a20915c22d3c8481c4a7c2e6b6a1faa3) for example.

All additional files will be downloaded in directory `scripts` in your project directory. In case of names conflict, Feanor'll add a random prefix.

Gist ID means a hash, wich normally follows after author's username. For example `a20915c22d3c8481c4a7c2e6b6a1faa3` is Gist ID in url below:

`https://gist.github.com/Saionaro/a20915c22d3c8481c4a7c2e6b6a1faa3`

You also can specify the exact gist revision after a slash symbol, like below:

`a20915c22d3c8481c4a7c2e6b6a1faa3/f11bd725edbbfe7f8b9d2776a4f9b036aaea310c`

**In the case of missing revision SHA, Feanor will use the latest revision. Beware this in case of an untrusted script provider.**

Below the example with postinstall scripts:

`npx feanor i project --sass --scripts a20915c22d3c8481c4a7c8e6b6a1faa3/f11bd725edbbfe7f8b9d2776a4f9b036aaea310c a20915c22dfcf481c3a7c2e6b6a1fna4`

In this example we tell Feanor to install exact revision for script and the the latest version for another script as well.

# Feanor [![Build Status](https://travis-ci.org/Saionaro/feanor.svg?branch=master)](https://travis-ci.org/Saionaro/feanor) [![npm version](https://badge.fury.io/js/feanor.svg)](https://badge.fury.io/js/feanor)

The tool for creating modern static web sites.

## New project initialization

First of all install Feanor globally:

`yarn global add feanor`

Then just create new project with the command:
`feanor init myProjectName`

Also bizarre (and recommended) way of using Feanor is `npx`. In this case you should not install something globally:

`npx feanor init myProjectName`

## Options

| Name               | Type     | Default value | Description |
| ------------------ | -------- | ------------- | ----------- |
| `--less` | `boolean` | false | Use [less](http://lesscss.org) in project.<br>Only one `--less` or `--sass` allowed to be used. |
| `--sass` | `boolean` | false | Use [scss](https://sass-lang.com) in project.<br>Only one `--less` or `--sass` allowed to be used. |
| `--npm` | `boolean` | true | Use NPM.<br>Only one `--npm` or `--yarn` allowed to be used. |
| `--yarn` | `boolean[]` | false | Use [Yarn](https://yarnpkg.com).<br>Only one `--npm` or `--yarn` allowed to be used. |

Example options usage:

`npx feanor init myProjectName --sass --yarn`

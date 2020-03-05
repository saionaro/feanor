# Feanor [![Build Status](https://travis-ci.org/Saionaro/feanor.svg?branch=master)](https://travis-ci.org/Saionaro/feanor)

The tool for creating modern static web sites.

## New project initialization

First of all install Feanor globally:

`yarn global add feanor`

Then just create new project with the command:
`feanor init myProjectName`

Also bizarre (and recommended) way of using Feanor is `npx`. In this case you should not install something globally:

`npx feanor init myProjectName`

You can specify what type of styling engine you prefer to use - plain `css`, `less`, or `sass`:

`npx feanor init myProjectName --less`

`npx feanor init myProjectName --sass`

Or just provide not any options:

`npx feanor init myProjectName`

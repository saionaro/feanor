function getReadme(name) {
  return `# ${name}

## Development

The project uses \`Node.js\` and \`yarn\`

To start development use command:

\`yarn dev\`

## Production

To create production build use following command:

\`yarn build\`

There will be a built project in \`dist\` folder.

`;
}

module.exports = getReadme;

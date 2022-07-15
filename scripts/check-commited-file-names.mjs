#!/usr/bin/env node

import * as Path from 'path';

const commitedFileNames = process.argv
  .slice(2) // remove the first two (executable and the script), rest of them are commited file names
  .map((fileName) => Path.basename(fileName));

/**
 * File naming check logic
 */
// examples:
// good file name => something-module.js
// bad file name => somethingModule.js
for (const commitedFileName of commitedFileNames) {
  if (commitedFileName.startsWith('Dockerfile')) {
    continue;
  }
  if (commitedFileName !== commitedFileName.toLowerCase()) {
    // this file name contains upper cased chars
    console.log(`
            Commited file ${commitedFileName} is not in the kebab-case but in the camelCase/PascalCase
        `);
    process.exit(1);
  }
}

/**
 * Sucsessful file naming check
 */
console.log(`
    Comitted files are properly named.
`);
process.exit(0);

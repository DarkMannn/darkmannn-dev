#!/usr/bin/env node

import * as Fs from 'fs';

/**
 * Dynamic vars
 */
const commitMessageFilePath = process.argv[2];
const commitMessage = Fs.readFileSync(commitMessageFilePath, 'utf-8');

/**
 * Constants
 */
const ALLOWED_COMMIT_TYPES = [
  'feat',
  'fix',
  'style',
  'deployment',
  'refactor',
  'test',
  'docs',
  'chore',
];

const STANDARD_ERROR_MSG = `
    Git commit message is not properly formatted.
    Example of a good commit message:

    > docs(readme): Create initial README.md file
`;

/**
 * Functions
 */
function abortTheCommit(message = STANDARD_ERROR_MSG) {
  console.log(`
    GIT COMMIT MESSAGE IN WRONG FORMAT!
    `);
  console.log(message);
  return process.exit(1);
}

/**
 * Formatting check logic
 */
// example git message =>
//     docs(readme): Create initial README.md file
const [
  typeWithLocation, // 'docs(readme)'
  message, // 'Create initial README.md file'
] = commitMessage.split(': ');

if (
  !typeWithLocation ||
  !typeWithLocation.length ||
  !message ||
  !message.length
) {
  abortTheCommit();
}

const [type, location] = typeWithLocation.split('(');
if (!type || !ALLOWED_COMMIT_TYPES.includes(type)) {
  abortTheCommit(`
    First word in a git commit message is a commit type and it must be one of the: ${ALLOWED_COMMIT_TYPES} 
    `);
}

if (!location.split(')')[0].length) {
  abortTheCommit(`
    You must enter a location inside parantheses to describe in what part of the codebase did the change happen.
    Example:

    > docs(/* insert here */): Create initial README.md file
    `);
}

if (message.trimEnd().endsWith('.')) {
  abortTheCommit(`
    Git message mustn't end with a dot ('.').
    `);
}

/**
 * Successfull formatting check
 */
console.log(`
    Git commit message is properly formatted.
`);
process.exit(0);

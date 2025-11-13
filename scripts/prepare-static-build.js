#!/usr/bin/env node

/**
 * Prepare for static export build
 *
 * Temporarily renames the API directory to exclude it from static export.
 * API routes are incompatible with static export and will cause build failures.
 *
 * The directory will be restored after the build completes.
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiDirBackup = path.join(__dirname, '..', 'src', 'app', '_api_backup');

console.log('Preparing for static export build...');

if (fs.existsSync(apiDir)) {
  console.log('  Temporarily renaming src/app/api to src/app/_api_backup');
  fs.renameSync(apiDir, apiDirBackup);
  console.log('  API routes excluded from build');
} else if (fs.existsSync(apiDirBackup)) {
  console.log('  API directory already backed up');
} else {
  console.log('  No API directory found');
}

console.log('Static export preparation complete.');

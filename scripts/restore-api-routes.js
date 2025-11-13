#!/usr/bin/env node

/**
 * Restore API routes after static export build
 *
 * Renames the backed-up API directory back to its original location.
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiDirBackup = path.join(__dirname, '..', 'src', 'app', '_api_backup');

console.log('Restoring API routes...');

if (fs.existsSync(apiDirBackup)) {
  console.log('  Renaming src/app/_api_backup back to src/app/api');
  fs.renameSync(apiDirBackup, apiDir);
  console.log('  API routes restored');
} else if (fs.existsSync(apiDir)) {
  console.log('  API directory already exists');
} else {
  console.log('  No backup directory found to restore');
}

console.log('API routes restoration complete.');

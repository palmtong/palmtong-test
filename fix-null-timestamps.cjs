#!/usr/bin/env node
/**
 * Fix NULL values in timestamp fields
 * Replace NULL with current timestamp for syscreate and sysupdate
 */

const fs = require('fs');

const inputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong-test/palmtong-data-only.sql';
const outputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong-test/palmtong-data-fixed.sql';

console.log('Reading data file...');
const content = fs.readFileSync(inputFile, 'utf8');

console.log('Fixing NULL timestamps...');
const fixed = content
  // Replace NULL in syscreate/sysupdate fields with a default timestamp
  .replace(/, NULL\)/g, ", '2011-01-01 00:00:00')")
  .replace(/, NULL,/g, ", '2011-01-01 00:00:00',")
  // Fix any remaining NULL values at end of lines before closing paren
  .replace(/NULL\);$/gm, "'2011-01-01 00:00:00');");

console.log('Writing fixed file...');
fs.writeFileSync(outputFile, fixed, 'utf8');

console.log(`✓ Fix complete!`);
console.log(`  Input:  ${inputFile}`);
console.log(`  Output: ${outputFile}`);
console.log(`  Size:   ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);

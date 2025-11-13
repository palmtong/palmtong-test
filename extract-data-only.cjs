#!/usr/bin/env node
/**
 * Extract only INSERT statements from converted SQL
 * Skip all CREATE TABLE and other DDL statements
 */

const fs = require('fs');

const inputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong-test/palmtong-d1.sql';
const outputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong-test/palmtong-data-only.sql';

console.log('Reading converted SQL file...');
const content = fs.readFileSync(inputFile, 'utf8');

console.log('Extracting INSERT statements only...');
const lines = content.split('\n');
const dataLines = [];
let insideInsert = false;

for (const line of lines) {
  // Start of INSERT statement
  if (line.trim().startsWith('INSERT INTO')) {
    insideInsert = true;
    dataLines.push(line);
  }
  // Continue multi-line INSERT
  else if (insideInsert) {
    dataLines.push(line);
    // End of INSERT when we hit semicolon
    if (line.trim().endsWith(';')) {
      insideInsert = false;
    }
  }
}

const result = dataLines.join('\n');

console.log('Writing data-only file...');
fs.writeFileSync(outputFile, result, 'utf8');

console.log(`✓ Extraction complete!`);
console.log(`  Input:  ${inputFile}`);
console.log(`  Output: ${outputFile}`);
console.log(`  Size:   ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Lines:  ${dataLines.length}`);

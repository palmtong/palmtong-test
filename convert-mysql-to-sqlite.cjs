#!/usr/bin/env node
/**
 * Convert MySQL dump to SQLite-compatible SQL
 * Removes MySQL-specific syntax and makes it compatible with D1
 */

const fs = require('fs');
const path = require('path');

const inputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong.sql';
const outputFile = '/Users/mac/Projects/palmtong/_palmtong/palmtong-test/palmtong-d1.sql';

console.log('Reading MySQL dump file...');
const content = fs.readFileSync(inputFile, 'utf8');

console.log('Converting to SQLite format...');
let converted = content
  // Remove MySQL-specific SET commands
  .split('\n')
  .filter(line => !line.startsWith('SET '))
  .filter(line => !line.startsWith('/*!'))
  .filter(line => !line.match(/^--/))
  // Remove MySQL-specific syntax
  .map(line => line
    .replace(/COLLATE utf8_unicode_ci/g, '')
    .replace(/COLLATE utf8mb4_unicode_ci/g, '')
    .replace(/CHARACTER SET utf8/g, '')
    .replace(/CHARACTER SET utf8mb4/g, '')
    .replace(/ENGINE=InnoDB[^;]*;/g, ';')
    .replace(/DEFAULT CHARSET=utf8[^;]*/g, '')
    .replace(/AUTO_INCREMENT=\d+/g, '')
    .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
    .replace(/unsigned/g, '')
    .replace(/` int\(/g, '` INTEGER(')
    .replace(/COMMENT '[^']*'/g, '')
  )
  .join('\n');

// Remove CREATE DATABASE and USE DATABASE commands
converted = converted.replace(/CREATE DATABASE.*?;/gs, '');
converted = converted.replace(/USE `.*?`;/g, '');

// Remove multiple empty lines
converted = converted.replace(/\n\n+/g, '\n\n');

console.log('Writing SQLite-compatible file...');
fs.writeFileSync(outputFile, converted, 'utf8');

console.log(`✓ Conversion complete!`);
console.log(`  Input:  ${inputFile}`);
console.log(`  Output: ${outputFile}`);
console.log(`  Size:   ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);

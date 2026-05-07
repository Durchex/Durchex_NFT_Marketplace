import express from 'express';
import { parse as originalParse } from 'path-to-regexp';

// Override path-to-regexp to catch the error
const parse = function(str, options) {
  try {
    return originalParse.call(this, str, options);
  } catch (err) {
    console.error('PATH-TO-REGEXP ERROR parsing:', JSON.stringify(str));
    console.error('Error:', err.message);
    throw err;
  }
};

// Monkey patch the parse function
import * as pathToRegexp from 'path-to-regexp';
pathToRegexp.parse = parse;

// Now try to import the server
try {
  await import('./server.js');
  console.log('Server imported successfully');
} catch (err) {
  console.error('Failed to import server:', err.message);
  console.error('Stack:', err.stack);
}
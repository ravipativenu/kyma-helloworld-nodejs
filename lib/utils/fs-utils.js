'use strict';

const fs = require('fs');

module.exports = {
  isFile: function(path) {
    try {
      return fs.statSync(path).isFile();
    } catch (error) {
      return false;
    }
  },

  isDirectory: function(path) {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      return false;
    }
  }
};
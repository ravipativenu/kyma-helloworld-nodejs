'use strict';

var debug = require('debug')('xsenv');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var VError = require('verror');

exports.loadCertificates = loadCertificates;

// Let’s assume certPath is a string with two paths: "path/to/cert1.pem:path/to/cert2.pem" (using : as the delimiter on Unix systems).
// The output will be an array containing the contents of cert1.pem and cert2.pem

function loadCertificates(certPath) {
  assert(!certPath || typeof certPath === 'string', 'certPath argument should be a string');

  certPath = certPath || process.env.XS_CACERT_PATH;
  if (certPath) {
    debug('Loading certificate(s) %s', certPath);
    try {
      // Splitting Paths: certPath.split(path.delimiter) splits the certPath string into an array of paths using the system’s path delimiter
      // (e.g., : on Unix, ; on Windows).
      // Reading Files: The map function iterates over each path and reads the file synchronously using fs.readFileSync(f).
      return certPath
        .split(path.delimiter)
        .map(function (f) {
          return fs.readFileSync(f);
        });
    } catch (err) {
      throw new VError(err, 'Could not load certificate(s) ' + certPath);
    }
  }
}



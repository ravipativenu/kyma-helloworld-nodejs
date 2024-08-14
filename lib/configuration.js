'use strict';

const _ = require('lodash');

const environment = require('./environment');
const environmentConfig = require('./configuration/env-config');

module.exports.load = function(options) {

  let workingDir = environment.getWorkingDirectory(options.workingDir, options.xsappConfig);
  let envConfig = environmentConfig.load(workingDir);
  let routerConfig = envConfig;
  return routerConfig;

}


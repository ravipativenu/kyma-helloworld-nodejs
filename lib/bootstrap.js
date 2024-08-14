'use strict';

const loggerUtil = require('./utils/logger');
const configuration = require('./configuration');

module.exports = function bootstrap(options) {

  let logger = loggerUtil.getLogger('/bootstrap');
  logger.info("Bootstrap started");
  const routerConfig = configuration.load(options);
  return routerConfig;
};


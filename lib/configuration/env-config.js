'use strict';

const _ = require('lodash');
const logger = require('../utils/logger').getLogger('/Configuration');
const path = require('path');
const xsenv = require('@sap/xsenv');
const destinationUtils = require('../utils/destination-utils');
const validators = require('./validators');

exports.load = load;
exports.loadDestinations = loadDestinations;

function load(workingDir) {
  const filePath = path.join(workingDir, 'default-env.json');

  // load variables from default-env.json to entironment variables
  xsenv.loadEnv(filePath);

  let envConfig = {};
  envConfig.destinations = loadDestinations();
 
  return envConfig;
}

function loadDestinations(destinations) {
  destinations = destinations || loadJsonVar('destinations');
  if (!destinations) {
    destinations = {};
    logger.info('Using empty destinations to run');
    return destinations;
  }
  destinationUtils.normalizeDestinationProperties(destinations);
  validators.validateDestinations(destinations);
  return destinations;
}

function loadJsonVar(envVar) {
  if (envVar in process.env) {
    try {
      return JSON.parse(process.env[envVar]);
    } catch (e) {
      throw new VError(e, 'Invalid value for environment variable %s', envVar);
    }
  }
}

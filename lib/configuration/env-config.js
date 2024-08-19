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
  destinationUtils.adjustDestinationProperties(destinations);
  // _.keyBy: This is a Lodash function that creates an object composed of keys generated from the results of running each element of a collection through a function.
  // In this case, the function is simply accessing a property of each element.
  // destinations: This is the array of objects you are working with.
  // Each object in the array likely represents a destination with various properties, including a name property.
  // 'name': This is the property of each object in the destinations array that you want to use as the key for the new object.
  // So, _.keyBy(destinations, 'name') will transform the destinations array into an object where each key is the value of the name property from the original array, and the corresponding value is the entire object from the array.
  // Example:
  // Input:
  // const destinations = [
  //   { name: 'Paris', country: 'France' },
  //   { name: 'Tokyo', country: 'Japan' },
  //   { name: 'New York', country: 'USA' }
  // ];
  // Output:
  // {
  //   Paris: { name: 'Paris', country: 'France' },
  //   Tokyo: { name: 'Tokyo', country: 'Japan' },
  //   NewYork: { name: 'New York', country: 'USA' }
  // }
  return _.keyBy(destinations, 'name');
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

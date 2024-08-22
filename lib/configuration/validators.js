'use strict';

const _ = require('lodash');
const URI = require('urijs');
const JsonValidator = require('../utils/JsonValidator');
const envDestinationsSchema = require('./schemas/environment-destinations-schema.json');
const serviceDestinationsSchema = require('./schemas/service-destinations-schema.json');
const destinationsSchema = require('./schemas/destinations-schema.json');
const vcapUtils = require('../utils/vcap-utils');

module.exports = {
  validateDestinations: function (destinations) {
    const validator = new JsonValidator();
    validator.addFormat('no-duplicate-names', function (destinations) {
      // [ { "name": "Paris", "country": "France" }, { "name": "New York", "country": "USA" }, { "name": "Paris", "country": "France" }, { "name": "Tokyo", "country": "Japan" } ]
      // 1. Chainind Functions: _.chain(destinations): Starts a chain sequence in lodash, allowing multiple operations to be performed on the destinations array
      // 2. Counting Names: The .countBy('name') part counts the occurrences of each name
      // { "Paris": 2, "New York": 1, "Tokyo": 1 }
      // 3. Filtering Duplicates: The .pickBy(function (count) { return count > 1; }) part filters out names that appear more than once
      // { "Paris": 2 }
      // 4. Extracting Keys: The .keys() part extracts the keys (names) of the filtered object
      // ["Paris"]
      // 5. Final Value: The .value() part ends the chain and returns the final array of duplicate names
      // ["Paris"]
      const duplicates = _.chain(destinations).countBy('name').pickBy(function (count) {
        return count > 1;
      }).keys().value();
      if (duplicates.length > 0) {
        return 'Duplicate destination names: ' + duplicates;
      }
    });
    validator.addFormat('valid-port', function (proxyPort) {
      return validatePort(proxyPort, 'Destination "proxyPort"');
    });
    validator.addFormat('absolute-uri', validateAbsoluteUri);
    validator.addSchema('serviceDestinationsSchema', serviceDestinationsSchema);
    validator.addSchema('envDestinationsSchema', envDestinationsSchema);
    const validateConnectivityCredentials = this.validateConnectivityCredentials;
    let connectivityCreds;
    validator.validate(destinations, destinationsSchema, 'destinations');
    destinations.forEach(function (destination) {
      if (destination.authentication) { // if it destination from destinations service
        validator.validate(destination, serviceDestinationsSchema, 'service-destinations');
      } else {
        validator.validate(destination, envDestinationsSchema, 'environment-destinations');
      }
      if (destination.forwardAuthToken === true && destination.authentication && destination.authentication !== 'NoAuthentication') {
        throw 'Destination \"' + destination.name +
        ' - ForwardAuthToken parameter cannot be used in destinations with authentication type not equal NoAuthentication';
      }
      if (destination.proxyType === 'OnPremise') {
        if (destination.forwardAuthToken) {
          throw 'in destination \"' + destination.name +
          ' - ForwardAuthToken parameter cannot be used in destinations with proxyType onPremise';
        }
        if (!connectivityCreds) {
          connectivityCreds = vcapUtils.getServiceCredentials({tag: 'connectivity'});
          if (!connectivityCreds) {
            throw 'Destination \"' + destination.name +
            '\" with  ProxyType \"OnPremise\" but connectivity service is not bound.';
          }
        }
        validateConnectivityCredentials(connectivityCreds);
      }
    });
  },

  validateConnectivityCredentials: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('absolute-uri', validateAbsoluteUri);
    validator.validate(options, connectivitySchema, 'connectivity-configuration');
  },

  validateApprouterStartOptions: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('valid-port', function (port) {
      if (port === 0) {
        return;
      }
      return validatePort(port, 'Approuter port');
    });
    validator.addFormat('function', function functionFormat(data) {
      if (typeof data !== 'function') {
        return 'Function expected';
      }
    });
  
    validator.validate(options, approuterOptionsSchema, 'options');
  }
  

}

function validatePort(port, messagePrefix) {
  const portMinValue = 1;
  const portMaxValue = 65535;
  // Check if port is a string: If port is a string, it uses a regular expression (/^[1-9]\d*$/) to check if it represents a positive integer
  if (typeof port === 'string' && !/^[1-9]\d*$/.test(port)) {
    return messagePrefix + ' value is string, which cannot be parsed as positive integer';
  }
  // This line converts the port value to a floating-point number.
  port = parseFloat(port);
  // Check if port is within the valid range: If the port value is less than portMinValue or greater than portMaxValue, it returns an error
  if (port < portMinValue || port > portMaxValue) {
    return messagePrefix + ' value has to be string or integer between ' + portMinValue + '-' + portMaxValue;
  }
}


function validateAbsoluteUri(uri) {
  // This line uses a URI.parse method to parse the given URI into its components (e.g., protocol, hostname, path, etc.)
  const components = URI.parse(uri);
  if (!components.protocol || !components.hostname) {
    return 'URI must be absolute';
  }
  const supportedProtocols = ['http', 'https', 'ws', 'wss'];
  // The function uses lodash’s _.includes method to check if the protocol of the parsed URI is in the supportedProtocols array.
  if (!_.includes(supportedProtocols, components.protocol)) {
    return 'URI has unsupported protocol, supported protocols are ' + supportedProtocols;
  }
}




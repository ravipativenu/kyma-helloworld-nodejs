'use strict';

const _ = require('lodash');

exports.normalizeDestinationProperties = normalizeDestinationProperties;
exports.adjustDestinationProperties = adjustDestinationProperties;


function normalizeDestinationProperties(destinations) {
  if (!destinations) {
    return;
  }
  if (!Array.isArray(destinations)) {
    throw new Error('destinations type invalid, array is expected');
  }
  destinations.forEach(function (destination, i, destinations) {
    if (destinations[i].Authentication) { // if it destination from destinations service
      destinations[i] = normalizeDestination(destination);
      destinations[i].forwardAuthToken = destinations[i].forwardAuthToken === 'true' || destinations[i].forwardAuthToken === true;
      destinations[i].forwardAuthCertificates = destinations[i].forwardAuthCertificates === 'true' || destinations[i].forwardAuthCertificates === true;
      destinations[i].preserveHostHeader = destinations[i].preserveHostHeader === 'true' || destinations[i].preserveHostHeader === true;
      destinations[i].dynamicDestination = (destinations[i].hasOwnProperty('dynamicDestination') && destinations[i].dynamicDestination ? destinations[i].dynamicDestination.toLowerCase() === 'true' : false)  || destinations[i].dynamicDestination === true;
      destinations[i].trustAll = destinations[i].trustAll === 'true' || destinations[i].trustAll === true;
      if (destinations[i].hasOwnProperty('setXForwardedHeaders')) {
        destinations[i].setXForwardedHeaders = destinations[i].setXForwardedHeaders === 'true' || destinations[i].setXForwardedHeaders === true;
      }
      if (destinations[i].timeout && !isNaN(destinations[i].timeout)) {
        destinations[i].timeout = _.toSafeInteger(destinations[i].timeout);
      }
    }
  });
}

function normalizeDestination(destination) {
  if (!destination) {
    return;
  }
  let keys = Object.keys(destination);
  let n = keys.length;
  let newobj = {};
  let key;
  while (n--) {
    key = keys[n];
    if (key === 'URL') {
      newobj[key.toLowerCase()] = destination[key];
    } else {
      let value = destination[key];
      key = key.replace('HTML5.', '');
      let newKey = key.substr(0, 1).toLowerCase() + key.substr(1);
      newobj[newKey] = value;
    }
  }
  return newobj;
}

function adjustDestinationProperties(destinations) {
  destinations.forEach(function (destination) {
    if (destination.proxyType === 'OnPremise') {
      try {
        let credentials = vcapUtils.getServiceCredentials({tag: 'connectivity'});
        destination['proxyHost'] = credentials.onpremise_proxy_host;
        destination['proxyPort'] = credentials.onpremise_proxy_port;
      } catch (error) {
        // eslint-disable-next-line no-useless-escape
        throw 'Destination \"' + destination.name +
        // eslint-disable-next-line no-useless-escape
        '\" with  ProxyType \"OnPremise\" but connectivity service is not bound.';
      }
    }
    _.defaults(destination, {
      timeout: 30000
    });
  });
}

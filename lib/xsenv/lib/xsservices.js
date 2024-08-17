'use strict';

var VError = require('verror');
var debug = require('debug')('xsenv');
var fs = require('fs');
var serviceFilter = require('./filter');
const readCFServices = require('./cfservice').readCFServices;


exports.loadDefaultServices = loadDefaultServices;
exports.filterServices = filterServices;

function loadDefaultServices(servicesFile) {
  var defaultServices = {};
  if (servicesFile !== null) {
    servicesFile = servicesFile || 'default-services.json';
    if (fs.existsSync(servicesFile)) {
      debug('Loading default service configuration from %s', servicesFile);
      try {
        defaultServices = JSON.parse(fs.readFileSync(servicesFile, 'utf8'));
      } catch (err) {
        throw new VError(err, 'Could not parse %s', servicesFile);
      }
    }
  }
  return defaultServices;
}


/**
 * Filters for service in service configuration from CloudFoundry (environment variable <code>VCAP_SERVICES</code>)
 * or mounted K8S secrets if no results found in <code>VCAP_SERVICES</code>.
 *
 * @param path {string} A string containing the mount path where the secrets are located in K8S.
 * @param filter Filter used to find a bound service, see filterCFServices
 * @return Array of objects representing all found service instances (credentials and its meta data)
 * @throws Error in case no or multiple matching services are found
 */
function filterServices(arg1, arg2) {
  const path = (arguments.length === 1) ? undefined : arg1;
  const filter = (arguments.length === 1) ? arg1 : arg2;
  //console.log(readCFServices());
  //console.log(filter);
  let filterResults = serviceFilter.apply(readCFServices(), filter);
  debug('CF Service filter with filter: %s, returned: %s.', filter, filterResults);
  // if (!filterResults || (filterResults && Array.isArray(filterResults) && !filterResults.length)) {
  //   filterResults = serviceFilter.apply(readServiceBindingServices(path), filter);
  //   debug('Service Binding Services filter with filter: %s and path: %s, returned: %s.', filter, (path ? path : 'default'), filterResults);
  // }
  // if (!filterResults || (filterResults && Array.isArray(filterResults) && !filterResults.length)) {
  //   filterResults = serviceFilter.apply(readK8SServices(path), filter);
  //   debug('K8s Service filter with filter: %s and path: %s, returned: %s.', filter, (path ? path : 'default'), filterResults);
  // }

  return filterResults;
}


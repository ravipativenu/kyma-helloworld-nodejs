'use strict';

const fs = require('fs');
const tracer = require('./logger').getTracer(__filename);
const xsenv = require('@sap/xsenv');
const serviceCredentialsCache = {};
const loggerUtil = require('./logger');

let logger = loggerUtil.getLogger('/vcap-utils');

module.exports = {
  getAppEnv: function () {
    let appEnv = {};
    let vcap = process.env.VCAP_APPLICATION;
    if (vcap) {
      try {
        appEnv = JSON.parse(vcap);
      } catch (err) {
        logger.info('vcap-utils: Could not parse VCAP_APPLICATION!', err);
      }
    }
    setName(appEnv);
    return appEnv;
  },

  getDestEnv: function () {
    logger.info("getDestEnv started");
    let appEnv = {};
    let vcap = process.env.destinations;
    if (vcap) {
      try {
        appEnv = JSON.parse(vcap);
      } catch (err) {
        tracer.debug('vcap-utils: Could not parse VCAP_APPLICATION!', err);
      }
    }
    setName(appEnv);
    return appEnv;
  },

  getServiceCredentials : function (options) {
    const cacheKey = JSON.stringify(options);
    let errorOccurred;
    let credentials = getCachedCredentials(cacheKey);
    if (credentials){
      if (credentials.notFound) {
        return null;
      } else {
        return credentials;
      }
    }

    try {
      credentials = xsenv.serviceCredentials(options);
    } catch (e) {
      errorOccurred = true;
    }
    if (errorOccurred || !credentials) {
      tracer.debug('service credentials with options ' + JSON.stringify(options) + ' not found');
      module.exports.setCachedCredentials(cacheKey, {notFound: true});
      return null;
    }
    module.exports.setCachedCredentials(cacheKey, credentials);
    return credentials;
  },

  getCredentialsBySapCloudService: function(serviceName, ignoreDots){
    const cacheKey = ignoreDots ? serviceName + 'ignoreDots' : serviceName;

    let credentials = getCachedCredentials(cacheKey);
    if (credentials){
      return credentials;
    }

    try {
      credentials =  xsenv.serviceCredentials(function (service) {
        let vcapSrvServiceName;
        if (service.credentials && service.credentials['sap.cloud.service.alias']) {
          vcapSrvServiceName = ignoreDots ? service.credentials['sap.cloud.service.alias'].replace(/\./g, '') : service.credentials['sap.cloud.service.alias'];
          if (vcapSrvServiceName === serviceName) {
            return true;
          }
        }

        if (service.credentials && service.credentials['sap.cloud.service']) {
          vcapSrvServiceName = ignoreDots ? service.credentials['sap.cloud.service'].replace(/\./g, '') : service.credentials['sap.cloud.service'];
          if (vcapSrvServiceName === serviceName) {
            return true;
          }
        }

        if (service.tags) {
          for (let i = 0; i < service.tags.length; i++) {
            vcapSrvServiceName = ignoreDots ? service.tags[i].replace(/\./g, '') : service.tags[i];
            if (serviceName === vcapSrvServiceName) {
              return true;
            }
          }
        }
        return false;
      });
    } catch (e) {
      tracer.debug('service credentials for service ' + serviceName + ' not found');
    }
    module.exports.setCachedCredentials(cacheKey, credentials);
    return credentials;
  },
  setCachedCredentials: function(cacheKey, credentials) {
    const cacheServiceCredentials = loadJsonVar('CACHE_SERVICE_CREDENTIALS');
    if (cacheServiceCredentials && credentials){
      credentials.cached = true;
      serviceCredentialsCache[cacheKey] = credentials;
    }
  },

  loadJsonVar: function (envVar) {
    if (envVar in process.env) {
      try {
        return JSON.parse(process.env[envVar]);
      } catch (e) {
        throw new Error(`Invalid value for environment variable ${envVar}`);
      }
    }
  }

};

function getCachedCredentials(cacheKey){
  const cacheServiceCredentials = loadJsonVar('CACHE_SERVICE_CREDENTIALS');
  if (cacheServiceCredentials){
    return serviceCredentialsCache[cacheKey];
  }
}

function setName(appEnv) {
  if (appEnv.name || appEnv.application_name) {
    return;
  }
  try {
    let packageJsonAsStr = fs.readFileSync('package.json', 'utf8');
    let packageJson = JSON.parse(packageJsonAsStr);
    if (packageJson.name) {
      appEnv.name = packageJson.name;
    }
  } catch (err) {
    tracer.debug('vcap-utils: Could not read from package.json', err);
  }
}

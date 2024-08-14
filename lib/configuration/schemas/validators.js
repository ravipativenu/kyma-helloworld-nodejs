'use strict';

const _ = require('lodash');
const URI = require('urijs');
const path = require('path');
const VError = require('verror').VError;
const JsonValidator = require('../utils/JsonValidator');
const fsUtils = require('../utils/fs-utils');
const businessServiceUtils = require('../utils/business-service-utils');
const xsAppSchema = require('./schemas/xs-app-schema');
const sourceSchema = require('./schemas/refs/source-schema');
const scopesSchema = require('./schemas/refs/scopes-schema');
const cookiesSchema = require('./schemas/cookies-schema');
const pluginsSchema = require('./schemas/plugins-schema');
const headersSchema = require('./schemas/headers-schema');
const whitelistSchema = require('./schemas/whitelist-schema');
const environmentSchema = require('./schemas/environment-schema');
const envDestinationsSchema = require('./schemas/environment-destinations-schema');
const serviceDestinationsSchema = require('./schemas/service-destinations-schema.json');
const destinationsSchema = require('./schemas/destinations-schema.json');
const approuterOptionsSchema = require('./schemas/options-schema');
const uaaOptionsSchema = require('./schemas/uaa-config-schema');
const iasOptionsSchema = require('./schemas/ias-config-schema');
const corsSchema = require('./schemas/refs/cors-schema');
const connectivitySchema = require('./schemas/connectivity-config-schema');
const html5RepoCredSchema = require('./schemas/html5-repo-credentials-schema');
const businessServiceSchema = require('./schemas/business-service-credentials-schema');
const extSessionMgtSchema = require('./schemas/ext-session-mgt-schema');
const zoneInfoSchema = require('./schemas/zone-info-schema.json');
const destinationUtils = require('../utils/destination-utils');
const vcapUtils = require('../utils/vcap-utils');
const urlSchema = require('./schemas/url-schema.json');
let regexErr;

module.exports = {
  validateSessionStoreInstance: function (extSessionMgt) {
    const validator = new JsonValidator();
    validator.validate(extSessionMgt, extSessionMgtSchema, 'EXT_SESSION_MGT');
    if (!vcapUtils.getServiceCredentials({name: extSessionMgt.instanceName})) {
      throw new VError('Environment variable EXT_SESSION_MGT_INSTANCE with value ' + extSessionMgt.instanceName + ' defined but no matching external session management service instance is bound');
    }
  },

  validateXsApp: function (configuration, envDestinations, directory) {
    addConfigurationDefaults(configuration);

    const validator = new JsonValidator();
    validator.addSchema('sourceSchema', sourceSchema);
    validator.addSchema('scopesSchema', scopesSchema);
    validator.addSchema('corsSchema', corsSchema);
    validator.addFormat('relative-uri', validateRelativeUri);
    validator.addFormat('local-file', validateLocalFile.bind(null, directory));
    validator.addFormat('uri', validateUri);
    validator.addFormat('regex', validateRegex);
    validator.addFormat('valid-header-value', validateHeaderValue);
    validator.addFormat('headers-rules', validateHeaderRules);
    const destinationServiceBound = destinationUtils.getDestinationServiceCredentials();

    validator.addFormat('route-rules', function (route) {
      if (!route.destination && !route.localDir && !route.service) {
        return 'Route does not have a destination nor a localDir nor a service';
      }
      if (route.destination) {
        if (envDestinations && !envDestinations[route.destination] && !destinationServiceBound && !route.destination.includes('$') && route.destination !== '*') {
          return 'Route references unknown destination "' + route.destination + '"';
        }
        if (route.localDir) {
          return 'Route has both localDir and destination';
        }
      }
      if (route.preferLocal && !route.destination) {
        return 'Route specifies preferLocal but no destination specified';
      }
      if (route.service && route.service === 'sap-approuter-userapi') {
        return;
      }
      if (route.service && !process.env.SAAS_APPROUTER) {
        const serviceCredentials = businessServiceUtils.getCredentials(route.service, false);
        const html5AppsRepoTags = ['html5-apps-repo-rt',
          'html5-apps-rt',
          'html5-apps-repo-dt',
          'html5-apps-dt'];
        if (serviceCredentials === null) {
          return 'A route requires access to ' + route.service + ' service but the service is not bound.';
        }
        if (route.destination) {
          return 'Route has both destination and service';
        }
        if (route.localDir) {
          return 'Route has both localDir and service';
        }
        if (route.endpoint) {
          const endPoint = route.endpoint;
          if (serviceCredentials.endpoints) {
            if (!serviceCredentials.endpoints[endPoint]) {
              return 'Endpoint object has no attribute named ' + endPoint + ' for service ' + route.service;
            }
          } else if (!serviceCredentials[endPoint]) {
            return 'No ' + endPoint + ' property and no endpoints object provided in the service credentials as endpoint for service ' + route.service;
          }
        } else {
          if (!serviceCredentials.url && !serviceCredentials.uri) {
            return 'Service ' + route.service + ' has no endpoints, url or uri defined in credentials';
          }
        }
        if (html5AppsRepoTags.indexOf(route.service) < 0) { // business service, different tag than for html5 apps repo
          try {
            validator.validate(serviceCredentials, businessServiceSchema, 'business-service');
          } catch (err) {
            if (err.message.includes('No enum match for:')) { //
              return 'User credential service is not supported by approuter ' + err.message;
            }
            return err.message;
          }
        } else {
          validator.validate(serviceCredentials, html5RepoCredSchema, 'html5-repo-credentials');
        }
      }
      if (route.identityProvider && route.authenticationType && route.authenticationType !== 'xsuaa') {
        return 'Route has both identityProvider and authenticationType that is not of type \'xsuaa\'';
      }
      if (route.localDir) {
        const fullPath = path.join(directory, route.localDir);
        if (!fsUtils.isDirectory(fullPath)) {
          return fullPath + ' is not a directory';
        }

        if (Array.isArray(route.httpMethods)) {
          return 'Route has both localDir and httpMethods';
        }
      } else {
        const forbiddenProperties = ['replace'];
        for (let i = 0; i < forbiddenProperties.length; i++) {
          if (route[forbiddenProperties[i]]) {
            return 'Route has ' + forbiddenProperties[i] + ' with no localDir';
          }
        }
      }
    });

    validator.addFormat('logout-rules', function (logout) {
      if (logout.logoutPage && !logout.logoutEndpoint) {
        return 'Logout page is set although logout endpoint is not configured';
      }
      if (logout.csrfProtection !== undefined && logout.logoutMethod !== 'POST') {
        return 'Unable to set csrfProtection when logout method is not POST';
      }
    });

    validator.validate(configuration, xsAppSchema, 'xs-app.json');

    const routeDestinations = _.map(configuration.routes || [], 'destination').filter(_.identity);
    const unusedDestinations = _.difference(Object.keys(configuration.destinations || {}), routeDestinations);
    if (unusedDestinations.length > 0) {
      throw new VError('Destination(s) "%s" not used by any route', unusedDestinations);
    }
  },

  validateCookies: function (cookies) {
    const validator = new JsonValidator();
    validator.validate(cookies, cookiesSchema, 'Cookies environment variable');
    if (cookies.Partitioned){
      const invalidRegex = Object.values(cookies.Partitioned).filter(v => validateRegex(v) instanceof Error);
      if (invalidRegex.length > 0){
        throw new Error(`Invalid regular expression ${invalidRegex.join(' ')}`);
      }
    }
  },

  validateZoneInfo: function (zoneInfo) {
    const validator = new JsonValidator();
    validator.validate(zoneInfo, zoneInfoSchema, 'zone info');
  },

  validateDestinations: function (destinations) {
    const validator = new JsonValidator();
    validator.addFormat('no-duplicate-names', function (destinations) {
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

  validateEnvironmentSettings: function (configuration) {
    const validator = new JsonValidator();
    validator.addFormat('regexWithCapture', validateRegexWithCapture);
    validator.validate(configuration, environmentSchema, 'environment-settings');
  },

  validatePlugins: function (configuration, envDestinations) {
    const validator = new JsonValidator();
    validator.addSchema('sourceSchema', sourceSchema);
    validator.addSchema('scopesSchema', scopesSchema);
    validator.addSchema('corsSchema', corsSchema);
    validator.addFormat('regex', validateRegex);
    validator.addFormat('relative-uri', validateRelativeUri);

    validator.addFormat('plugin-rules', function (plugin) {
      if (envDestinations && plugin.destination && !envDestinations[plugin.destination]) {
        return 'Plugin references destination "' + plugin.destination + '", which cannot be found in the environment';
      }
    });

    validator.validate(configuration, pluginsSchema, 'plugins');
  },

  validateHeaders: function (configuration) {
    const validator = new JsonValidator();
    validator.addFormat('valid-header-value', validateHeaderValue);
    validator.addFormat('headers-rules', validateHeaderRules);
    validator.validate(configuration, headersSchema, 'http-headers');
  },

  validateWhitelist: function (whitelist) {
    const validator = new JsonValidator();
    validator.addFormat('hostname-rules', function (listItem) {
      const regexHostName = /^(\*\.)?(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;
      const regexIPHostName = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

      if (!(regexHostName.test(listItem.host) || regexIPHostName.test(listItem.host))) {
        return 'Whitelist item\'s host "' + listItem.host + '" is not correct. Possible values allow valid hostname, IP or hostname prefixed with *.';
      }
    });

    validator.addFormat('valid-port', function (port) {
      return validatePort(port, 'Whitelist item\'s port');
    });

    validator.validate(whitelist, whitelistSchema, 'clickjack-whitelist');
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
  },

  validateUaaOptions: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('absolute-uri', validateAbsoluteUri);

    validator.validate(options, uaaOptionsSchema, 'uaa-configuration');
  },

  validateIasOptions: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('absolute-uri', validateAbsoluteUri);

    validator.validate(options, iasOptionsSchema, 'ias-configuration');
  },


  validateConnectivityCredentials: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('absolute-uri', validateAbsoluteUri);

    validator.validate(options, connectivitySchema, 'connectivity-configuration');
  },

  validateClientCredentials: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('absolute-uri', validateAbsoluteUri);
    if (options.uaa && options.uaa.clientid && options.uaa.clientid.length > 0
      && ((options.uaa.clientsecret && options.uaa.clientsecret.length > 0) || options.uaa.certificate)
      && options.uaa.url && options.uaa.url.length > 0) {
      validator.validate(options.uaa.url, urlSchema, 'url-schema');
      return;
    } else if (options.clientid && options.clientid.length > 0
      && ((options.clientsecret && options.clientsecret.length > 0) || options.certificate)
      && options.url && options.url.length > 0) {
      validator.validate(options.url, urlSchema, 'url-schema');
      return;
    }
    throw new Error('No clientid or clientsercret provided');
  },

  validateCors: function (options) {
    const validator = new JsonValidator();
    validator.addFormat('regex', validateRegex);
    validator.addFormat('validateWhitelist', exports.validateWhitelist);
    validator.addSchema('sourceSchema', sourceSchema);
    validator.validate(options, corsSchema, 'cors-configuration');
  },

  validateType: function(value, property, expectedType) {
    if (value && typeof value !== expectedType) {
      throw new VError('"%s" is of type "%s" instead of type "%s"', property, typeof value, expectedType);
    }
  },

  checkStringOrRegex: function (value) {
    try {
      regexErr = validateRegexWithCapture(value);
    } catch (exception) {
      regexErr = true;
    }
    if (!regexErr) {
      return true;
    }
    if (typeof value === 'string') {
      return true;
    }
    return false;
  }
};

function addConfigurationDefaults(configuration) {
  const defaultSessionTimeoutInMinutes = 15;
  const defaultLoginCallback = '/login/callback';
  const websocketsEnabledByDefault = false;
  const compressionEnabledByDefault = true;

  _.defaultsDeep(configuration, {compression: {enabled: compressionEnabledByDefault}});
  configuration.sessionTimeout = configuration.sessionTimeout || defaultSessionTimeoutInMinutes;
  configuration.login = getPropertyValue(configuration, 'login', {callbackEndpoint: defaultLoginCallback});
  configuration.websockets = getPropertyValue(configuration, 'websockets', {enabled: websocketsEnabledByDefault});
}

function getPropertyValue(configObject, propertyName, defaultValue) {
  if (configObject.hasOwnProperty(propertyName)) {
    return configObject[propertyName];
  }
  return defaultValue;
}

function validateRelativeUri(relativeUri) {
  const components = URI.parse(relativeUri);
  if (components.protocol || components.hostname) {
    return 'URI must be a relative path';
  }
}

function validateLocalFile(directory, file) {
  const fullPath = path.join(directory, file);
  if (!fsUtils.isFile(fullPath)) {
    return fullPath + ' is not a file';
  }
}

function validateAbsoluteUri(uri) {
  const components = URI.parse(uri);
  if (!components.protocol || !components.hostname) {
    return 'URI must be absolute';
  }
  const supportedProtocols = ['http', 'https', 'ws', 'wss'];
  if (!_.includes(supportedProtocols, components.protocol)) {
    return 'URI has unsupported protocol, supported protocols are ' + supportedProtocols;
  }
}

function validateUri(uri) {
  const components = URI.parse(uri);
  if (components.protocol && components.protocol !== 'http' && components.protocol !== 'https') {
    return 'Supported schemes are \'http\' and \'https\'';
  }
}

function validateRegex(regex) {
  const regexToCheck = _.isObject(regex) ? regex.path : regex;
  try {
    RegExp(regexToCheck);
  } catch (exception) {
    return exception;
  }
}

function validateRegexWithCapture(regex) {
  const regexError = validateRegex(regex);
  if (regexError) {
    return regexError;
  }
  if (regex.indexOf('(') === -1) {
    return 'regular expression must contain a capturing group';
  }
}

function validatePort(port, messagePrefix) {
  const portMinValue = 1;
  const portMaxValue = 65535;
  if (typeof port === 'string' && !/^[1-9]\d*$/.test(port)) {
    return messagePrefix + ' value is string, which cannot be parsed as positive integer';
  }
  port = parseFloat(port);
  if (port < portMinValue || port > portMaxValue) {
    return messagePrefix + ' value has to be string or integer between ' + portMinValue + '-' + portMaxValue;
  }
}

function validateHeaderValue(headerValue) {
  // Inspired by Node.js: https://github.com/nodejs/node/blob/master/lib/_http_outgoing.js
  const headerValueIsValid = headerValue.split('').map(function (character) {
    return character.charCodeAt(0);
  }).every(function (charCode) {
    return (charCode > 31 && charCode <= 255 && charCode !== 127) || charCode === 9;
  });

  if (!headerValueIsValid) {
    return 'The header content contains invalid characters';
  }
}

function validateHeaderRules(header) {
  const name = _.isObject(header) ? Object.keys(header)[0] : header;
  const headerNamePattern = /^[!#$%&'*+\-.^_`|~0-9a-zA-Z]+$/; // http://tools.ietf.org/html/rfc7230#section-3.2.6
  if (!headerNamePattern.test(name)) {
    return `Header does not have a valid name -> "${name}" `;
  }

  const headerName = name.match(headerNamePattern)[0];
  if (headerName.toLowerCase() === 'set-cookie' || headerName.toLowerCase() === 'cookie') {
    return 'Headers "set-cookie" and "cookie" are not allowed in the additional headers';
  }
}
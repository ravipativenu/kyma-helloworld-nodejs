/* eslint-disable camelcase */
'use strict';

const LoggingLib = require('@sap/logging');
const appLoggingContext = LoggingLib.createAppContext();

module.exports.getLogger = function (loggerCategory) {
  return appLoggingContext.createLogContext().getLogger(loggerCategory);
};

module.exports.getTracer = function (location) {
  return appLoggingContext.createLogContext().getTracer(location);
};

module.exports.getExpressMiddleware = function () {
  return LoggingLib.middleware({appContext: appLoggingContext});
};

module.exports.createRequestContext = function (req) {
  // noinspection JSAnnotator
  return appLoggingContext.createLogContext({req});
};

module.exports.writeToAuditLog = function (req, loggingData, message, cb) {
  let userObject = checkPlan(req, loggingData);

  req.app.auditLogger.securityMessage(message)
    .by(userObject.user)
    .tenant(userObject.tenantid, userObject.subdomain)
    .log(cb);
};


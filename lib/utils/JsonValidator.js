'use strict';

// Wraps tv4 package
// Throws error with descriptive message on validation error
// Uses separate tv4 instance to avoid side effects

const tv4 = require('tv4');
const VError = require('verror').VError;

module.exports = JsonValidator;

function JsonValidator() {
  if (!(this instanceof JsonValidator)) {
    return new JsonValidator();
  }
  this._validator = tv4.freshApi();
}

JsonValidator.prototype.addSchema = function () {
  this._validator.addSchema.apply(this, arguments);
};

JsonValidator.prototype.addFormat = function () {
  this._validator.addFormat.apply(this, arguments);
};

JsonValidator.prototype.validate = function (data, schema, source) {
  if (!this._validator.validate.call(this._validator, data, schema)) {
    let err = this._validator.error;
    throw new VError('%s%s: %s',
      source || '',
      err.dataPath,
      err.message);
  }
};

JsonValidator.validate = function (data, schema, source) {
  new JsonValidator().validate(data, schema, source);
};
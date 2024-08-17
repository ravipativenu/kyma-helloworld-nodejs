'use strict';

const fs = require('fs');
const assert = require('assert');
const path = require('path');
const debug = require('debug')('xsenv');

exports.readServiceBindingServices = readServiceBindingServices;
exports.readFiles = readFiles;
exports.parseProperties = parseProperties;
exports.readBinding = readBinding;

const isDirectory = dirPath => fs.statSync(dirPath).isDirectory();

function readFiles(dirPath) {
  const result = {};
  for (const dirEntry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const filePath = path.join(dirPath, dirEntry.name);
    if (isFile(filePath, dirEntry)) {
      result[dirEntry.name] = fs.readFileSync(filePath, 'utf8');
    }
  }
  return result;
}


function isFile(p, entry) {
  if (entry.isFile()) {
    return true;
  }
  if (entry.isSymbolicLink()) {
    // Kubernetes credentials use symlinks
    const target = fs.realpathSync(p);
    const targetStat = fs.statSync(target);

    if (targetStat.isFile()) {
      return true;
    }
  }
  return false;
}

const DEFAULT_META_DATA_PROPERTIES = { type: true, provider: true };

function parseJsonSafe(str) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return undefined;
  }
}

function buildBindingWithoutMetaData(properties) {
  const binding = { credentials: {} };

  for (const propertyName in properties) {
    if (propertyName in DEFAULT_META_DATA_PROPERTIES) {
      binding[propertyName] = properties[propertyName];
    } else {
      binding.credentials[propertyName] = properties[propertyName];
    }
  }

  return binding;
}

function parseProperties(properties, metaData = []) {
  const result = {};
  for (const metaDataProperty of metaData) {
    const { name } = metaDataProperty;
    const text = properties[name];
    if (name && typeof text !== undefined) {
      switch (metaDataProperty.format) {
      case 'text':{
        result[name] = text;
        break;
      }
      case 'json':{
        const value = parseJsonSafe(text);
        if (metaDataProperty.container) {
          Object.assign(result, value);
        } else {
          result[name] = value;
        }
        break;
      }
      default:{
        debug('Unexpected format %s', metaDataProperty.format);
      }
      }
    } else {
      debug('Missing property %s', name);
    }
  }

  return result;
}

function readBinding(bindingPath, bindingName) {
  const properties = readFiles(bindingPath);
  const metaDataString = properties['.metadata'];
  let metaData;
  if (metaDataString) {
    metaData = parseJsonSafe(metaDataString);
    if (typeof metaData === 'undefined') {
      debug('Cannot parse JSON: %s/.metadata', bindingPath);
    }
  }

  let binding;
  if (metaData) {
    binding = parseProperties(properties, metaData.metaDataProperties);
    binding.credentials = parseProperties(properties, metaData.credentialProperties);
  } else {
    binding = buildBindingWithoutMetaData(properties);
  }

  if (!binding.type) {
    return undefined;
  }
  binding.name = bindingName;
  return binding;
}

function readServiceBindingsServicesFromPath(serviceBindingRoot) {
  assert(isDirectory(serviceBindingRoot), 'secrets path must be a directory');
  const bindings = {};
  for (const bindingEntry of fs.readdirSync(serviceBindingRoot, { withFileTypes: true })) {
    if (bindingEntry.isDirectory()) {
      const bindingPath = path.join(serviceBindingRoot, bindingEntry.name);
      const binding = readBinding(bindingPath, bindingEntry.name);
      if (binding) {
        bindings[binding.name] = binding;
      }
    }
  }
  return bindings;
}

function readServiceBindingServices(serviceBindingRoot) {
  serviceBindingRoot = serviceBindingRoot || process.env.SERVICE_BINDING_ROOT;
  if ((typeof serviceBindingRoot === 'string' && serviceBindingRoot.length > 0)) {
    return fs.existsSync(serviceBindingRoot) ? readServiceBindingsServicesFromPath(serviceBindingRoot) : undefined;
  } else {
    return undefined;
  }
}
'use strict';

const assert = require('assert');

module.exports.apply = apply;

// In this example, the filter parameter can be a string, an object, or a function.
// This pattern is known as polymorphism, where a function can accept arguments of different types and behave differently based on the type of the argument.
// When to Use This Pattern
// This pattern is useful when you want to provide a flexible API that can handle different types of input for filtering or processing data.
// It allows the caller to use the most convenient or appropriate type of filter for their needs, whether it’s a simple string, a complex object, or a custom function.
// This can make your code more versatile and easier to use in different contexts.

function apply(services, filter) {
  assert(typeof filter === 'string' || typeof filter === 'object' || typeof filter === 'function',
    'bad filter type: ' + typeof filter);

  if (!services) {
    return [];
  }
  // Filter as a String
  if (typeof filter === 'string') {
    return services[filter] ? [services[filter]] : [];
  }

  // Filter as an Object or Function
  var result = [];
  for (var key in services) {
    if (applyFilter(services[key], filter)) {
      result.push(services[key]);
    }
  }
  return result;
}

function applyFilter(service, filter) {
  // If the filter is a function, it calls the function with the service as an argument.
  if (typeof filter === 'function') {
    return filter(service);
  }

  // If the filter is an object, it checks if the service matches all the key-value pairs in the filter object. It also handles special cases for tags.
  var match = false;
  for (var key in filter) {
    if (service[key] === filter[key] ||
      (/tags?/.test(key) && service.tags && service.tags.indexOf(filter[key]) >= 0)) {
      match = true;
    } else {
      return false;
    }
  }
  return match;
}

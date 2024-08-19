const assert = require('assert');

// This line imports the "EventEmitter" class from the "events" module, which is a core module in Node.js.
// "EventEmitter" allows you to create and handle custom events.
const EventEmitter = require('events');
const commander = require('commander');
const util = require('util');

const loggerUtil = require('./lib/utils/logger');
const bootstrap = require('./lib/bootstrap');
const optionalCallback = require('./lib/utils/callback');

const MiddlewareList = require('./lib/extensions/MiddlewareList');

function Approuter() {

    // Constructor Check: The assert statement ensures that the Approuter constructor is called without any arguments.
    // If arguments are passed, it throws an error.
    assert(arguments.length === 0, 'Constructor takes no arguments');
    if (!(this instanceof Approuter)) {
      return new Approuter();
    }

    // Inheritance: EventEmitter.call(this) makes Approuter inherit from EventEmitter, allowing it to use event-related methods.
    EventEmitter.call(this);
  
    this.cmdParser = new commander.Command()
      .option('-w, --workingDir <s>', 'The working directory containting the resources folder and xs-app.json file')
      .option('-p, --port <n>', 'The port of the approuter');
  
    this.first = new MiddlewareList();
    this.beforeRequestHandler = new MiddlewareList();
    this.beforeErrorHandler = new MiddlewareList();
    this.firstWS = new MiddlewareList();
    this.beforeRequestHandlerWS = new MiddlewareList();
  }

  util.inherits(Approuter, EventEmitter);

  // The prototype property is used to add methods and properties to the constructor function’s prototype.
  // This means all instances of Approuter will inherit these methods and properties.
  Approuter.prototype.start = function (options, callback) {
    let self = this;
    options = {};
    callback = optionalCallback(callback);

    if (this.cmdParser) {
      this.cmdParser.parse(process.argv);
      options = _.defaults(options, this.cmdParser);
    }

    let logger = loggerUtil.getLogger('/approuter');
    logger.info('Application router version %s', require('./package.json').version);
  
    let app = bootstrap(options);
    
    app.logger = logger;
    app.approuter = this;
    this._app = app;

    // serverLib.start(app, function (err, server) {
    //   self._server = server;
    //   callback(err);
    // });

  };

  // This block checks if the current module is the main module (i.e., it was run directly from the command line).
  // If true, it creates an instance of Approuter and calls its start method.
  if (require.main === module) {
    let ar = new Approuter();
    ar.start();
  }

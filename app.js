
const http = require('http');
const assert = require('assert');
const commander = require('commander');
const EventEmitter = require('events');
const util = require('util');

const connect = require("./lib/utils/connect")
const MiddlewareList = require('./lib/extensions/MiddlewareList');
const middleware1 = require("./lib/middleware/middleware-1")
const middleware2 = require("./lib/middleware/middleware-2")
const middleware3 = require("./lib/middleware/middleware-3")
const errormiddleware1 = require("./lib/middleware/middleware-error-1")
const errormiddleware2 = require("./lib/middleware/middleware-error-2")

// Create a middleware handler
const app = connect();

// Register middleware functions
app.use(middleware1);

app.use(middleware2);

app.use(middleware3);

app.use(errormiddleware1);

app.use(errormiddleware2);

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/middlewares') {
        return app.listMiddlewares(req, res);
      }
    if (req.url === '/test-normal') {
        return app.handle(req, res, () => {
            res.statusCode = 200;
            res.end('Normal request processed successfully');
        })
      }
app.handle(req, res);
});

// Start the server
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

function Approuter() {

  // Constructor Check: The assert statement ensures that the Approuter constructor is called without any arguments.
  // If arguments are passed, it throws an error.
  assert(arguments.length === 0, 'Constructor takes no arguments');
  if (!(this instanceof Approuter)) {
    return new Approuter();
  }

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


Approuter.prototype.start = function (options, callback) {
  let self = this;
  if (options) {
    validators.validateApprouterStartOptions(options);
    options = _.cloneDeep(options);
  } else {
    options = {};
  }
  // callback = optionalCallback(callback);

  // if (this.cmdParser) {
  //   this.cmdParser.parse(process.argv);
  //   options = _.defaults(options, this.cmdParser);
  // }
  // addImplicitExtension(this, options);

  // let logger = loggerUtil.getLogger('/approuter');
  // logger.info('Application router version %s', require('./package.json').version);

  // let app = bootstrap(options);
  // app.logger = logger;
  // app.approuter = this;
  // app.extensions = options.extensions;
  // this._app = app;
  // loggerUtil.getAuditLogger(function(err, auditLogger){
  //   if (err) {
  //     throw err;
  //   }
  //   app.auditLogger = auditLogger;
  //   serverLib.start(app, function (err, server) {
  //     self._server = server;
  //     callback(err);
  //   });
  // });
};


if (require.main === module) {
  let ar = new Approuter();
  ar.start();
}

const http = require('http');
const connect = require("./lib/utils/connect")
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



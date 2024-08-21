// Middleware handler function

module.exports = () => {

    const okQueue = [];
    const errQueue = [];

    // Function to register middleware
    const use = (fn) => {
        if (fn.length < 4) {
            okQueue.push(fn);
        } else {
            errQueue.push(fn);
        }
    };

    // Function to handle requests
    const handle = (req, res, out) => {
        let index = 0;
        let queue = okQueue;

        // Default out function if not provided
        out = out || ((err) => {
            console.log("inside out")
            if (err) {
                res.statusCode = 500;
                return res.end(`Error: ${err.message}`);
            }
            res.statusCode = 404;
            res.end('Not Found');
        });

        // Function to call the next middleware
        const next = (err) => {
            console.log(`Next called with index: ${index}, error: ${err}`);
            if (err) {
                queue = errQueue;
                index = 0;
                return next(err);
            }
            if (index >= queue.length) {
                return out();
            }
            const middleware = queue[index++];;
            if (queue === okQueue) {
                middleware(req, res, next);
            } else {
                middleware(err, req, res, next);
            }
        };

        // Start the middleware chain
        next();
    };

    // Endpoint to list all middleware functions
    const listMiddlewares = (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const okMiddlewareNames = okQueue.map((fn, idx) => `OK Middleware ${idx + 1}: ${fn.name || 'anonymous'}`);
        const errMiddlewareNames = errQueue.map((fn, idx) => `Error Middleware ${idx + 1}: ${fn.name || 'anonymous'}`);
        res.end(JSON.stringify({ okQueue: okMiddlewareNames, errQueue: errMiddlewareNames }, null, 2));
    };

    return { use, handle, listMiddlewares };
};
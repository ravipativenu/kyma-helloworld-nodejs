module.exports = async function muddlware1 (err, req, res, next) {
    console.error('Error Middleware 2:', err.message);
    res.statusCode = 500;
    res.end('Internal Server Error');
    next();
}
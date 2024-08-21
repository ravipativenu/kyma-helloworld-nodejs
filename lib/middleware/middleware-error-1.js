module.exports = async function muddlware1 (err, req, res, next) {
    console.error('Error Middleware 1:', err.message);
    next(err);
}
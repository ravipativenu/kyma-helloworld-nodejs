module.exports = async function muddlware1 (req, res, next) {
    console.log('Middleware 1');
    next();
}
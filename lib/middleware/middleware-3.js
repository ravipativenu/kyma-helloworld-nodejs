module.exports = async function muddlware1 (req, res, next) {
    console.log('Middleware 3');
    next();
}
module.exports = function(config) {
    let symbiosis = require('./symbiosis.js')(config);
    
    return {
        "symbiosis" : symbiosis
    }
};
    
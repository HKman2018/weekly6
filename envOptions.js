var minimist = require('minimist');

var options = {
    string: 'env',
    default: {
        env: 'develop'
    }
}
var envOptions = minimist(process.argv.slice(2), options)
    // console.log('envOptions', envOptions.env)
module.exports = envOptions;
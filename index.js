var Handlebars = require('handlebars');
var HandlebarsTemplateLoader = require('handlebars-loader');

var pathForHandlebarsRuntime = require.resolve('handlebars/runtime');
var pathForHandlebars = require.resolve('handlebars');

module.exports = function(content) {
    var callback = this.async();
    this.async = function() {
        return function(err, response) {
            var newResponse = response.replace(pathForHandlebarsRuntime, pathForHandlebars);
            return callback(err, newResponse);
        };
    };
    HandlebarsTemplateLoader.call(this, content);
};

module.exports.Handlebars = Handlebars;

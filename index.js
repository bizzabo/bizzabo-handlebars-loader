var _ = require('underscore');
var Backbone = require('backbone');

var ensureArray = function(obj) {
    return _.isUndefined(obj) ? [] : (_.isArray(obj) ? obj : [ obj ]);
};

// Disable binding to Backbone
Backbone.on = function() {};

Backbone.HasMany = 'has-many';
Backbone.HasOne  = 'has-one';

Backbone.RelationalModel = Backbone.Model.extend({

    constructor: function( attributes, options ) {
        attributes = attributes || {};
        options = options || {};
        var relations = this.relations || [];
        relations.forEach(function(relation) {
            if (relation.type === Backbone.HasMany) {
                attributes[relation.key] = attributes[relation.key] || [];
            } else if (relation.type === Backbone.HasOne) {
                attributes[relation.key] = attributes[relation.key] || {};
            } else {
                throw new Error('Relation type is unknown - it is ' + relation.type + ' for key ' + relation.key);
            }
        });
        Backbone.Model.apply( this, arguments );
    },

    set: function(key, value, options) {
        var attrs, attr;

        // Normalize the key-value into an object
        if (_.isObject(key) || key === null) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }

        // always pass an options hash around. This allows modifying
        // the options inside the setter
        options = options || {};

        var relations = this.relations || [];
        relations.forEach(function(relation) {
            var value = attrs[relation.key];
            if (value) {
                if (relation.type === Backbone.HasMany) {
                    var coll = this.get(relation.key);
                    if (!coll) {
                        coll = new relation.collectionType();
                        coll.model = relation.relatedModel || Backbone.Model;
                    }
                    if (value instanceof Backbone.Collection) {
                        value = value.toJSON();
                    }
                    coll.set(ensureArray(value));
                    attrs[relation.key] = coll;
                } else if (relation.type === Backbone.HasOne) {
                    var subModel = this.get(relation.key);
                    if (!subModel) {
                        subModel = new relation.relatedModel();
                    }
                    if (value instanceof Backbone.Model) {
                        value = value.toJSON();
                    }
                    if (!_.isEqual(value, subModel.toJSON())) {
                        subModel.set(value);
                    }
                    attrs[relation.key] = subModel;
                }
            }
        }, this);

        return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    toJSON: function(options) {
        var toJSON = Backbone.Model.prototype.toJSON.call(this, options);

        var relations = this.relations || [];
        relations.forEach(function(relation) {
            if (toJSON[relation.key]) {
                toJSON[relation.key] = (toJSON[relation.key].toJSON && toJSON[relation.key].toJSON()) || toJSON[relation.key];
            }
        }, this);

        return toJSON;
    }

}, {
    findOrCreate: function(options) {
        return new this(options);
    }
});
DS.JsonTransform = DS.Transform.create({
  deserialize: function(serialized) {
    Ember.assert("attribute is not a string", _.isString(serialized));

    return JSON.parse(serialized);
  },

  serialize: function(deserialized) {
    Ember.assert("attribute is not a object", _.isObject(deserialized));
    return JSON.stringify(deserialized);
  },

  equals: function(a, b) {
    return _.isEqual(a, b);
  }
});

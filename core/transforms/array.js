DS.ArrayTransform = DS.Transform.create({
  deserialize: function(serialized) {
    Ember.assert("attribute is not an array", _.isArray(serialized));
    return serialized;
  },

  serialize: function(deserialized) {
    Ember.assert("attribute is not an array", _.isArray(deserialized));
    return deserialized;
  },

  equals: function(a, b) {
    return _.isEqual(a, b);
  }
});

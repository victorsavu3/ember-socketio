DS.ObjectTransform = DS.Transform.create({
  deserialize: function(serialized) {
    Ember.assert("attribute is not a object", _.isObject(serialized));
    return serialized;
  },

  serialize: function(deserialized) {
    Ember.assert("attribute is not a object", _.isObject(deserialized));
    return deserialized;
  },

  equals: function(a, b) {
    return _.isEqual(a, b);
  }
});

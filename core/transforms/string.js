DS.StringTransform = DS.Transform.create({
  deserialize: function(serialized) {
    Ember.assert("attribute is not a string", _.isString(serialized));
    return serialized;
  },

  serialize: function(deserialized) {
    Ember.assert("attribute is not a string", _.isString(deserialized));
    return deserialized;
  },

  equals: function(a, b) {
    return a===b;
  }
});

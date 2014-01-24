DS.StringTransform = DS.Transform.extend({

  deserialize: function(serialized) {
    Ember.assert("attribute is not a string", _.isString(serialized));
    return serialized;
  },

  serialize: function(deserialized) {
    Ember.assert("attribute is not a string", _.isString(deserialized));
    return deserialized;
  }

});

DS.BooleanTransform = DS.Transform.create({
  deserialize: function(serialized) {
    if(_.isBoolean(serialized)) {
      return serialized;
    } else {
      Ember.assert("attribute can not be correctly converted to boolean", _.isString(serialized));

      return serialized === "true";
    }
  },

  serialize: function(deserialized) {
    if(_.isBoolean(serialized)) {
      return serialized;
    } else {
      Ember.assert("attribute can not be correctly converted to boolean", _.isString(deserialized));

      return serialized === "true";
    }
  },

  equals: function(a, b) {
    return a===b;
  }
});

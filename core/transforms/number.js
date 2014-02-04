DS.NumberTransform = DS.Transform.create({
  deserialize: function(serialized) {
    if(_.isNumber(serialized)) {
      return serialized;
    } else {
      Ember.assert("attribute can not be converted to number", _.isString(serialized));
      var result = parseFloat(serialized);
      Ember.assert("attribute is not a valid number", !_.isNaN(result));
      return result;
    }
  },
  serialize: function(deserialized) {
    Ember.assert("attribute is not number", _.isNumber(deserialized));
    return deserialized;
  },

  equals: function(a, b) {
    return a===b;
  }
});

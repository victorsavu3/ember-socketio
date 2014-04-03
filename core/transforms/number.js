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
    if(_.isNumber(deserialized)) {
      return deserialized;
    } else {
      Ember.assert("attribute can not be converted to number", _.isString(deserialized));
      var result = parseFloat(deserialized);
      Ember.assert("attribute is not a valid number", !_.isNaN(result));
      return result;
    }
  },

  equals: function(a, b) {
    return a===b;
  }
});

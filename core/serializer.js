DS.Serializer = Ember.Object.extend({
  serialize: Ember.required(Function),
  deserialize: Ember.required(Function)
});

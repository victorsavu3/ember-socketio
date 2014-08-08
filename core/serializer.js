// Used to serialize the entire model
DS.Serializer = Ember.Object.extend({
  serialize: Ember.required(Function),
  deserialize: Ember.required(Function),
  load: Ember.required(Function)
});

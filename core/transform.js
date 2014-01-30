DS.Transform = Ember.Object.extend({
  serialize: Ember.required(Function),
  deserialize: Ember.required(Function),
  equals: Ember.required(Function)
});

require('scripts/data/core/transforms/*');

DS.Transform = Ember.Object.extend({
  serialize: Ember.required(),
  deserialize: Ember.required()
});

require('scripts/data/core/transforms/*');

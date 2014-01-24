DS.Model = Ember.Object.extend(Ember.Evented, {
  id: null,

  _attributes: {},
  _original: {},

  destroy: function() {
    this.set('isDeleted', true)
  },

  save: function() {
    return this.get('store').save(this);
  },

  rollback: function() {

  },

  serialize: function() {
    return this.get('store').serialize(this);
  },

  load: function(data) {
    this.loadRelationships(data);
    this.loadAttributes(data);
  },

  deserialize: function(data) {
    this.load(data);
  },

  changedAttributes: function() {

  },

  changedRelationships: function() {

  },

  changes: function() {

  },

  isDirty: function(){
    return this.get('relationshipsDirty') || this.get('attributesDirty');
  }.property('relationshipsDirty', 'attributesDirty')
});

require('scripts/data/core/model/*');

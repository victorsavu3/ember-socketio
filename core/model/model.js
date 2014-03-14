DS.Model = Ember.Object.extend(Ember.Evented, {
  id: null,

  save: function() {
    return this.get('store').save(this);
  },

  rollback: function() {
    this.get('store').rollbackAttributes(this);
    this.get('store').rollbackRelationships(this);
  },

  destroy: function() {
    Ember.assert('Record is already destroyed', !this.get('isDeleted'))
    this.set('isDeleted', true)
  },

  isDirty: function(){
    return this.get('relationshipsDirty') || this.get('attributesDirty');
  }.property('relationshipsDirty', 'attributesDirty')
});

require('scripts/data/core/model/*');

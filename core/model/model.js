DS.Model = Ember.Object.extend(Ember.Evented, {
  id: null,

  save: function() {
    return this.get('store').save(this);
  },

  destroy: function() {
    this.set('isDeleted', true)
  },

  isDirty: function(){
    return this.get('relationshipsDirty') || this.get('attributesDirty');
  }.property('relationshipsDirty', 'attributesDirty')
});

require('scripts/data/core/model/*');

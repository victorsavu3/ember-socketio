DS.Model.reopenClass({
  relationships: Ember.computed(function() {
    var relationships = {};

    this.eachComputedProperty(function(key, meta) {
      if(meta.isRelationship) {
        relationships[key] = {
          key: key,
          type: this.store.getModel(meta.type),
          kind: meta.kind,

          // options
          sync: meta.options.sync,
          eager: meta.options.eager,
          readOnly: meta.options.readOnly,
          default: meta.options.default,
          embedded: meta.options.embedded
        };
      }
    });

    return relationships;
  })
});

DS.Relationship = Ember.Object.extend(Ember.Evented, {
  rollback: Ember.required(Function)
});

DS.Model.reopen({
  init: function() {
    this._super();

    var relationships = {};

    var self=this;
    _.each(Ember.get(this.constructor, 'relationships'), function(relationship, key){
      var meta;

      if(relationship.kind === 'belongsTo') {
        meta = DS.BelongsToRelationship.create({
          type: relationship,
          record: this
        });
      } else if(relationship.kind === 'hasMany') {
        meta = DS.HasManyRelationship.create({
          type: relationship,
          record: this
        });
      } else {
        throw new Ember.Error("Unknown kind " + relationship.kind);
      }

      meta.addObserver('isDirty', self, self.dirtyUpdate);

      relationships[relationship.key] = meta;
    });

    this.set('_relationships', relationships);
  },

  dirtyUpdate: function() {
    this.notifyPropertyChange('relationshipsDirty');
  },

  relationshipsDirty: Ember.computed(function() {
    var dirty = false;
    _.each(this.get('_relationships'), function(value, key){
      if(value.isDirty) {
        dirty = true;
      }
    });
    return dirty;
  })
});

DS.Store.reopen({
  loadRelationships: function(record, data) {
    _.each(record.get('_relationships'), function(value, key) {
      value.original = data[key];

      if(value.type.kind === 'belongsTo') {
        delete value.id;
      } else if(value.type.kind === 'hasMany') {
        delete value.ids;
      }
    });
  },

  rollbackRelationships: function(record) {
    _.each(record.get('_.relationships'), function(value, key) {
      value.rollback();
    });
  }
});

require('scripts/data/core/model/relationships/*');

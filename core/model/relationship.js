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
          embedded: meta.options.embedded,
          isSet: meta.options.isSet
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
          record: self
        });
      } else if(relationship.kind === 'hasMany') {
        meta = DS.HasManyRelationship.create({
          type: relationship,
          record: self
        });
      } else {
        throw new Ember.Error("Unknown kind " + relationship.kind);
      }

      meta.get('isDirty');
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
      if(value.get('isDirty')) {
        dirty = true;
      }
    });
    return dirty;
  }).property()
});

DS.Store.reopen({
  loadRelationships: function(record, data) {
    _.each(record.get('_relationships'), function(value, key) {
      value.load(data[key]);
    });
  },

  rollbackRelationships: function(record) {
    _.each(record.get('_relationships'), function(value, key) {
      value.rollback();
    });
  }
});

require('scripts/data/core/model/relationships/*');

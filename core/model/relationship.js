DS.Model.reopenClass({
  relationships: Ember.computed(function() {
    var relationships = {};

    this.eachComputedProperty(function(key, meta) {
      if(meta.isRelationship) {
        relationships[key] = {
          key: key,
          type: this.store.getType(meta.type),
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
    this.constructor.relationships().forEach(function(key, relationship){
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
    this.get('_relationships').forEach(function(key, value){
      if(value.isDirty) {
        dirty = true;
      }
    });
    return dirty;
  }),

  loadRelationships: function(data) {
    this.get('_relationships').forEach(function(key, value) {
      value.original = data[key];

      if(value.type.kind === 'belongsTo') {
        delete value.id;
      } else if(value.type.kind === 'hasMany') {
        delete value.ids;
      }
    });
  },

  rollbackRelationships: function() {
    this.get('_.relationships').forEach(function(key, value) {
      value.rollback();
    });
  }
});

require('scripts/data/core/model/relationships/*');

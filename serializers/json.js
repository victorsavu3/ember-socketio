DS.JSONSerializer = DS.Serializer.extend({
  serialize: function(store, record) {
    var serialized = {};

    serialized.id = record.get('id');

    _.each(record._attributes, function(attribute) {
      if(_.isUndefined(attribute.get('getValue'))) {
        serialized[attribute.type.key] = null;
      } else {
        serialized[attribute.type.key] = attribute.unload();
      }

    });

    _.each(record._relationships, function(relationship) {
      if(relationship.type.kind === 'belongsTo') {
        serialized[relationship.type.key] = relationship.get('getId');
      } else if(relationship.type.kind === 'hasMany') {
        serialized[relationship.type.key] = relationship.get('getIds');
      } else {
        throw new Ember.Error("Unknown relationship type " + relationship.type.kind);
      }

      if(_.isUndefined(serialized[relationship.type.key])) {
        serialized[relationship.type.key] = null;
      }
    });

    return serialized;
  },

  deserialize: function(store, type, data) {
    var record = store.getModel(type).create({
      store: store
    });

    store.load(record, data);

    return record;
  },

  load: function(store, type, record, data) {
    store.loadRelationships(record, data);
    store.loadAttributes(record, data);

    record.set('id', data.id);
  }
})

DS.JSONDeltaSerializer = DS.Serializer.extend({
  serialize: function(store, record) {
    var serialized = {};

    serialized.id = record.get('id');

    _.each(record._attributes, function(attribute) {
      if(attribute.get('isDirty')) {
        serialized[attribute.type.key] = attribute.unload();
      }
    });

    _.each(record._relationships, function(relationship) {
      if(relationship.get('isDirty')) {
        if(relationship.kind === 'belongsTo') {
          serialized[relationship.type.key] = relationship.get('getId');
        } else {
          serialized[relationship.type.key] = relationship.get('getIds');
        }
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
  }
})

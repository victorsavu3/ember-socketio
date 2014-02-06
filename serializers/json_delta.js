DS.JSONDeltaSerializer = DS.JSONSerializer.extend({
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
        if(relationship.type.kind === 'belongsTo') {
          serialized[relationship.type.key] = relationship.get('getId');
        } else if(relationship.type.kind === 'hasMany') {
          serialized[relationship.type.key] = relationship.get('getIds');
        } else {
          throw new Ember.Error("Unknown relationship type " + relationship.type.kind);
        }
      }
    });

    return serialized;
  }
})

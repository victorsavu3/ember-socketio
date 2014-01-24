DS.LocalStorageAdapter = DS.Adapter.extend({
  prefix: 'LSAdapter',

  getRecordUUID: function(type, id) {
    return this.prefix + type.name + ':' + id;
  },

  findAll: function(type) {
    var result = [];

    _.each(localStorage, function(value, key){
      if(key.startsWith(this.prefix + type.name)) {
        result.push(type.deserialize(value));
      }
    });

    return RSVP.resolve(result);
  },

  find: function(type, id) {
    return RSVP.resolve(localStorage[this.getRecordUUID(type, id)]);
  },

  materialize: function(type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    localStorage[this.getRecordUUID(type, record.id)] = JSON.stringify(record.serialize());

    return RSVP.resolve(record);
  },

  update: function(type, record) {
    localStorage[this.getRecordUUID(type, record.id)] = JSON.stringify(record.serialize());

    return RSVP.resolve(record);
  },

  delete: function(type, record) {
    localStorage.removeItem(this.getRecordUUID(type, record.id));

    return RSVP.resolve(record);
  }
});

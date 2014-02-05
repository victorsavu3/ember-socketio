DS.MemoryAdapter = DS.Adapter.extend({
  init: function() {
    this.cache = {};

    this.serializer = DS.JSONSerializer.create();
  },

  findAll: function(type) {
    var result = [];

    _.each(this.cache[Ember.guidFor(type)], function(value){
      result.push(value);
    });

    return Ember.RSVP.resolve(result);
  },

  find: function(store, type, id) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    return Ember.RSVP.resolve(this.cache[Ember.guidFor(type)][id]);
  },

  createRecord: function(store, type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    this.cache[Ember.guidFor(type)][record.get('id')] = store.serialize(record);

    return Ember.RSVP.resolve(this.cache[Ember.guidFor(type)][record.get('id')]);
  },

  updateRecord: function(store, type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    this.cache[Ember.guidFor(type)][record.get('id')] = store.serialize(record)

    return Ember.RSVP.resolve(this.cache[Ember.guidFor(type)][record.get('id')]);
  },

  deleteRecord: function(store, type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    delete this.cache[Ember.guidFor(type)][record.get('id')];

    return Ember.RSVP.resolve(record);
  }
});

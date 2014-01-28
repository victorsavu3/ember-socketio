DS.MemoryAdapter = DS.Adapter.extend({
  findAll: function(type) {
    var result = [];

    _.each(this.cache[Ember.guidFor(type)], function(value){
      result.push(value);
    });

    return RSVP.resolve(result);
  },

  find: function(type, id) {
    return RSVP.resolve(this.cache[Ember.guidFor(type)][id]);
  },

  createRecord: function(type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    this.cache[Ember.guidFor(type)][record.id] = record;

    return RSVP.resolve(record);
  },

  updateRecord: function(type, record) {
    this.cache[Ember.guidFor(type)][record.id] = record;

    return RSVP.resolve(record);
  },

  deleteRecord: function(type, record) {
    delete this.cache[Ember.guidFor(type)][record.id];

    return RSVP.resolve(record);
  }
});

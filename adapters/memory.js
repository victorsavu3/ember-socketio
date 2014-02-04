DS.MemoryAdapter = DS.Adapter.extend({
  init: function() {
    this.cache = {};
  },

  findAll: function(type) {
    var result = [];

    _.each(this.cache[Ember.guidFor(type)], function(value){
      result.push(value);
    });

    return Ember.RSVP.resolve(result);
  },

  find: function(type, id) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    return Ember.RSVP.resolve(this.cache[Ember.guidFor(type)][id]);
  },

  createRecord: function(type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    this.cache[Ember.guidFor(type)][record.id] = record;

    return Ember.RSVP.resolve(record);
  },

  updateRecord: function(type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    this.cache[Ember.guidFor(type)][record.id] = record;

    return Ember.RSVP.resolve(record);
  },

  deleteRecord: function(type, record) {
    this.cache[Ember.guidFor(type)] = this.cache[Ember.guidFor(type)] || {};

    delete this.cache[Ember.guidFor(type)][record.id];

    return Ember.RSVP.resolve(record);
  }
});

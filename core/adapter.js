var callMany = function(store, type, entitys, what) {
  var promises = [];

  _.each(entitys, function(entity){
    promises.push(what(store, type, entity));
  });

  return Ember.RSVP.Promise.all(promises);
}

DS.Adapter = Ember.Object.extend({
  findAll: Ember.required(Function),
  findQuery: Ember.required(Function),

  find: Ember.required(Function),
  findMany: function(store, type, ids) {
    return callMany(store, type, ids, this.find);
  },

  createRecord: Ember.required(Function),
  createMany: function(store, type, records) {
    return callMany(store, type, records, this.createRecord);
  },

  updateRecord: Ember.required(Function),
  updateMany: function(store, type, records) {
    return callMany(store, type, records, this.updateRecord);
  },

  deleteRecord: Ember.required(Function),
  deleteMany: function(store, type, ids) {
    return callMany(store, type, ids, this.deleteRecord);
  }
})

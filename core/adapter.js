var callMany = function(entitys, what) {
  var promises;

  entitys.forEach(function(entity){
    promises.push(what(entity));
  });

  return RSVP.Promise.all(promises);
}

DS.Adapter = Ember.Object.extend({
  serializer: 'default',

  findAll: Ember.required(Function),
  findQuery: Ember.required(Function),

  find: Ember.required(Function),
  findMany: function(ids) {
    return callMany(ids, this.find);
  },

  createRecord: Ember.required(Function),
  materializeMany: function(records) {
    return callMany(records, this.createRecord);
  },

  updateRecord: Ember.required(Function),
  updateMany: function(records) {
    return callMany(records, this.updateRecord);
  },

  deleteRecord: Ember.required(Function),
  deleteMany: function(ids) {
    return callMany(ids, this.deleteRecord);
  }
})

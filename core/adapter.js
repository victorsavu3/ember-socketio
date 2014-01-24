var callMany = function(entitys, what) {
  var promises;

  entitys.forEach(function(entity){
    promises.push(what(entity));
  });

  return RSVP.Promise.all(promises);
}

DS.Adapter = Ember.Object.extend({
  serializer: 'default',

  findAll: Ember.required(),
  findQuery: Ember.required(),

  find: Ember.required(),
  findMany: function(ids) {
    return callMany(ids, this.find);
  },

  materialize: Ember.required(),
  materializeMany: function(records) {
    return callMany(records, this.create);
  },

  update: Ember.required(),
  updateMany: function(records) {
    return callMany(records, this.update);
  },

  delete: Ember.required(),
  deleteMany: function(ids) {
    return callMany(ids, this.delete);
  }
})

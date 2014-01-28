DS.Store = Ember.Object.extend(Ember.Evented, {
  init: function() {
    this._super();

    this.cache = {};
  },

  addToCache: function(type, object) {
    var guid = Ember.guidFor(type);

    if(!this.cache[guid])
      this.cache[guid] = Ember.A([]);

    var map = this.cache[guid];

    map[object.get('id')] = object;
  },

  loadFromCache: function(type, object) {
    var guid = Ember.guidFor(type);
    var map = this.cache[guid];

    return map[object.get('id')];
  },

  removeFromCache: function(type, object) {
    var guid = Ember.guidFor(type);
    var map = this.cache[guid];

    delete map[object.get('id')];
  },

  lookup: function(type, name) {
    this[type] = this[type] | {};

    if(_.isString(name)) {
      if(this[type][name]){
        return this[type][name];
      } else {
        var normalized = this.container.normalize(type + ':' + name);
        var lookup = this.container.lookupFactory(normalized);
        if (!lookup) { throw new Ember.Error("No " + type + " was found for '" + name + "'"); }

        // add useful properties
        lookup.name = name;
        lookup.store = this;

        return lookup;
      }
    } else {
      return name;
    }
  },

  getTransform: function(name) {
    return this.lookup('transform', name);
  },

  getModel: function(name) {
    return this.lookup('model', name);
  },

  getSerializer: function(name) {
    return this.lookup('serializer', name);
  },

  getAdapter: function(name) {
    return this.lookup('adapter', name);
  },

  get: function(type, id) {
    type = this.getModel(type);

    if(_.isArray(id)) {
      return id.map(function(rid){
        return this.loadFromCache(type, rid);
      })
    } else if(_.isString(id) || _.isNumber(id)){
      return this.loadFromCache(type, rid);
    }
  },

  load: function(type, data) {
    type = this.getModel(type);

    var record = this.deserialize(type, data);

    Ember.assert("Missing id in load", record.id);

    var existing = this.get(type, record.id);

    if(existing) {
      existing.load(record);
    } else {
      this.addToCache(type, record);
    }
  },

  fetch: function(type, query) {
    type = this.getModel(type);

    if(_.isArray(query)) {

    } else if(_.isObject(query)) {

    } else if(_.isNumber(query) || _.isString(query)){


    }
  },

  find: function(type, query) {
    type = this.getModel(type);

    if(_.isArray(query)) {
      var promise = type.adaper.findMany(type, query);

      promise.then(function(data) {

      });

      return Ember.RSVP.resolve(promise);
    } else if(_.isObject(query)) {
      type.adaper.findQuery(type, query);
    } else if(_.isNumber(query) || _.isString(query)){
      var existing = this.get(type, query);

      if(existing) return Ember.RSVP.resolve(existing , "find returning cached record");

      return this.fetch(type, query);
    }
  },

  createRecord: function(type, data) {
    var record = this.getModel(type).create();

    record._state.set('new');

    _.each(data, function(value, key){
      record.set(key, value);
    });

    return record;
  }
})

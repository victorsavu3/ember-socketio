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

    Ember.assert("Adding existing record to cache", !map[object.get('id')]);

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
    if(_.isString(name)) {
      this[type] = this[type] | {};

      if(this[type][name]){
        return this[type][name];
      } else {
        var normalized = this.container.normalize(type + ':' + name);
        var lookup = this.container.lookupFactory(normalized);
        if (!lookup) { throw new Ember.Error("No " + type + " was found for '" + name + "'"); }

        // add useful properties
        lookup.name = name;
        lookup.store = this;

        if(type === "model") {
          lookup.adapter = this.container.lookupFactory('adapter:' + name) || this.adapter;
        }

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
    return this.lookup('model', name)
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

  deserialize: function(type, data) {
    var record = this.getModel(type).create();

    record.load(data);

    return record
  },

  load: function(type, data) {
    type = this.getModel(type);

    if(_.isArray(data)) {

    } else {
      Ember.assert("Missing id in load", data.id);

      var existing = this.get(type, data.id);

      if(existing) {
        existing.load(data);
      } else {
        this.addToCache(type, this.deserialize(type, data));
      }
    }
  },

  fetch: function(type, query) {
    type = this.getModel(type);

    if(_.isArray(query)) {
      var promise = type.adaper.findMany(store, type, query).then(function(data) {
        return data.map(function(element) {
          var record = this.deserialize(type, data);
          this.addToCache(type, record);
          return record;
        });
      });

      return Ember.RSVP.resolve(promise, "fetching many records (query)");
    } else if(_.isObject(query)) {
      var promise = type.adaper.findQuery(store, type, query).then(function(data) {
        return data.map(function(element) {
          var record = this.deserialize(type, data);
          this.addToCache(type, record);
          return record;
        });
      });

      return Ember.RSVP.resolve(promise, "fetching many records (array)");
    } else if(_.isNumber(query) || _.isString(query)){
      var promise = type.adaper.findQuery(store, type, query).then(function(data) {
        var record = this.deserialize(type, data);
        this.addToCache(type, record);
        return record;
      });

      return Ember.RSVP.resolve(promise, "fetching single record");
    } else if(_.isUndefined(query)) {
      var promise = type.adaper.findAll(store, type).then(function(data) {
        var result =  data.map(function(element) {
          var record = this.deserialize(type, data);
          this.addToCache(type, record);
          return record;
        });

        type.allLoaded = true;

        return result;
      });

      return Ember.RSVP.resolve(promise, "fetching all records");
    } else {
      throw new Ember.Error("Invalid query for fetch");
    }
  },

  find: function(type, query) {
    type = this.getModel(type);

    if(_.isArray(query)) {
      var toGet = [];

      var existing = query.map(function(element) {
        var record = this.get(type, element);

        if(record) {
          return record;
        } else {
          toGet.pushObject(element);
          return null;
        }
      });

      if(toGet.length === 0) return Ember.RSVP.resolve(existing, "find returning cached records (many)");

      var promise = this.fetch(type, toGet).then(function(data) {
        var result = data;

        result.reverseObjects();

        existing = existing.map(function(element) {
          if(element) {
            return element;
          } else {
            return result.popObject();
          }
        });

        return existing;
      });

      return Ember.RSVP.resolve(promise, "find fetching records (many)");
    } else if(_.isObject(query)) {
      return Ember.RSVP.resolve(this.fetch(type, query), "find fetching records (query)");
    } else if(_.isNumber(query) || _.isString(query)){
      var existing = this.get(type, query);

      if(existing) return Ember.RSVP.resolve(existing, "find returning cached record (single)");

      return Ember.RSVP.resolve(this.fetch(type, query), "find fetching record (single)");
    } else if(_.isUndefined(query)) {
      if(type.allLoaded) {
        return Ember.RSVP.resolve(this.all(type), "find loading all records from cache");
      } else {
        return Ember.RSVP.resolve(this.fetch(type, query), "find fetching all records");
      }
    } else {
      throw new Ember.Error("Invalid query for find");
    }
  },

  createRecord: function(type, data) {
    var record = this.getModel(type).create();

    record._state.set('new');

    _.each(data, function(value, key) {
      record.set(key, value);
    });

    return record;
  }
})

DS.Store = Ember.Object.extend(Ember.Evented, {
  init: function() {
    this._super();

    this.cache = {};
  },

  cacheFor: function(type) {
    var guid = Ember.guidFor(type);

    this.cache[guid] = this.cache[guid] ||Ember.A([]);

    return this.cache[guid]
  },

  addToCache: function(type, object) {
    var map = this.cacheFor(type);

    Ember.assert("Adding existing record to cache", !map[object.get('id')]);

    map[object.get('id')] = object;
  },

  loadFromCache: function(type, id) {
    var map = this.cacheFor(type);

    return map[id];
  },

  removeFromCache: function(type, id) {
    var map = this.cacheFor(type);

    delete map[id];
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
        lookup.typeKey = name;
        lookup.store = this;

        if(type === "model") {
          lookup.adapter = this.container.lookupFactory('adapter:' + name) || this.container.lookup('adapter:application') || this.adapter;
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

  getRecord: function(type, id) {
    type = this.getModel(type);
    var self = this;

    if(_.isArray(id)) {
      return id.map(function(rid){
        return self.loadFromCache(type, rid);
      })
    } else if(_.isString(id) || _.isNumber(id)){
      return this.loadFromCache(type, id);
    }
  },

  deserialize: function(type, data) {
    var record = this.getModel(type).create({
      store: this
    });

    this.load(record, data);

    return record
  },

  load: function(record, data) {
    this.loadRelationships(record, data);
    this.loadAttributes(record, data);

    record.set('id', data.id);
  },

  push: function(type, data) {
    type = this.getModel(type);

    if(_.isArray(data)) {
      var self = this;
      return _.map(data, function(element) {
        return self.push(type, element);
      });
    } else {
      Ember.assert("Missing id in load", data.id);

      var record = this.getRecord(type, data.id);

      if(record) {
        this.load(record, data);
        return record;
      } else {
        record = this.deserialize(type, data);
        this.addToCache(type, record);
        return record;
      }
    }
  },

  fetch: function(type, query) {
    type = this.getModel(type);
    var self = this;

    if(_.isArray(query)) {
      var promise = type.adapter.findMany(this, type, query).then(function(data) {
        return data.map(function(element) {
          return self.push(type, element);
        });
      });

      return Ember.RSVP.resolve(promise, "fetching many records (query)");
    } else if(_.isObject(query)) {
      var promise = type.adapter.findQuery(this, type, query).then(function(data) {
        return data.map(function(element) {
          return self.push(type, element);
        });
      });

      return Ember.RSVP.resolve(promise, "fetching many records (array)");
    } else if(_.isNumber(query) || _.isString(query)){
      var promise = type.adapter.find(this, type, query).then(function(data) {
        return self.push(type, element);
      });

      return Ember.RSVP.resolve(promise, "fetching single record");
    } else if(_.isUndefined(query)) {
      var promise = type.adapter.findAll(this, type).then(function(data) {
        var result =  data.map(function(element) {
          return self.push(type, element);
        });

        type.allLoaded = true;

        return result;
      });

      return Ember.RSVP.resolve(promise, "fetching all records");
    } else {
      throw new Ember.Error("Invalid query for fetch");
    }
  },

  all: function(type) {
    var map = this.cacheFor(type);

    var ret = [];

    _.each(map, function(element){
      ret.push(element);
    });

    return ret;
  },

  find: function(type, query) {
    type = this.getModel(type);
    var self = this;

    if(_.isArray(query)) {
      var toGet = [];

      var existing = query.map(function(element) {
        var record = self.getRecord(type, element);

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
      var existing = this.getRecord(type, query);

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
    var record = this.getModel(type).create({
      store: this
    });

    record._state.set('new');

    _.each(data, function(value, key) {
      record.set(key, value);
    });

    return record;
  },

  save: function(record) {
    var self = this;
    if(record.get('isDeleted')) {
      return record.adapter.deleteRecord(this, record.type, record.get('id')).then(function(data) {
        self.unload(record.get('id'));
        return data;
      });
    } else if(record.get('isDirty')){
      return record.adapter.updateRecord(this, record.type, record.get('id')).then(function(data) {
        record.load(data);
        record.rollback();
      });
    }
  }
});

require('scripts/data/core/model/model');

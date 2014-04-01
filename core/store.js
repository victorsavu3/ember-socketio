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
          lookup.adapter = this.container.lookup('adapter:' + name) || this.container.lookup('adapter:application') || this.adapter;
          lookup.serializer = this.container.lookup('serializer:' + name)  || lookup.adapter.serializer || this.container.lookup('serializer:application') || this.serializer;
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
    return this.getModel(name).adapter;
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
    } else {
      throw new Ember.Error("Invalid type for id for record");
    }
  },

  unload: function(record) {
    this.removeFromCache(record.constructor, record.get('id'));

    this.trigger('record:destroy', record);
    this.trigger('record:' + record.constructor.typeKey + ':destroy', record);
  },

  rollback: function(record) {
    this.rollbackRelationships(record);
    this.rollbackAttributes(record);
  },

  deserialize: function(type, data) {
    return type.serializer.deserialize(this, type, data);
  },

  serialize: function(record) {
    return record.constructor.serializer.serialize(this, record);
  },

  load: function(record, data) {
    return record.constructor.serializer.load(this, record.constructor, record, data);
  },

  push: function(type, data) {
    type = this.getModel(type);

    if(_.isArray(data)) {
      var self = this;
      return _.map(data, function(element) {
        return self.push(type, element);
      });
    } else {
      Ember.assert("Missing id in push", data.id);

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

  fetchAllRequired: function(record) {
    var self = this;
    var promises = [];

    _.each(record._relationships, function(relationship) {
      if(relationship.type.sync) {
        if(relationship.type.kind === 'belongsTo') {
          if(relationship.get('getId')){
            promises.push(self.find(relationship.get('getType'), relationship.get('getId')));
          }
        } else if(relationship.type.kind === 'hasMany') {
          promises.push(self.find(relationship.get('getType'), relationship.get('getIds')));
        } else {
          throw new Ember.Error("Unknown relationship type " + relationship.type.kind);
        }
      }
    });

    if(promises.length === 0) return Ember.RSVP.resolve(record, "no sync relationships");

    return Ember.RSVP.resolve(Ember.RSVP.all(promises), "fetching all sync relationships");
  },

  fetchAllRequiredPromise: function(promise) {
    var self = this;

    return promise.then(function(record) {
      if(_.isArray(record)) {
        return Ember.RSVP.all([Ember.RSVP.resolve(record),
          Ember.RSVP.all(record.map(function(data){
            return self.fetchAllRequired(data);
          }))
        ]);
      } else {
        return Ember.RSVP.all([Ember.RSVP.resolve(record), self.fetchAllRequired(record)]);
      }
    }).then(function(data) {
      return data[0];
    });
  },

  fetch: function(type, query) {
    type = this.getModel(type);
    var promise;

    var self = this;
    if(_.isArray(query)) {
      promise = type.adapter.findMany(this, type, query).then(function(data) {
        return data.map(function(element) {
          return self.push(type, element);
        });
      });

      return Ember.RSVP.resolve(this.fetchAllRequiredPromise(promise), "fetching many records (array)");
    } else if(_.isObject(query)) {
      promise = type.adapter.findQuery(this, type, query).then(function(data) {
        return data.map(function(element) {
          return self.push(type, element);
        });
      });

      return Ember.RSVP.resolve(this.fetchAllRequiredPromise(promise), "fetching many records (query)");
    } else if(_.isNumber(query) || _.isString(query)){
      var existing = this.loadFromCache(type, query);

      if(existing && existing.promise) {
        return Ember.RSVP.resolve(existing.promise, "record fetch already in progress");
      } else {
        var record = this.constructRecord(type);

        record.set('id', query);
        this.addToCache(type, record);

        promise = type.adapter.find(this, type, query).then(function(data) {
          self.load(record, data);

          return record;
        }, function(err) {
          self.removeFromCache(type, query);
          throw err;
        })['finally'](function(){
          delete record.promise;
        });

        record.promise = promise;

        return Ember.RSVP.resolve(this.fetchAllRequiredPromise(promise), "fetching single record");
      }
    } else if(_.isUndefined(query)) {
      promise = type.adapter.findAll(this, type).then(function(data) {
        var result =  data.map(function(element) {
          return self.push(type, element);
        });

        type.allLoaded = true;

        return result;
      });

      return Ember.RSVP.resolve(this.fetchAllRequiredPromise(promise), "fetching all records");
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

  findWithFields: function(type, id, fields) {
    var ret;

    if(!_.isArray(fields)) {
      Ember.assert('fields should be a string or an array of strings', _.isString(fields));
      fields = [fields];
    }

    return this.find(type, id).then(function(record) {
      ret = record;

      var promises = fields.map(function(field) {
        return record.get(field).get('promise');
      });

      return Ember.RSVP.all(promises);
    }).then(function() {
      return ret;
    });
  },

  findPage: function(type, per_page, page) {
    type = this.getModel(type);
    var self = this;

    Ember.assert("Pagination information not available", type.Pagination);

    var promise = this.find(type, {
      page_no: page,
      per_page: per_page
    }).then(function(data) {
      return DS.RecordArray.create({
        content: data,
        store: self,
        type: type,
        page: page,
        per_page: per_page,
        total: type.Pagination.total,
        sort_by: type.Pagination.sort_by,
        ascending: type.Pagination.ascending
      })
    });

    return Ember.RSVP.resolve(promise, "find fetching page (" + page + '@' + per_page + ')');
  },

  find: function(type, query) {
    type = this.getModel(type);
    var existing, promise;
    var self = this;

    if(_.isArray(query)) {
      var toGet = [];

      existing = query.map(function(element) {
        var record = self.getRecord(type, element);

        if(record) {
          return record;
        } else {
          toGet.pushObject(element);
          return null;
        }
      });

      if(toGet.length === 0) return Ember.RSVP.resolve(existing, "find returning cached records (many)");

      promise = this.fetch(type, toGet).then(function(data) {
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
      existing = this.getRecord(type, query);

      if(existing) return Ember.RSVP.resolve(existing, "find returning cached record (single)");

      return Ember.RSVP.resolve(this.fetch(type, query), "find fetching record (single)");
    } else if(_.isUndefined(query)) {
      if(type.allLoaded) {
        promise = Ember.RSVP.resolve(this.all(type)).then(function(data) {
          return DS.RecordArray.create({
            content: data,
            store: self,
            type: type
          })
        });

        return Ember.RSVP.resolve(promise, "find loading all records from cache");
      } else {
        promise = this.fetch(type, query).then(function(data) {
          return DS.RecordArray.create({
            content: data,
            store: self,
            type: type
          })
        });

        return Ember.RSVP.resolve(promise, "find fetching all records");
      }
    } else {
      throw new Ember.Error("Invalid query for find");
    }
  },

  constructRecord: function(type) {
    return this.getModel(type).create({
      store: this
    });
  },

  createRecord: function(type, data) {
    var record = this.constructRecord(type);

    record.set('isNew', true);

    _.each(data, function(value, key) {
      record.set(key, value);
    });

    this.trigger('record:create', record);
    this.trigger('record:' + record.constructor.typeKey + ':create', record);

    return record;
  },

  save: function(record) {
    var self = this;

    record.set('isSaving', true);
    record._state.set('error');

    if(record.get('isNew')) {
      return record.constructor.adapter.createRecord(this, record.constructor, record).then(function(data) {
        self.load(record, data);
        record.set('isSaved', true);
        record.set('isNew', false);
        return record;
      }, function(err) {
        record._state.set('error', err);
        throw err;
      })['finally'](function() {
        record.set('isSaving', false);
      });
    } else if(record.get('isDeleted')) {
      return record.constructor.adapter.deleteRecord(this, record.constructor, record).then(function(data) {
        self.unload(record);
        return data;
      }, function(err) {
        record._state.set('error', err);
        throw err;
      });
    } else if(record.get('isDirty')){
      return record.constructor.adapter.updateRecord(this, record.constructor, record).then(function(data) {
        self.load(record, data);
        self.rollback(record);

        record.set('isSaved', true);

        return record;
      }, function(err) {
        record._state.set('error', err);
        throw err;
      })['finally'](function() {
        record.set('isSaving', false);
      });
    } else {
      Ember.warn("Requested update for unchanged record");
    }
  }
});

require('scripts/data/core/model/model');

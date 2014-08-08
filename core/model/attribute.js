// Attributes are the properties of the model

// This is used to store the actual value
// original is the unmodified value
// value is the modified value, null means the attribute is not modified
// also supports default values
DS.Attribute = Ember.Object.extend(Ember.Evented, {
  getValue: function() {
    if(!_.isUndefined(this.value)) {
      return this.value;
    } else if(!_.isUndefined(this.original)){
      return this.original;
    } else {
      return _.result(this.type, 'defaultValue');
    }
  }.property('value', 'original'),

  valueProxy: function() {
    var self = this;

    // if returning JSON, we also need to track modifications to the object itself
    // only the first level is tracked, more can be implemented later
    if(this.type.transform.typeKey === 'json') {
      if(this.get('value')) {
        return Ember.ObjectProxy.create({
          content:this.get('value'),

          markDirty: function() {}
        });
      }

      return Ember.Object.create({
        content: this.get('getValue'),

        unknownProperty: function(key) {
          if(self.get('value')) return self.get('value')[key];

          return this.get('content')[key];
        },

        markDirty: function() {
          if(self.get('value')) return;

          self.set('value', Ember.copy(this.get('content'), true));
        },

        setUnknownProperty: function(key, value) {
          if(self.get('value')) {
            self.set('value.' + key, value);
            return value;
          }

          self.set('value', Ember.copy(this.get('content'), true));
          self.set('value.' + key, value);

          return value;
        }
      });
      // if returning an array, we also need to track modifications to the array
    } else if(this.type.transform.typeKey === 'array') {
      return Ember.ArrayProxy.create({
        content: self.get('getValue'),

        replaceContent: function(idx, amt, objects) {
          var array = [];

          this.get('content').forEach(function(item) {
            array.pushObject(item);
          });

          if(amt > 0) array.removeAt(idx, amt);

          if(objects.get('length') > 0) {
            objects.reverseObjects();
            objects.forEach(function(object) {
              array.insertAt(idx, object);
            });
          }

          self.setValue(array);
        }
      });
    } else {
      return this.get('getValue');
    }
  }.property('getValue'),

  setValue: function(value) {
    if(this.type.readOnly) throw new Ember.Error("Attribute '" + key + "' is read only");

    if(this.type.transform.equals(this.get('value'), value)) return;

    this.set('value', value);

    this.get('record').notifyPropertyChange('attributesDirty');
  },

  load: function(data) {
    var original = this.get('original');
    var value = this.type.transform.deserialize(data);

    if(this.type.transform.equals(original, value)) return;

    this.set('original', value);
  },

  unload: function() {
    return this.type.transform.serialize(this.get('getValue'));
  },

  rollback: function() {
    this.set('value');
  },

  notifyer:function(){
    this.get('record').notifyPropertyChange(this.type.key);
  }.observes('getValue'),

  isDirty: function() {
    return !_.isUndefined(this.get('value'));
  }.property('value')
});


// returns a computed property that forwards requests to a Attribute instance
DS.attr = function(type, options) {
  var meta = {
    type: type,
    isAttribute: true,
    options: options || {}
  };

  return Ember.computed(function(key, value) {
    var attribute = this._attributes[key];

    if(_.isUndefined(value)) {
      // get
      return attribute.get('valueProxy');
    } else {
      //set
      Ember.assert("Can not update id of record", key !== 'id');

      attribute.setValue(value);

      this.trigger('set', key, this.get('getValue'), value, attribute);
      this.trigger('set:' + key, this.get('getValue'), value, attribute);

      return value;
    }
  }).meta(meta);
};

DS.Model.reopenClass({
  attributes: Ember.computed(function() {
    var attributes = {};

    this.eachComputedProperty(function(key, meta) {
      if(meta.isAttribute) {
        attributes[key] = {
          key: key,
          transform: this.store.getTransform(meta.type),

          // options
          defaultValue: meta.options.defaultValue,
          readOnly: meta.options.readOnly,
          optional: meta.options.optional
        };
      }
    });

    return attributes;
  })
});

DS.Model.reopen({
  init: function() {
    this._super();

    var attributes = {};

    var self = this;
    _.each(Ember.get(this.constructor, 'attributes'), function(attribute, key){
      var meta = DS.Attribute.create({
        type: attribute,
        record: self
      });

      meta.addObserver('isDirty', self, function() {
        self.notifyPropertyChange('attributesDirty');
      });

      attributes[attribute.key] = meta;
    });

    this.set('_attributes', attributes);
  },

  attributesDirty: Ember.computed(function() {
    var dirty = false;
    _.each(this.get('_attributes'), function(value, key){
      if(value.get('isDirty')) {
        dirty = true;
      }
    });
    return dirty;
  }).property()
});

DS.Store.reopen({
  loadAttributes: function(record, data) {
    _.each(record.get('_attributes'), function(value, key) {
      if(_.isUndefined(data[key]) || _.isNull(data[key])) {
        Ember.warn("Non-optional field '" + key +"' missing for " + record.constructor.typeKey, record._attributes[key].type.optional);
      } else {
        value.load(data[key]);
      }

      delete value.value;
    });
  },

  rollbackAttributes: function(record) {
    _.each(record.get('_attributes'), function(value, key) {
      value.rollback();
    });

    record.notifyPropertyChange('attributesDirty');
  }
});


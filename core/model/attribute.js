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
    if(this.type.transform.typeKey === 'array') {
      var self = this;
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
            })
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
    return this.type.transform.deserialize(this.get('getValue'));
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
}

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
})

DS.Store.reopen({
  loadAttributes: function(record, data) {
    _.each(record.get('_attributes'), function(value, key) {
      if(_.isUndefined(data[key]) || _.isNull(data[key])) {
        Ember.assert("Non-optional field '" + key +"' missing for " + record.constructor.typeKey, record._attributes[key].type.optional);
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


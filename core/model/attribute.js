DS.Attribute = Ember.Object.extend(Ember.Evented, {
  getValue: function() {
    if(!_.isUndefined(this.value)) {
      return this.value;
    } else if(!_.isUndefined(this.original)){
      return this.original;
    } else {
      if(_.isFunction(this.default)) {
        return this.default(this);
      } else {
        return this.default;
      }
    }
  },

  load: function(data) {
    this.original = this.type.transform.deserialize(data);
  },

  rollback: function() {
    delete this.value;
  }
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
      return attribute.getValue();
    } else {
      //set
      Ember.assert("Can not update id of record", key !== 'id');
      if(this.type.readOnly) throw new Ember.Error("Attribute '" + key + "' is read only");

      attribute.set('isDirty', true);

      this.emit('set', key, this.getValue(attribute), value, attribute);
      this.emit('set:' + key, this.getValue(attribute), value, attribute);

      attribute.value = value;

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
          default: meta.options.default,
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
        type: attribute
      });

      meta.addObserver('isDirty', self, self.dirtyUpdate);

      attributes[attribute.key] = meta;
    });

    this.set('_attributes', attributes);
  },

  dirtyUpdate: function() {
    this.notifyPropertyChange('attributesDirty');
  },

  attributesDirty: Ember.computed(function() {
    var dirty = false;
    _.each(this.get('_attributes'), function(value, key){
      if(value.isDirty) {
        dirty = true;
      }
    });
    return dirty;
  })
})

DS.Store.reopen({
  loadAttributes: function(record, data) {
    _.each(record.get('_attributes'), function(value, key) {
      if(_.isUndefined(data[key]) ) {
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
  }
});


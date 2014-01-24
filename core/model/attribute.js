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

      attribute.set('isDirty', true);

      this.emit('set', key, getValue(attribute), value, attribute);
      this.emit('set:' + key, getValue(attribute), value, attribute);

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
          type: this.store.getType(meta.type),
          transform: this.store.getTransform(meta.type),

          // options
          default: meta.options.default
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
    this.constructor.attributes().forEach(function(key, attribute){
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
    this.get('_attributes').forEach(function(key, value){
      if(value.isDirty) {
        dirty = true;
      }
    });
    return dirty;
  }),

  loadAttributes: function(data) {
    this.get('_attributes').forEach(function(key, value) {
      value.load(data);

      delete value.value;
    });
  },

  rollbackAttributes: function() {
    this.get('_attributes').forEach(function(key, value) {
      value.rollback();
    });
  }
})


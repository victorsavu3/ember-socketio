DS.UpdateInterceptor = Ember.ArrayProxy.extend(DS.PromiseArrayForward, {
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

    this.setValue(array);
  }
});

DS.HasManyRelationship = DS.Relationship.extend({
  getIds: function() {
    if(this.get('ids')) {
      return this.get('ids');
    } else if(this.get('original')){
      return this.get('original');
    } else {
      return _.result(this.type, 'defaultValue');
    }
  }.property('ids', 'original'),

  isDirty: function() {
    return !_.isUndefined(this.get('ids'));
  }.property('ids'),

  store: Ember.computed.alias('record.store'),

  getValue: function() {
    if(_.isUndefined(this.get('getIds'))) {
      return;
    }

    var value =  this.get('store').getRecord(this.get('getType'), this.get('getIds'));

    Ember.assert("Sanity check failed (sync relationship used before data available)", _.every(value, function(element) {
      return !_.isUndefined(element);
    }));

    return value;
  }.property('getIds'),

  setValue: function(value) {
    if(this.type.readOnly) throw new Ember.Error("Relation is read only");

    if(!_.isArray(value)) throw new Ember.Error("hasMany value is not an array");

    if(this.type.isSet) {
      value = _.sortBy(value, 'id');
    }

    if(_.isEqual(value, this.get('ids'))) return;

    if(value.every(function(value){
      return _.isNumber(value) || _.isString(value);
    })) {

      this.set('ids', value);
    } else {

      Ember.assert("Relation set to value that does not have an id", value.every(function(value){
        return value.get('id');
      }));

      var self = this;
      Ember.assert("Relation set to value that does not have the proper type, expected " + this.get('getType').name, value.every(function(value){
        return value instanceof self.get('getType');
      }));

      this.set('ids', value.mapBy('id'));
    }

    if(this.type.eager) {
      this.get('store').find(this.get('getType'), this.get('ids'));
    }
  },

  valueReal: function() {
    if(this.type.sync) {
      return this.get('getValue');
    } else {
      var ids = this.get('getIds');

      if(_.isUndefined(ids) || _.isNull(ids)) {
        return ids;
      } else {
        return DS.PromiseArray.create({promise: this.get('store').find(this.get('getType'), ids)});
      }
    }
  }.property('getValue', 'getIds'),

  value: function() {
    var self = this;
    return DS.UpdateInterceptor.create({
      content: self.get('valueReal')
    });
  }.property('valueReal', 'isDirty'),

  load: function(value) {
    if(this.type.isSet) {
      value = _.sortBy(value, 'id');
    }

    if(this.type.embedded) {
      this.get('store').push(this.get('getType'), value);

      var ids = value.mapBy('id');
      Ember.warn("Non-optional hasMany relationship '" + this.type.key +"' missing for " + this.record.constructor.typeKey, ids || this.type.optional);
      if(_.isEqual(this.get('original'), ids)) return;
      this.set('original', ids);
    } else {
      Ember.warn("Non-optional hasMany relationship '" + this.type.key +"' missing for " + this.record.constructor.typeKey, value || this.type.optional);
      if(_.isEqual(this.get('original'), value)) return;
      this.set('original', value);
    }
  },

  rollback: function() {
    this.set('ids');
  },

  notifyer:function(){
    this.get('record').notifyPropertyChange(this.key);
  }.observes('value')
});

DS.hasMany = function(type, options) {
  Ember.assert("type must be given or relationship is polymorphic", _.isString(type) || (_.isObject(type) && type.polymorphic));

  if(_.isObject(type)) {
    options = type;
    type = null;
  }

  var meta = {
    type: type,
    isRelationship: true,
    kind: 'hasMany',
    options: options || {}
  };

  return Ember.computed(function(key, value) {
    var relationship = this._relationships[key];
    Ember.assert("Sanity check failed (invalid kind)", relationship.type.kind === 'hasMany');

    relationship.key = key;

    if(_.isUndefined(value)) {
      return relationship.get('value');
    } else {
      this.trigger('set', key, relationship.get('value'), value, relationship);
      this.trigger('set:' + key, relationship.get('value'), value, relationship);

      relationship.setValue(value);

      return relationship.get('value');
    }
  }).meta(meta);
};

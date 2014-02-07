DS.HasManyRelationship = DS.Relationship.extend({
  getIds: function() {
    if(this.get('ids')) {
      return this.get('ids');
    } else if(this.get('original')){
      return this.get('original');
    } else {
      return _.result(this.type.default);
    }
  }.property('ids', 'original'),

  isDirty: function() {
    return !_.isUndefined(this.get('ids'));
  }.property('ids'),

  store: Ember.computed.alias('record.store'),

  getValue: function() {
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
      Ember.assert("Relation set to value that does not have the proper type, expected " + this.get('getType').name, value.every(function(value){
        return value instanceof this.get('getType');
      }));

      this.set('ids', value.mapBy('id'));
    }

    if(this.type.eager) {
      this.get('store').find(this.get('getType'), this.get('ids'));
    }
  },

  value: function() {
    if(this.type.sync) {
      return this.get('getValue');
    } else {
      var ids = this.get('getIds');

      if(_.isUndefined(ids)) {
        return;
      } else {
        return DS.PromiseArray.create({promise: this.get('store').find(this.get('getType'), ids)});
      }
    }
  }.property('getValue'),

  load: function(value) {
    if(this.type.isSet) {
      value = _.sortBy(value, 'id');
    }

    if(this.type.embedded) {
      this.get('store').push(this.get('getType'), value);

      var ids = value.mapBy('id');
      if(_.isEqual(this.get('original'), ids)) return;
      this.set('original', ids);
    } else {
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

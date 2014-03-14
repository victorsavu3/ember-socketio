DS.BelongsToRelationship = DS.Relationship.extend({
  getId: function() {
    if(this.get('id')) {
      return this.get('id');
    } else if(this.get('original')){
      return this.get('original');
    } else {
      return _.result(this.type, 'defaultValue');
    }
  }.property('id', 'original'),

  isDirty: function() {
    return !_.isUndefined(this.get('id'));
  }.property('id'),

  store: Ember.computed.alias('record.store'),

  getValue: function() {
    if(_.isUndefined(this.get('getId'))) return;
    var value =  this.get('store').getRecord(this.get('getType'), this.get('getId'));
    Ember.assert("Sanity check failed (sync relationship used before data available)", !_.isUndefined(value));
    return value;
  }.property('getId'),

  setValue: function(value) {
    if(this.type.readOnly) throw new Ember.Error("Relation is read only");

    if(_.isString(value) || _.isNumber(value)) {
      this.set('id', value);
      this.notifyPropertyChange('id');
    } else {
      if(_.isUndefined(value) || _.isNull(value)) {
        this.set('id');
      } else {
        Ember.assert("Relation set to value that does not have an id", value.get('id'));
        Ember.assert("Relation set to value that does not have the proper type, expected " + this.get('getType').name, value instanceof this.get('getType'));

        this.set('id', value.get('id'));
      }
    }

    if(this.type.eager) {
      this.get('store').find(this.get('getType'), this.get('id'));
    }
  },

  value: function() {
    if(this.type.sync) {
      return this.get('getValue');
    } else {
      var id = this.get('getId');

      if(_.isUndefined(id) || _.isNull(id)) {
        return id;
      } else {
        return DS.PromiseObject.create({promise: this.get('store').find(this.get('getType'), id)});
      }
    }
  }.property('getValue'),

  load: function(value) {
    if(this.type.embedded) {
      this.get('store').load(value);
      this.set('original', value.id);
    } else {
      this.set('original', value);
    }

    Ember.assert("Non-optional belongsTo relationship '" + this.type.key +"' missing for " + this.record.constructor.typeKey, this.get('original') || this.type.optional);
  },

  rollback: function() {
    this.set('id')
  },

  notifyer:function(){
    this.get('record').notifyPropertyChange(this.key);
  }.observes('value')
});

DS.belongsTo = function(type, options) {
  Ember.assert("type must be given or relationship is polymorphic", _.isString(type) || (_.isObject(type) && type.polymorphic));

  if(_.isObject(type)) {
    options = type;
    type = null;
  }

  var meta = {
    type: type,
    isRelationship: true,
    kind: 'belongsTo',
    options: options || {}
  };

  return Ember.computed(function(key, value) {
    var relationship = this._relationships[key];
    Ember.assert("Sanity check failed (invalid kind)", relationship.type.kind === 'belongsTo');

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
}

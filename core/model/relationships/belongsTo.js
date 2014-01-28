DS.BelongsToRelationship = DS.Relationship.extend({
  getId: function() {
    if(this.get('id')) {
      return this.get('id');
    } else if(this.get('original')){
      return this.get('original');
    } else {
      return _.result(this.type.default);
    }
  }.property('id', 'original'),

  store: Ember.computed.alias('record.store'),

  getValue: function() {
    var value =  this.get('store').get(this.type.type, this.get('getId'));
    Ember.assert("Sanity check failed (sync relationship used before data available)", _.isUndefined(value));
    return value;
  }.property('getId'),

  setValue: function(value) {
    if(this.type.readOnly) throw new Ember.Error("Relation is read only");

    this.set('isDirty', true);

    if(_.isString(value) || _.isNumber(value)) {
      this.set('id', value);
    } else {
      Ember.assert("Relation set to value that does not have an id", value.get('id'));
      Ember.assert("Relation set to value that does not have the proper type, expected " + this.type.type.name, value instanceof this.type.type);

      this.set('id', value.get('id'));
    }

    if(this.type.eager) {
      this.get('store').find(this.type.type, this.get('id'));
    }
  },

  value: function() {
    if(this.type.sync) {
      return this.get('getValue');
    } else {
      return this.get('store').find(this.type.type, this.getId());
    }
  }.property('getValue'),

  load: function(value) {
    if(this.type.embedded) {
      this.get('store').load(value);
      this.set('original', value.id);
    } else {
      this.set('original', value);
    }
  },

  rollback: function() {
    this.set('isDirty', false);

    this.set('id')
  },

  notifyer:function(){
    Ember.notifyObservers(this.get('record'), this.key);
  }.observes('value')
});

DS.belongsTo = function(type, options) {
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
      this.emit('set', key, relationship.get('value'), value, relationship);
      this.emit('set:' + key, relationship.get('value'), value, relationship);

      relationship.setValue(value);

      return relationship.get('value');
    }
  }).meta(meta);
}

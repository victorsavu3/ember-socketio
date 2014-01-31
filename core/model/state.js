DS.State = Ember.Object.extend(Ember.Evented, {
  init: function() {
    this._super();

    this.set('error', []);
  },

  _state: 'undefined',
  isLoaded: false,

  state: function(){
    return this.get('_state')
  }.property('_state').readOnly(),

  setState: function(state) {
    var old = this.get('state');

    if(!this.get('isLoaded') && state === 'loaded')
      this.set('isLoaded', true);

    this.emit('state', state, old);

    this.set('_state', state);
  },

  setError: function(error) {
    if(_.isUndefined(error)){
      this.setState('undefined');
      this.set('error');
    } else {
      this.setState('error');
      this.set('error', error);
    }
  },

  isError: function() {
    return this.get('state') === 'error';
  }.property('state'),

  isLoading: function() {
    return this.get('state') === 'loading';
  }.property('state'),

  isSaving: function() {
    return this.get('state') === 'loading';
  }.property('state'),

  isDeleted: function() {
    return this.get('state') === 'deleted';
  }.property('state'),

  isNew: function() {
    return this.get('state') === 'new';
  }.property('state'),

  isValid: true
});

DS.Model.reopen({
  init: function() {
    this._super();

    this.set('_state', DS.State.create());
  },

  setState: function(state) {
    this._state.setState(state);
  },

  setError: function(error) {
    this._state.setError(error);
  },

  isNew: Ember.computed.alias('_state.isNew'),
  isDeleted: Ember.computed.alias('_state.isDeleted'),
  isLoaded: Ember.computed.alias('_state.isLoaded'),
  isLoading: Ember.computed.alias('_state.isLoading'),
  isSaving: Ember.computed.alias('_state.isSaving'),
  isError: Ember.computed.alias('_state.isError'),
  isValid: Ember.computed.alias('_state.isValid'),
  error: Ember.computed.alias('_state.error').readOnly()
});

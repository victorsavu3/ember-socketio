DS.State = Ember.Object.extend({
  init: function() {
    this._super();

    this.set('error');
  },

  isError: function() {
    return this.get('error');
  }.property('state'),

  isValid: true
});

DS.Model.reopen({
  init: function() {
    this._super();

    this.set('_state', DS.State.create());
  },

  setError: function(error) {
    this._state.setError(error);
  },

  isNew: Ember.computed.alias('_state.isNew'),
  isDeleted: Ember.computed.alias('_state.isDeleted'),
  isSaving: Ember.computed.alias('_state.isSaving'),
  isSaved: Ember.computed.alias('_state.isSaved'),
  isError: Ember.computed.alias('_state.isError'),
  isValid: Ember.computed.alias('_state.isValid'),
  error: Ember.computed.alias('_state.error')
});

DS.PromiseObject = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);
DS.PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);

DS.PromiseArrayForward = Ember.Mixin.create({
  isFulfilled: Ember.computed.alias('content.isFulfilled'),
  isPending: Ember.computed.alias('content.isPending'),
  isSettled: Ember.computed.alias('content.isSettled'),
  isRejected: Ember.computed.alias('content.isRejected'),
  reason: Ember.computed.alias('content.reason'),
  promise: Ember.computed.alias('content.promise')
});

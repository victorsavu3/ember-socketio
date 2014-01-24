var DS;
if ('undefined' === typeof DS) {
  DS = Ember.Namespace.create({
    VERSION: '0.0.1'
  });

  if ('undefined' !== typeof window) {
    window.DS = DS;
  }

  if (Ember.libraries) {
    Ember.libraries.registerCoreLibrary('Ember socket.io', DS.VERSION);
  }
}

require('scripts/data/core/*');

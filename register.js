require('scripts/data/main')
require('scripts/data/adapters/*')

Ember.onLoad('Ember.Application', function(Application) {
  Application.initializer({
    name: "store",

    initialize: function(container, application) {
      application.register('store:main', application.Store || DS.Store);
    }
  });

  Application.initializer({
    name: "transforms",
    before: "store",

    initialize: function(container, application) {
      application.register('transform:boolean', DS.BooleanTransform);
      application.register('transform:date', DS.DateTransform);
      application.register('transform:number', DS.NumberTransform);
      application.register('transform:string', DS.StringTransform);
    }
  });

  Application.initializer({
    name: "adapter",
    before: "store",

    initialize: function(container, application) {
      application.register('adapter:localstorage', DS.LocalStorageAdapter);
      application.register('adapter:memory', DS.MemoryAdapter);
    }
  });

  Application.initializer({
    name: "injectStore",
    before: "store",

    initialize: function(container, application) {
      application.inject('controller', 'store', 'store:main');
      application.inject('route', 'store', 'store:main');
      application.inject('serializer', 'store', 'store:main');
      application.inject('adapter', 'store', 'store:main');
    }
  });

});

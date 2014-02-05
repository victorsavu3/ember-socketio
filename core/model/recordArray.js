DS.RecordArray = Ember.ArrayProxy.extend({
  arrangedContent: function() {
    return Ember.A(this.get('content'));
  }.property('content.[]'),

  init: function() {
    var store = this.get('store');
    var content = this.get('content');
    var filter = this.get('recordFilter');
    var type = this.get('type').typeKey;

    store.on('record:' + type + ':create', function(record) {
      if((_.isUndefined(filter) || filter(self, record)) && !content.contains(record)) {
       content.pushObject(record);
      }
    });

    store.on('record:' + type + ':destroy', function(record) {
      content.removeObject(record);
    });
  }
});

require('scripts/data/core/model/arrays/*');

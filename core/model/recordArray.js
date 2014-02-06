DS.RecordArray = Ember.ArrayProxy.extend({
  init: function() {
    this._super();

    var store = this.get('store');
    var filter = this.get('recordFilter');
    var type = this.get('type').typeKey;

    var self = this;

    store.on('record:' + type + ':create', function(record) {
      if((_.isUndefined(filter) || filter(self, record)) && !self.contains(record)) {
        self.pushObject(record);
      }
    });

    store.on('record:' + type + ':destroy', function(record) {
      if(self.contains(record)) {
        self.removeObject(record);
      }
    });
  }
});

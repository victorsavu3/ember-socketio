DS.RecordArray = Ember.ArrayProxy.extend({
  init: function() {
    var store = this.get('store');
    var filter = this.get('recordFilter');
    var type = this.get('type').typeKey;

    var self = this;

    store.on('record:' + type + ':create', function(record) {
      if((_.isUndefined(filter) || filter(self, record)) && !self.contains(record)) {
        self.pushObject(record);
        self.notifyPropertyChange('content');
      }
    });

    store.on('record:' + type + ':destroy', function(record) {
      if(self.contains(record)) {
        self.removeObject(record);
        self.notifyPropertyChange('content');
      }
    });
  }
});

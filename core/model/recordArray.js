DS.RecordArray = Ember.ArrayProxy.extend({
  total_pages: function() {
    var total = this.get('total');
    var per_page = this.get('per_page');

    var rest = total % per_page;
    var ret = total / per_page;

    if(rest !== 0) {
      ret += 1;
    }

    return ret;
  }.property('total', 'per_page'),

  arrangedContent: function() {
    if(this.get('page')) {
      var page = this.get('page') - 1;
      var total = this.get('total');
      var per_page = this.get('per_page');

      var ret = this.get('content');

      if(this.get('sort_by')) {
        ret =  ret.sortBy(this.get('sort_by'));

        var self = this;
        ret.forEach(function(data) {
          data.addObserver(self.get('sort_by'), self, self.arrangedContentChanged);
        });
      }

      if(!this.get('ascending')) {
        ret = ret.reverse();
      }

      return ret.slice(page * per_page, (page + 1) * per_page);
    } else {
      return this.get('content');
    }
  }.property('content.@each', 'page', 'per_page', 'sort_by', 'ascending'),

  arrangedContentChanged: function() {
    this.notifyPropertyChange('arrangedContent');
  },

  init: function() {
    this._super();

    var store = this.get('store');
    var filter = this.get('recordFilter');
    var type = this.get('type').typeKey;
    var content = this.get('content');

    var self = this;

    store.on('record:' + type + ':create', function(record) {
      if((_.isUndefined(filter) || filter(self, record)) && !content.contains(record)) {
        content.pushObject(record);
      }
    });

    store.on('record:' + type + ':destroy', function(record) {
      if(content.contains(record)) {
        content.removeObject(record);
      }
    });
  }
});

angular.module('E50Editor')
  .factory('E50Documents', function() {
    return {
      docs: {},
      get: function(id) {
        if(this.docs[id] !== "undefined") {
          return this.docs[id];
        }
        return false;
      },
      set: function(id, doc) {
        this.docs[id] = doc;
      }
    };
  });
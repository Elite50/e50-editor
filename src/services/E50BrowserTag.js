angular.module('E50Editor')
  .factory('E50BrowswerTag', function() {
    return function(tag){
      if(!tag) return (_browserDetect.ie <= 8)? 'P' : 'p';
      else if(tag === '') return (_browserDetect.ie === undefined)? 'div' : (_browserDetect.ie <= 8)? 'P' : 'p';
      else return (_browserDetect.ie <= 8)? tag.toUpperCase() : tag;
    };
  });
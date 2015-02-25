angular.module('E50Editor')
  .factory('E50BrowswerTag', function() {
    var _browserDetect = {
      ie: (function(){
        var undef,
          v = 3,
          div = document.createElement('div'),
          all = div.getElementsByTagName('i');

        while (
          div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
          );

        return v > 4 ? v : undef;
      }()),
      webkit: /AppleWebKit\/([\d.]+)/i.test(navigator.userAgent)
    };
    return function(tag){
      if(!tag) return (_browserDetect.ie <= 8)? 'P' : 'p';
      else if(tag === '') return (_browserDetect.ie === undefined)? 'div' : (_browserDetect.ie <= 8)? 'P' : 'p';
      else return (_browserDetect.ie <= 8)? tag.toUpperCase() : tag;
    };
  });
angular.module('E50Editor')
  .directive('e50Popover', function($timeout) {

    var template = [
      '<div class="link-manager" ng-repeat="popover in popovers" ng-show="popover.show">',
      '<input type="text" ng-model="popover.link" />',
      '<a href="" target="_blank" ng-attr-href="{{popover.link}}">Open</a>',
      '</div>'
    ];

    return {
      template: template.join(''),
      link: function(scope, elm) {
        scope.$on('e50Popover', function(ev, popoverElm) {
          var id = popoverElm.attr('popover');
          angular.forEach(scope.popovers, function(popover, key) {
            popover.show = (key === id);
          });
          $timeout(function() {
            var offset = popoverElm.offset();
            offset.top = offset.top - elm.height() - 5;
            offset.left = Math.ceil(offset.left) + popoverElm.width() - elm.width();
            elm.css(offset);
          });
        });
      }
    };

  });
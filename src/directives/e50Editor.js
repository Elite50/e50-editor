angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-toolbars buttons="buttons"></div>',
    '<div class="template" e50-template ng-model="html" buttons="buttons" ng-show="!toggle" document="document"></div>',
    '<textarea ng-model="html" ng-show="toggle"></textarea>'
  ];

  return {
    restrict: 'EA',
    template: template.join(''),
    scope: {
      html: '=ngModel',
      buttons: "=?",
      toggle: "=?",
      document: "=?"
    }
  };
});
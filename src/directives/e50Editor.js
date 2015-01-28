angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-toolbars buttons="buttons" document="document" override="override"></div>',
    '<div class="template" e50-template ng-model="html" buttons="buttons" ng-show="!toggle" document="document"></div>',
    '<textarea ng-model="html" ng-show="toggle" style="width:100%;height:100%;border: 1px solid #e4e4e4;padding:15px;"></textarea>'
  ];

  return {
    restrict: 'EA',
    template: template.join(''),
    scope: {
      html: '=ngModel',
      buttons: "=?",
      toggle: "=?",
      document: "=?",
      override: "=?"
    }
  };
});
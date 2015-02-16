angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-popover class="e50-popover"></div>',
    '<div e50-image class="e50-image"></div>',
    '<div e50-toolbars buttons="buttons" iframe-id="iframeId" override="override"></div>',
    '<div class="template" e50-template ng-model="html" ng-show="!toggle"></div>',
    '<textarea ng-model="html" ng-show="toggle" style="width:100%;height:100%;border: 1px solid #e4e4e4;padding:15px;"></textarea>'
  ];

  return {
    restrict: 'EA',
    template: template.join(''),
    scope: {
      html: '=ngModel',
      buttons: "=?",
      toggle: "=?",
      iframeId: "=?",
      override: "=?",
      imageSaved: "=?",
      aviaryOptions: "=?"
    }
  };
});
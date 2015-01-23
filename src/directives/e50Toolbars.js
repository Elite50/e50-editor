angular.module('E50Editor')
.directive('e50Toolbars', function(E50EditorButtons, E50EditorIcons) {

  var template = [
    '<div class="toolbars">',
      '<div class="group" ng-repeat="(key,editable) in buttons" ng-show="editable.focused">',
        '<button type="button" unselectable="on" ng-repeat="btn in editable.buttons" class="format-button" ng-click="execute(btn)" ng-bind-html="name(btn)" ng-class="{active:isActive(btn)}"></button>',
      '</div>',
    '</div>'
  ];

  return {
    scope: {
      buttons: "="
    },
    template: template.join(''),
    link: function(scope) {

      // Get the name of the button, if there's no icon for it
      scope.name = function(tag) {
        var icon = E50EditorIcons(tag);
        return icon ? icon : E50EditorButtons[tag].name;
      };

      // Is the current button active
      scope.isActive = function(tag) {
        return E50EditorButtons[tag].isActive();
      };

      // Execute the button
      scope.execute = function(tag) {
        return E50EditorButtons[tag].execute();
      };
    }
  };

});
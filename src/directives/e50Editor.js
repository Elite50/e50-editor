angular.module('E50Editor')
.directive('e50Editor', function(E50EditorButtons, E50DefaultToolbar, E50EditorIcons) {

  return {
    restrict: 'EA',
    replace:true,
    templateUrl: '/src/views/e50-editor.tpl.html',
    scope: {
      html: '=ngModel',
      tools: '=?e50Tools'
    },
    link: function(scope, elm) {

      scope.focused = false;
      scope.toolbars = scope.tools || E50DefaultToolbar;

      // Watch mouse down events, to disable/enable format buttons
      function mouseDownHandler(e) {
        var parent = $(e.target).closest('.live-editor');
        if(!parent.length && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
          scope.focused = false;
          scope.edit = false;
          parent.removeClass('focused');
          scope.$apply();
        }
      }

      // Bind the mousedown event to the document
      angular.element(document).bind('mousedown', mouseDownHandler);

      // Unbind the mouse down handler when the scope is destroyed
      scope.$on('$destroy', function() {
        angular.element(document).unbind('mousedown', mouseDownHandler);
      });

      // Get the name of the button, if there's no icon for it
      scope.name = function(tag) {
        var icon = E50EditorIcons(tag);
        return icon ? icon : E50EditorButtons[tag].name;
      };

      // Is the current button active
      scope.isActive = function(tag) {
        return E50EditorButtons[tag].isActive() && !scope.isDisabled();
      };

      // Execute the button
      scope.execute = function(tag) {
        return E50EditorButtons[tag].execute();
      };

      // Is the button disabled
      scope.isDisabled = function() {
        return !scope.focused;
      }
    }
  };
});
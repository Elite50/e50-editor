angular.module('E50Editor')
.directive('e50Toolbars', function(E50EditorButtons, E50EditorIcons, $document, E50Documents) {

  var template = [
    '<div class="toolbars" ng-if="!override">',
      '<div class="group" ng-repeat="(key,editable) in buttons" ng-show="editable.focused">',
        '<button type="button" unselectable="on" ng-repeat="btn in editable.buttons" class="format-button" ng-click="execute($event,btn)" ng-bind-html="name(btn)" ng-class="{active:isActive(btn)}"></button>',
      '</div>',
    '</div>'
  ];

  return {
    scope: {
      buttons: "=",
      iframeId: "=",
      override: "=?"
    },
    template: template.join(''),
    link: function(scope) {

      // Get the iframe document if it exists
      var iframe = E50Documents.get(scope.iframeId);

      var doc;
      if(iframe) {
        doc = iframe[0].contentDocument || iframe[0].contentWindow.document;
      }

      // Support for multiple documents, ie iframes
      function command(tag) {
        // If we didn't get the iframe before, get it now
        if(!doc) {
          iframe = E50Documents.get(scope.iframeId);
          doc = iframe[0].contentDocument || iframe[0].contentWindow.document;
        }
        var _command = E50EditorButtons[tag];
        _command.iframe = iframe;
        _command.setDocument(doc || $document[0]);
        return _command;
      }

      // Get the name of the button, if there's no icon for it
      scope.name = function(tag) {
        var icon = E50EditorIcons(tag);
        if(!E50EditorButtons[tag]) { return false; }
        return icon ? icon : E50EditorButtons[tag].name;
      };

      // Is the current button active
      scope.isActive = function(tag) {
        try {
          return command(tag).isActive();
        } catch(e) {}
      };

      // Execute the button
      scope.execute = function(e, tag) {
        console.log(e);
        //e.preventDefault();
        return command(tag).execute();
      };
    }
  };

});
angular.module('E50Editor')
.directive('e50Template', function(E50Documents, E50EditorConfig, $sanitize) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ngModel) {

      scope.buttons = scope.buttons || {};

      // If there's no initial html, use the view's html
      if(!scope.html) {
        ngModel.$setViewValue(elm.html());
      }

      var numOfEditables = 0;
      function setupEditableAreas() {
        var editables = elm.find('['+E50EditorConfig.attrs.editable+']');
        if(numOfEditables === editables.length) { return; }
        numOfEditables = editables.length;
        scope.buttons = {};
        angular.forEach(editables, function (editable, i) {
          editable = angular.element(editable);
          editable.attr('contenteditable', true);
          editable.attr(E50EditorConfig.attrs.editable, i);
          var focused = scope.buttons[i] ? scope.buttons[i].focused : false;
          scope.buttons[i] = {
            id: i,
            focused: focused,
            buttons: editable.attr(E50EditorConfig.attrs.format) ? editable.attr(E50EditorConfig.attrs.format).split(',') : []
          };
        });
        ngModel.$setViewValue(elm.html());
      }

      scope.$watch('html', function(newV, oldV) {
        if(!newV && newV === oldV) { return false; }
        setupEditableAreas();
      });

      // On mousedown, toggle focused property for each editable area
      function mouseDownHandler(e) {
        var target = angular.element(e.target);
        var editable = target.closest('['+E50EditorConfig.attrs.editable+']');
        var button   = target.closest('.format-button');

        // Blur all editable areas, if we didn't click on anything associated with editing
        if(!editable.length && !button.length) {
          angular.forEach(scope.buttons, function(btn) {
            btn.focused = false;
          });
          return;
        }

        // Get the editable area's id
        var id = parseInt(editable.attr(E50EditorConfig.attrs.editable),10);

        // Toggle focused property
        if(scope.buttons[id]) {
          angular.forEach(scope.buttons, function(btn) {
            btn.focused = btn.id === id;
          });
        }

        // Update scope
        scope.$apply();
      }

      // Document reference
      var iframe = E50Documents.get(scope.iframeId);
      var iframeDoc = iframe[0].contentDocument || iframe[0].contentWindow.document;
      var doc = angular.element(iframeDoc || document);
      var isIframe = doc[0] !== document;
      if(isIframe) {
        var parentDoc = angular.element(document);
      }

      // Apply mouse down handler
      doc.bind('mousedown', mouseDownHandler);

      function mouseUpHandler() {
        ngModel.$setViewValue(elm.html());
        scope.$apply();
      }

      // On mouse, scope apply the changes. We need this to update the active toolbar buttons
      doc.bind('mouseup', mouseUpHandler);

      // We need to add mouse event handlers to the parentDocument bc clicks don't propagate past the iframe
      if(isIframe) {
        parentDoc.bind('mousedown', mouseDownHandler);
        parentDoc.bind('mouseup', mouseUpHandler);
      }

      // Unbind event watchers on the document when the scope is destroyed
      scope.$on('$destroy', function() {
        doc.unbind('mousedown', mouseDownHandler);
        doc.unbind('mouseup', mouseUpHandler);
        if(isIframe) {
          parentDoc.unbind('mousedown', mouseDownHandler);
          parentDoc.unbind('mouseup', mouseUpHandler);
        }
      });

      // When the model changes, update the view
      ngModel.$render = function() {
        elm.html(ngModel.$viewValue);
      };

      // Remove script tags
      ngModel.$formatters.push(function(html) {
        var elm = angular.element(html);
        var scripts = elm.find('script');
        scripts.remove();
        return elm[0].outerHTML;
      });

      // On every keyup, sync the view with the model (scope.html) only if we are in view mode
      elm.bind('keyup', function(e) {
        if(!scope.toggle) {
          ngModel.$setViewValue(elm.html());
        }
        scope.$apply();
      });

      // Watch events to add text
      scope.$on("e50AddText", function(event, id, text) {
        if(id !== scope.iframeId) { return false; }
        var sel = rangy.getIframeSelection(iframe[0]);
        var range = sel.getRangeAt(0);
        var node = document.createTextNode(text);
        range.collapse(false);
        range.insertNode(node);
        range.collapseAfter(node);
        sel.setSingleRange(range);
        iframe[0].contentWindow.focus();
        ngModel.$setViewValue(elm.html());
      });

      // Watch for updateViewValue events coming from other directives
      scope.$on('updateViewValue', function() {
        ngModel.$setViewValue(elm.html());
      });
    }
  };
});
angular.module('E50Editor')
.directive('e50Template', function(E50Documents) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ngModel) {

      scope.buttons = scope.buttons || {};

      // If there's no initial html, use the view's html
      if(!scope.html) {
        ngModel.$setViewValue(elm.html());
      }

      // Track the number of editable areas
      var numOfEditables = $(elm).find('[editable]').length;

      // Setup the buttons for each editable area
      function getButtons() {

        // Recheck editable areas
        var newEditables = $(elm).find('[editable]');

        // Don't re-add editable areas
        if(newEditables.length === numOfEditables) { return false; }

        // Set the new number of editable areas
        numOfEditables = newEditables.length;

        // Re-initialize buttons
        scope.buttons = {};

        // Add editable areas, and format buttons
        angular.forEach(newEditables, function (editable) {
          var e = angular.element(editable);
          e.attr('contenteditable', true);
          scope.buttons[e.attr('editable')] = {
            focused: false,
            buttons: e.attr("format") ? e.attr('format').split(',') : []
          };
        });

        // Update the view value
        ngModel.$setViewValue(elm.html());
      }

      scope.$watch('html', function(newV, oldV) {
        if(!newV && newV === oldV) { return false; }
        getButtons();
      });

      // On mousedown, toggle focused property for each editable area
      function mouseDownHandler(e) {
        var target = $(e.target);
        var editable = target.closest('[editable]');
        var button   = target.closest('.format-button');

        // Blur all editable areas, if we didn't click on anything associated with editing
        if(!editable.length && !button.length) {
          Object.keys(scope.buttons).forEach(function(editableId) {
            scope.buttons[editableId].focused = false;
          });
          scope.showPopover = false;
          return;
        }

        // Get the editable area's id
        var id = editable.attr("editable");

        // Toggle focused property
        if(scope.buttons[id]) {
          Object.keys(scope.buttons).forEach(function(editableId) {
            scope.buttons[editableId].focused = (id === editableId);
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

      // On every keyup, sync the view with the model (scope.html)
      elm.bind('keyup', function(e) {
        ngModel.$setViewValue(elm.html());
        scope.$apply();
      });

      // Add drag-over class
      elm.bind('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        elm.addClass('drag-over');
      });

      // Remove drag-over class
      elm.bind('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        elm.removeClass('drag-over');
      });

      // Insert the image on drop, and update the viewValue
      var dropHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;

        var target = angular.element(e.target);
        var editable = target.closest('[editable]');

        if(!editable.length) {
          return false;
        }

        // Set the caret position to the start of the placeholder
        if(target.hasClass('placeholder')) {
          //var iframeDoc = isIframe ? doc : parentDoc;
        }

        var dataTransfer = e.originalEvent.dataTransfer;

        // Insert each image
        angular.forEach(dataTransfer.files, function(file) {

          // Only support images for now
          var imageType = /image.*/;
          if (!file.type.match(imageType)) {
            alert('Only images allowed');
            return;
          }

          // New file reader to read the dropped file
          var reader = new FileReader();

          // On load, insert the image, update the view value, and sync
          reader.onload = function(e) {
            if(target.hasClass('placeholder')) {
              target.attr('src', e.target.result);
              target.removeClass('placeholder');
            } else {
              var img = $('<img/>');
              img.attr('src', e.target.result);
              img.css({width: '100%'});
              img.insertAfter(target);
            }
            elm.removeClass('drag-over');
            ngModel.$setViewValue(elm.html());
            scope.$apply();
          };

          // Init onload event
          reader.readAsDataURL(file);
        });

        // Prevent any default functionality
        return false;
      };

      // Watch for drop event
      elm.bind('drop', dropHandler);

      scope.popovers = {};

      // Popover handler
      function popoverHandler(e) {
        var target = angular.element(e.target);
        var popover  = target.closest('.e50-popover');
        if(!target.attr('popover')) {
          target = target.closest('[popover]');
        }
        if(!popover.length && !target.length) {
          scope.showPopover = false;
          angular.forEach(scope.popovers, function(popover) {
            popover.show = false;
          });
          return;
        }
        scope.showPopover = true;
        scope.$emit('e50Popover', target);
        scope.$apply();
      }

      elm.bind('mousedown', popoverHandler);

      if(isIframe) {
        parentDoc.bind('mousedown', popoverHandler);
      }

      var popoverLength = false;
      var popoverElms = {};
      function getPopovers() {
        var html = angular.element(elm);
        var popovers = html.find('[popover]');
        if(popovers.length === popoverLength) { return false; }
        popoverLength = popovers.length;
        popoverElms = {};
        scope.popovers = {};
        angular.forEach(popovers, function(popover, i) {
          var popoverElm = angular.element(popover);
          var id = popoverElm.attr('popover');
          if(id === 'false') { return; }
          while (popoverElms[id]) {
            id += i;
          }
          popoverElm.attr('popover', id);
          popoverElms[id] = popoverElm;
          scope.popovers[id] = {
            id: id,
            link: popoverElm.attr('href') || 'http://',
            show: false
          };
        });
      }

      scope.$watch('html', function(newV, oldV) {
        if(!newV && newV === oldV){ return; }
        getPopovers();
      });

      scope.$watch('popovers', function() {
        angular.forEach(scope.popovers, function(popover, id) {
          if(popoverElms[id]) {
            popoverElms[id].attr('href', popover.link);
          }
        });
        ngModel.$setViewValue(elm.html());
      }, true);


      // Unbind our drop events when the scope is destroyed
      scope.$on('$destroy', function() {
        elm.unbind("drop", dropHandler);
        parentDoc.unbind('mousedown', popoverHandler);
      });

      function linkHandler(e) {
        var target = angular.element(e.target);
        var isLink = e.target.tagName.toLowerCase() === 'a';
        if(!isLink) {
          target = target.closest('a');
        }
        if(isLink) {
          var id = target.attr('popover');
          if(id === 'false') { return; }
          if(!id) {
            id = "link:1";
            while(popoverElms[id]) {
              id += 1;
            }
            target.attr('popover', id);
            popoverElms[id] = target;
            ngModel.$setViewValue(elm.html());
            scope.$apply();
          }
        }
      }

      elm.bind('mousedown', linkHandler);

      // Watch events to add text
      scope.$on("e50AddText", function(event, id, text) {
        if(id !== scope.iframeId) { return false; }
        var sel = rangy.getIframeSelection(iframe[0]);
        var range = sel.getRangeAt(0);
        range.insertNode(document.createTextNode(text));
        ngModel.$setViewValue(elm.html());
      });

      scope.$on('updateViewValue', function() {
        ngModel.$setViewValue(elm.html());
      });

      scope.$on('updateViewValue');
    }
  };
});
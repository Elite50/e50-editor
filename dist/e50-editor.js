angular.module('E50Editor', []);
angular.module('E50Editor')
.directive('e50Bind', ["$timeout", "$document", "taSelection", function($timeout, $document, taSelection) {
  return {
    require: 'ngModel',
    link: function(scope, elm , attr, ngModel) {

      // Is this a contenteditable div?
      var isEditable = elm.attr('contenteditable');

      // Whenever the model changes, update the html
      ngModel.$render = function () {
        elm.html(ngModel.$viewValue);
      };

      // On keyup, update the model
      if (isEditable) {
        elm.bind('keyup', function () {
          ngModel.$setViewValue(elm.html());
          scope.$apply();
        });

        elm.bind('mouseup', function() {
          scope.$apply();
        });
      }

      // Watch for focus event
      elm.bind('focus', function() {
        elm.addClass('focused');
        $timeout(function() {
          scope.focused = true;
          scope.edit = true;
        });
      });

      // Toggle drag-over class
      elm.bind('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        elm.addClass('drag-over');
      });

      elm.bind('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        elm.removeClass('drag-over');
      });

      // Insert the image on drop, and update the viewValue
      var dropHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var target = angular.element(e.target);
        if(target.hasClass('placeholder')) {
          taSelection.setSelectionToElementStart(e.target);
          target.remove();
        }

        var dataTransfer = e.originalEvent.dataTransfer;

        angular.forEach(dataTransfer.files, function(file) {
          // New file reader to load the dropped file
          var reader = new FileReader();
          reader.onload = function(e) {
            $document[0].execCommand('insertImage', false, e.target.result);
            elm.removeClass('drag-over');
            ngModel.$setViewValue(elm.html());
            scope.$apply();
          };

          reader.readAsDataURL(file);
        });


        return false;
      };

      // Watch for drop event
      elm.bind('drop', dropHandler);

      // Unbind our drop events when the scope is destroyed
      scope.$on('$destroy', function() {
        elm.unbind("drop", dropHandler);
      });

    }
  };
}]);
angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-toolbars buttons="buttons"></div>',
    '<div class="template" e50-template ng-model="html" buttons="buttons" ng-show="!toggle"></div>',
    '<textarea ng-model="html" ng-show="toggle"></textarea>'
  ];

  return {
    restrict: 'EA',
    template: template.join(''),
    scope: {
      html: '=ngModel',
      buttons: "=?",
      toggle: "=?"
    }
  };
});
angular.module('E50Editor')
.directive('e50Template', ["taSelection", "$document", "$timeout", function(taSelection, $document, $timeout) {
  return {
    require: 'ngModel',
    scope: {
      html: "=ngModel",
      buttons: "="
    },
    link: function(scope, elm, attrs, ngModel) {

      scope.buttons = scope.buttons || {};

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
            buttons: e.attr("format").split(',')
          };
        });

        // Update the view value
        ngModel.$setViewValue(elm.html());
      }

      scope.$watch('html', function(newV, oldV) {
        if(!newV && newV === oldV) { return false; }
        getButtons();
      });

      // Document reference
      var doc = angular.element(document);

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

      // Apply mouse down handler
      doc.bind('mousedown', mouseDownHandler);

      // On mouse, scope apply the changes. We need this to update the active toolbar buttons
      doc.bind('mouseup', scope.$apply.bind(scope));

      // Unbind event watchers on the document when the scope is destroyed
      scope.$on('$destroy', function() {
        doc.unbind('mousedown', mouseDownHandler);
        doc.unbind('mouseup', scope.$apply.bind(scope));
      });

      // When the model changes, update the view
      ngModel.$render = function() {
        elm.html(ngModel.$viewValue);
      };

      // If there's no initial html, use the view's html
      if(!scope.html) {
        ngModel.$setViewValue(elm.html());
      }

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

        var target = angular.element(e.target);

        // Set the caret position to the start of the placeholder
        if(target.hasClass('placeholder')) {
          taSelection.setSelectionToElementStart(e.target);
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

          // Remove the placeholder, after we know it's an image
          if(target.hasClass('placeholder')) {
            target.remove();
          }

          // New file reader to load the dropped file
          var reader = new FileReader();

          // On load, insert the image, update the view value, and sync
          reader.onload = function(e) {
            $document[0].execCommand('insertImage', false, e.target.result);
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

      // Unbind our drop events when the scope is destroyed
      scope.$on('$destroy', function() {
        elm.unbind("drop", dropHandler);
      });
    }
  };
}]);
angular.module('E50Editor')
.directive('e50Toolbars', ["E50EditorButtons", "E50EditorIcons", function(E50EditorButtons, E50EditorIcons) {

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

}]);
angular.module('E50Editor')
.factory('E50DefaultToolbar', function() {
  // These are all keys that map to E50EditorButtons
  return [
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote'],
    ['insertOrderedList', 'insertUnorderedList'],
    ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight']
  ];
});
angular.module('E50Editor')
.factory('E50EditorButtons', ["E50ExecCommand", "taBrowserTag", "taSelection", function(E50ExecCommand, taBrowserTag, taSelection) {
  
  // alias
  var execCommand = E50ExecCommand;

  /**
   * Each command must implement the given interface 
   * { 
   *    name:string;
   *    execute():void;
   *    isActive():boolean;
   *  }
   */

  // This wraps the selection around the given tag
  function FormatCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return document.queryCommandValue('formatBlock').toLowerCase() === tag;
    };
    this.execute = function() {
      execCommand('formatBlock', false, '<'+taBrowserTag(tag)+'>');
    };
  }

  // This executes the given style command, ie 'bold' or 'italic'
  function StyleCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return document.queryCommandState(tag);
    };
    this.execute = function() {
      execCommand(tag);
    };
  }

  // This inserts an image at the given cursor position
  function ImageCommand() {
    this.name = "image";
    this.isActive = function() {
      var elm = taSelection.getSelectionElement();
      return elm.tagName === 'IMG';
    };
    this.execute = function() {
      var url = window.prompt('Image url', 'http://');
      $document[0].execCommand('insertImage', false, url);
    };
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var url = window.prompt('Link?', 'http://');
      execCommand('createLink', false, url);      
    };
    this.isActive = function() {
      var elm = taSelection.getSelectionElement();
      return $(elm).closest('a').length;      
    };
  }

  var formats = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote'];
  var styles  = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertOrderedList', 'insertUnorderedList'];
  var buttons = {};

  formats.forEach(function(format) {
    buttons[format] = new FormatCommand(format);
  });

  styles.forEach(function(style) {
    buttons[style] = new StyleCommand(style);
  });

  buttons['image']       = new ImageCommand();
  buttons['placeholder'] = new InsertCommand('placeholder', '<img src="placeholder.png" class="placeholder" alt="Placeholder"/>');
  buttons['link']        = new LinkCommand();

  // Expose the commands, so ppl can add there own later
  buttons.factory = function(command) {
    var commands = {
      FormatCommand : FormatCommand,
      StyleCommand  : StyleCommand,
      InsertCommand : InsertCommand,
      LinkCommand   : LinkCommand,
      ImageCommand  : ImageCommand
    };
    return commands[command] !== "undefined" ? commands[command] : false;
  };
  return buttons;
}]);
angular.module('E50Editor')
.factory('E50EditorIcons', function() {
  
  var icons = {
    'blockquote': 'fa-quote-right',
    'bold': 'fa-bold',
    'italic': 'fa-italic',
    'underline': 'fa-underline',
    'justifyLeft': 'fa-align-left',
    'justifyCenter': 'fa-align-center',
    'justifyRight': 'fa-align-right',
    'insertOrderedList': 'fa-list-ol',
    'insertUnorderedList': 'fa-list-ul',
    'placeholder': 'fa-image',
    'link': 'fa-link'
  };

  function icon(className) {
    return '<i class="fa ' + className + '" unselectable="on">';
  }

  return function(name) {
    return icons[name] ? icon(icons[name]) : false;
  };
});
angular.module('E50Editor')
.factory('E50ExecCommand', ["taExecCommand", function(taExecCommand) {
  return taExecCommand('p');
}]);
angular.module('E50Editor')
.factory('E50SelectionXY', function() {
  return function () {
    var sel = document.selection, range, rects, rect;
    var x = 0, y = 0;
    if (sel) {
      if (sel.type != "Control") {
        range = sel.createRange();
        range.collapse(true);
        x = range.boundingLeft;
        y = range.boundingTop;
      }
    } else if (window.getSelection) {
      sel = window.getSelection();
      if (sel.rangeCount) {
        range = sel.getRangeAt(0).cloneRange();
        if (range.getClientRects) {
          range.collapse(true);
          rects = range.getClientRects();
          if (rects.length > 0) {
            rect = range.getClientRects()[0];
          }
          x = rect.left;
          y = rect.top;
        }
        // Fall back to inserting a temporary element
        if (x == 0 && y == 0) {
          var span = document.createElement("span");
          if (span.getClientRects) {
            // Ensure span has dimensions and position by
            // adding a zero-width space character
            span.appendChild( document.createTextNode("\u200b") );
            range.insertNode(span);
            rect = span.getClientRects()[0];
            x = rect.left;
            y = rect.top;
            var spanParent = span.parentNode;
            spanParent.removeChild(span);

            // Glue any broken text nodes back together
            spanParent.normalize();
          }
        }
      }
    }
    return { x: x, y: y };
  }
});
angular.module('e50Editor.tpls', ['views/e50-editor.tpl.html']);

angular.module("views/e50-editor.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("views/e50-editor.tpl.html",
    "<div class=\"e50-editor\">\n" +
    "  \n" +
    "  <a href=\"\" ng-click=\"edit=!edit\" class=\"toggle\">\n" +
    "    <i class=\"fa fa-edit\"></i>\n" +
    "  </a>\n" +
    "  \n" +
    "  <div class=\"format-buttons\" ng-show=\"edit\">\n" +
    "    <div ng-repeat=\"group in toolbars\">\n" +
    "      <button type=\"button\" unselectable=\"on\" ng-repeat=\"button in group\" ng-bind-html=\"name(button)\" ng-click=\"execute(button)\" ng-disabled=\"isDisabled()\" tabindex=\"-1\" ng-class=\"{active:isActive(button)}\"></button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"live-editor\" contenteditable=\"true\" e50-bind ng-model=\"html\" ng-transclude=\"\"></div>\n" +
    "\n" +
    "</div>");
}]);

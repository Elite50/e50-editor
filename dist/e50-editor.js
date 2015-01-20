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
.directive('e50Editor', ["E50EditorButtons", "E50DefaultToolbar", "E50EditorIcons", function(E50EditorButtons, E50DefaultToolbar, E50EditorIcons) {

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

  return {
    'h1'           : new FormatCommand('h1'),
    'h2'           : new FormatCommand('h2'),
    'h3'           : new FormatCommand('h3'),
    'h4'           : new FormatCommand('h4'),
    'h5'           : new FormatCommand('h5'),
    'h6'           : new FormatCommand('h6'),
    'p'            : new FormatCommand('p'),
    'pre'          : new FormatCommand('pre'),
    'blockquote'   : new FormatCommand('blockquote'),
    'bold'         : new StyleCommand('bold'),
    'italic'       : new StyleCommand('italic'),
    'underline'    : new StyleCommand('underline'),
    'justifyLeft'  : new StyleCommand('justifyLeft'),
    'justifyCenter': new StyleCommand('justifyCenter'),
    'justifyRight' : new StyleCommand('justifyRight'),
    'link'         : new LinkCommand(),
    'image'        : new ImageCommand(),
    'placeholder'  : new InsertCommand('placeholder', '<img src="placeholder.png" class="placeholder" alt="Placeholder"/>'),
    'insertOrderedList'   : new StyleCommand('insertOrderedList'),
    'insertUnorderedList' : new StyleCommand('insertUnorderedList')
  };  
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
    'placeholder': 'fa-image'
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
    "  <div class=\"live-editor\" contenteditable=\"true\" e50-bind ng-model=\"html\"></div>\n" +
    "\n" +
    "</div>");
}]);

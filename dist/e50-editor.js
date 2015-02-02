angular.module('E50Editor', ['textAngular', 'ngSanitize']);
angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-popover class="e50-popover"></div>',
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
      override: "=?"
    }
  };
});
angular.module('E50Editor')
  .directive('e50Iframe', ["$compile", "E50Documents", "E50EditorConfig", function($compile, E50Documents, E50EditorConfig) {
    return {
      scope: {
        html: '=ngModel',
        toggle: "=?",
        buttons: "=?",
        override: "=?",
        iframeId: "@e50Iframe"
      },
      link: function(scope, elm) {

        scope.template = scope.template || 'iframe-template.tpl.html';

        // Allow the ability to pass in a template url
        var iframe = angular.element(document.createElement('iframe'));

        // Remove all traces of the iframe
        scope.$on('$destroy', function() {
          iframe.remove();
          delete E50Documents.docs[scope.id];
          scope.$emit('e50Document', scope.id, false);
        });

        // Attach the iframe
        elm.html(iframe);

        // Get the newly appended iframe
        iframe = elm.find('iframe');

        var contents = iframe.contents();
        contents.find('head').append("<style>.ng-hide{display:none !important;}body{margin:0;padding:0;}*:focus{outline:none;}");
        contents.find('head').append('<link href="'+E50EditorConfig.fontAwesome+'" rel="stylesheet"/>');

        var body = contents.find('body');
        body.css({margin: 0, padding: 0});

        // Set the iframe for later, so we can use it in our other editor directives
        E50Documents.set(scope.iframeId, iframe);

        // Emit the iframe id and document, in case we want to build our buttons outside of the iframe
        scope.$emit('e50Document', scope.iframeId, true, iframe);

        scope.popoverElm = {};

        // Compile and append the e50-editor directive
        var directive = '<div e50-editor ng-model="html" toggle="toggle" buttons="buttons" iframe-id="iframeId" override="override" popover-elm="popoverElm">initial editable content</div>';
        var directiveElm = $compile(directive)(scope);
        body.append(directiveElm);

        // This will resize the iframe's height to it's html height.
        var html = angular.element(scope.html);
        var images = html.find('img');
        iframe.height(500);
        images.on('load', function() {
          //iframe.height(iframe.contents().find('html').height());
        });
      }
    };
  }]);
angular.module('E50Editor')
  .directive('e50Popover', ["$timeout", function($timeout) {

    var template = [
      '<div class="link-manager" ng-repeat="popover in popovers" ng-show="popover.show">',
      '<input type="text" ng-model="popover.link" />',
      '<a href="" target="_blank" ng-attr-href="{{popover.link}}">Open</a>',
      '</div>'
    ];

    return {
      template: template.join(''),
      link: function(scope, elm) {
        scope.$on('e50Popover', function(ev, popoverElm) {
          var id = popoverElm.attr('popover');
          angular.forEach(scope.popovers, function(popover, key) {
            popover.show = (key === id);
          });
          $timeout(function() {
            var offset = popoverElm.offset();
            offset.top = offset.top - elm.height() - 5;
            var extraWidth = 0;
            extraWidth += parseInt(popoverElm.css('padding-right'));
            extraWidth += parseInt(popoverElm.css('margin-right'));
            offset.left = Math.ceil(offset.left) + popoverElm.width() - elm.width() + extraWidth;
            elm.css(offset);
          });
        });
      }
    };

  }]);
angular.module('E50Editor')
.directive('e50Template', ["taSelection", "E50Documents", "$timeout", function(taSelection, E50Documents, $timeout) {
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

        var target = angular.element(e.target);
        var editable = target.closest('[editable]');

        if(!editable.length) {
          return false;
        }

        // Set the caret position to the start of the placeholder
        if(target.hasClass('placeholder')) {
          var iframeDoc = isIframe ? doc : parentDoc;
          var sel = taSelection(iframeDoc);
          sel.setSelectionToElementStart(e.target);
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
        if(!popover.length && !target.attr('popover')) {
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
        var isLink = e.target.tagName.toLowerCase() === 'a' || target.closest('a').length;
        if(isLink) {
          var id = target.attr('popover');
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
    }
  };
}]);
angular.module('E50Editor')
.directive('e50Toolbars', ["E50EditorButtons", "E50EditorIcons", "$document", "E50Documents", function(E50EditorButtons, E50EditorIcons, $document, E50Documents) {

  var template = [
    '<div class="toolbars" ng-if="!override">',
      '<div class="group" ng-repeat="(key,editable) in buttons" ng-show="editable.focused">',
        '<button type="button" unselectable="on" ng-repeat="btn in editable.buttons" class="format-button" ng-click="execute(btn)" ng-bind-html="name(btn)" ng-class="{active:isActive(btn)}"></button>',
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
        _command.setDocument(doc || $document[0]);
        return _command;
      }

      // Get the name of the button, if there's no icon for it
      scope.name = function(tag) {
        var icon = E50EditorIcons(tag);
        return icon ? icon : E50EditorButtons[tag].name;
      };

      // Is the current button active
      scope.isActive = function(tag) {
        try {
          return command(tag).isActive();
        } catch(e) {}
      };

      // Execute the button
      scope.execute = function(tag) {
        return command(tag).execute();
      };
    }
  };

}]);
angular.module('E50Editor')
  .factory('E50Documents', function() {
    return {
      docs: {},
      get: function(id) {
        if(this.docs[id] !== "undefined") {
          return this.docs[id];
        }
        return false;
      },
      set: function(id, doc) {
        this.docs[id] = doc;
      }
    };
  });
angular.module('E50Editor')
.factory('E50EditorButtons', ["taBrowserTag", "taSelection", "taExecCommand", "E50Documents", function(taBrowserTag, taSelection, taExecCommand, E50Documents) {

  /**
   * Each command must implement the given interface 
   * { 
   *    name:string;
   *    execute():void;
   *    isActive():boolean;
   *    setDocument(document):void;
   *  }
   */

  function setDocument(doc) {
    this.document = doc;
  }

  // This wraps the selection around the given tag
  function FormatCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return this.document.queryCommandValue('formatBlock').toLowerCase() === tag;
    };
    this.execute = function() {
      var newTag = this.isActive() ? 'P' : tag;
      this.document.execCommand('formatBlock', false, '<'+taBrowserTag(newTag)+'>');
    };
    this.setDocument = setDocument;
  }

  // This executes the given style command, ie 'bold' or 'italic'
  function StyleCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return this.document.queryCommandState(tag);
    };
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      execCommand(tag);
    };
    this.setDocument = setDocument;
  }

  // This inserts an image at the given cursor position
  function ImageCommand() {
    this.name = "image";
    this.isActive = function() {
      if(!this.document) { return false; }
      var selection = taSelection(this.document);
      var elm = selection.getSelectionElement();
      return elm.tagName === 'IMG';
    };
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      var url = window.prompt('Image url', 'http://');
      execCommand('insertImage', false, url);
    };
    this.setDocument = setDocument;
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
    this.setDocument = setDocument;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      var url = "http://";
      execCommand('createLink', false, url);
    };
    this.isActive = function() {
      if(!this.document) { return false; }
      var selection = taSelection(this.document);
      var elm = selection.getSelectionElement();
      return $(elm).closest('a').length;      
    };
    this.setDocument = setDocument;
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
  .factory('E50EditorConfig', function() {
    return {
      fontAwesome: '../bower_components/font-awesome/css/font-awesome.css'
    };
  });
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

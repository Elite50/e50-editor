angular.module('E50Editor', ['ngSanitize']);
angular.module('E50Editor')
  .directive('e50Button', ["$timeout", "E50EditorConfig", function($timeout, E50EditorConfig) {

    var template = [
      '<div class="link-manager" ng-repeat="btn in csButtons" ng-show="btn.show && !toggle">',
      '<form ng-submit="setBtnLink(btn)"><input type="text" ng-model="btn.link" /></form>',
      '<a href="" target="_blank" ng-attr-href="{{btn.link}}">Open</a>',
      '</div>'
    ];

    return {
      template: template.join(''),
      link: function(scope, elm) {

        elm.css({
          opacity: 0,
          position:'absolute'
        });

        scope.csButtons = {};
        var btnElms = {};
        function getButtons() {
          var btns = elm.parent().find('[e50-template]').find('['+E50EditorConfig.attrs.button+']');
          angular.forEach(btns, function(btn, i) {
            btn = angular.element(btn);
            btnElms[i] = btn;
            btn.attr(E50EditorConfig.attrs.button, i);
            scope.csButtons[i] = {
              id: i,
              show: false,
              link: btn.attr('href') || 'http://'
            };
          });
          btns.unbind('mouseup', clickBtnHandler);
          btns.bind('mouseup', clickBtnHandler);
          scope.$emit('updateViewValue');
        }

        function clickBtnHandler(e) {
          var target = angular.element(e.target);
          var isBtn = target.attr(E50EditorConfig.attrs.button) !== undefined;
          if(!isBtn) {
            target = target.closest('['+E50EditorConfig.attrs.button+']');
          }
          var id = parseInt(target.attr(E50EditorConfig.attrs.button),10);

          angular.forEach(scope.csButtons, function(btn) {
            btn.show = btn.id === id;
          });

          elm.css({
            opacity: 0,
            position: 'absolute',
            minWidth: '194px',
            minHeight: '24px'
          });

          $timeout(function() {

            var offset = target.offset();
            offset.top = Math.ceil(offset.top) - elm.height() - 10;

            var extraWidth = 0;
            extraWidth += parseInt(target.css('padding-right'));
            extraWidth += parseInt(target.css('margin-right'));

            offset.left = Math.ceil(offset.left) + target.width() - elm.width() + extraWidth;
            elm.css(offset);

            elm.animate({
              top: offset.top + 5,
              opacity: 1
            }, 200);
          });

          scope.$apply();
        }

        getButtons();

        scope.$watch('html', function() {
          getButtons();
        });

        // Close btn managers if we clicked away
        elm.parent().bind('mousedown', function(e) {
          var btnManager = angular.element(e.target).closest('.link-manager');
          if(!btnManager.length) {
            angular.forEach(scope.csButtons, function(btn) {
              btn.show = false;
            });
          }
        });

        // Set the href
        scope.setBtnLink = function(link) {
          btnElms[link.id].attr('href', link.link);
          scope.$emit('updateViewValue');
        };

      }
    };
  }]);
angular.module('E50Editor')
.directive('e50Editor', function() {

  var template = [
    '<div e50-image class="e50-image"></div>',
    '<div e50-link class="e50-link"></div>',
    '<div e50-button class="e50-buttons"></div>',
    '<div e50-toolbars buttons="buttons" iframe-id="iframeId" override="override"></div>',
    '<div class="template" e50-template ng-model="html" ng-show="!toggle"></div>',
    '<ng-include src="footerTpl" ng-hide="toggle"></ng-include>',
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
      aviaryOptions: "=?",
      footerTpl:'='
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
        iframeId: "@e50Iframe",
        imageSaved: "=?",
        aviaryOptions: "=?",
        footerTpl: '='
      },
      link: function(scope, elm) {

        scope.template = scope.template || 'iframe-template.tpl.html';

        scope.toggle = scope.toggle || false

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

        // Compile and append the e50-editor directive
        var directive = [
          '<div e50-editor',
            'ng-model="html"',
            'toggle="toggle"',
            'buttons="buttons"',
            'iframe-id="iframeId"',
            'override="override"',
            'image-saved="imageSaved"',
            'aviary-options="aviaryOptions"',
            'footer-tpl="footerTpl">',
          'initial editable content</div>'
        ].join(' ');

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
  .directive('e50Image', ["$timeout", "E50EditorConfig", function($timeout, E50EditorConfig) {
    var template = [
      '<div class="popovers">',
        '<div ng-repeat="img in imagePopovers" ng-show="img.show" ng-attr-class="img-popover-{{img.id}} image-edit"  ng-mouseenter="img.show=true">',
          '<a href="" ng-click="toggleInput(img)" class="edit"><i class="fa  fa-ellipsis-v"></i></a>',
          '<a href="" class="trash"><i class="fa fa-trash-o" ng-click="trash(img)"></i></a>',
          '<form ng-submit="setImageUrl(img)">',
            '<input type="text" ng-model="img.src" placeholder="Enter url & hit enter or" ng-if="img.showInput"/>',
            '<a href="" ng-click="openAviary(img)" class="edit-photo" ng-if="img.showInput">Edit</a>',
          '</form>',
          '<form ng-show="img.showInput">',
            '<input type="file" ng-attr-id="file-upload-{{img.id}}"/>',
          '</form>',
        '</div>',
      '</div>'
    ];
    return {
      template: template.join(''),
      link: function(scope, elm) {

        scope.aviaryOptions = scope.aviaryOptions || 'all';

        //elm.css({ position:'absolute', opacity: 0 });
        elm.css({ position:'absolute' });
        // Images
        var images = {};
        scope.imagePopovers = {};

        function imageHover(e) {
          var target = angular.element(e.target);
          var id = parseInt(target.attr(E50EditorConfig.attrs.placeholder), 10);

          angular.forEach(scope.imagePopovers, function(img, i) {
            img.show = (id == i);
          });

          var css = target.offset();
          var popoverElm = elm.find('.img-popover-' + id);
          $timeout(function() {
            css.top = css.top + 5;
            css.left = css.left + target.width() - popoverElm.width() - 5;
            elm.css(css);
            elm.animate({opacity: 1}, 200);
          });
          scope.$apply();
        }

        function hideImagePopovers(e) {
          var related = angular.element(e.toElement || e.relatedTarget);
          var isEditArea = related.hasClass('e50-image') || related.closest('.e50-image').length;
          if(isEditArea) { return true; }
          angular.forEach(scope.imagePopovers, function(img) {
            img.show = false;
            //img.showInput = false;
          });
          scope.$apply();
        }

        function handleDragOver(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        var aviaryEditor = new Aviary.Feather({
          apiKey: E50EditorConfig.aviaryKey,
          tools: scope.aviaryOptions,
          onError: function() {
            console.log(arguments);
          }
        });

        function dropHandler(e) {
          e.preventDefault();
          e.stopPropagation();

          var img = angular.element(e.target);

          var file = e.originalEvent.dataTransfer.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var aviaryImg = new Image();
            aviaryImg.src = e.target.result;
            aviaryEditor.launch({
              image: aviaryImg,
              onSave: function(id, url) {
                scope.imageSaved(url, img);
                img.attr('src', url);
                scope.$emit('updateViewValue');
              }
            });
          };
          reader.readAsDataURL(file);

          return false;
        }

        scope.openAviary = function(img) {
          if(scope.isPlaceholder(img)) {
            alert("Please upload an image to edit");
            return;
          }
          var imageElm = angular.element(images[img.id]);
          var src = imageElm.attr('src');
          var isPlaceholder = src.indexOf(E50EditorConfig.placeholder) !== -1;
          if(isPlaceholder) { return false; }

          var aviaryImg = new Image();
          aviaryImg.src = src;

          aviaryEditor.launch({
            image: aviaryImg,
            onSave: function(id, url) {
              scope.imageSaved(url, imageElm);
              imageElm.attr('src', url);
              scope.$emit('updateViewValue');
            }
          });
        };

        scope.isPlaceholder = function(img) {
          var elm = angular.element(images[img.id]);
          var src = elm.attr('src');
          return src.indexOf(E50EditorConfig.placeholder) !== -1;
        };

        scope.trash = function(img) {
          var elm = angular.element(images[img.id]);
          if(!scope.isPlaceholder(img)) {
            var confirm = window.confirm("Are you sure you want to delete this image?");
            if(!confirm) { return false; }
            elm.attr('src', E50EditorConfig.placeholder);
          } else {
            elm.remove();
          }
          img.show = false;
          scope.$emit('updateViewValue');
        };

        function getImages() {
          var placeholders = elm.parent().find('['+E50EditorConfig.attrs.placeholder+']');
          angular.forEach(placeholders, function(image, i) {
            images[i] = image;
            var imgElm = angular.element(image);
            imgElm.attr(E50EditorConfig.attrs.placeholder, i);
            var src = imgElm.attr('src');
            var isPlaceholder = true;
            if(!src) {
              imgElm.attr('src', E50EditorConfig.placeholder);
              isPlaceholder = true;
            } else {
              isPlaceholder = src.indexOf(E50EditorConfig.placeholder) !== -1;
            }
            scope.imagePopovers[i] = {
              id: i,
              show: false,
              src: isPlaceholder ? "" : imgElm.attr('src')
            };
          });

          // Unbind previous mouseover events
          placeholders.unbind('mouseover', imageHover);
          placeholders.unbind('mouseleave', hideImagePopovers);

          // Setup image hover
          placeholders.bind('mouseover', imageHover);
          placeholders.bind('mouseleave', hideImagePopovers);

          placeholders.unbind('dragover',handleDragOver);
          placeholders.bind('dragover',handleDragOver);

          placeholders.unbind('drop', dropHandler);
          placeholders.bind('drop', dropHandler);

          scope.$emit('updateViewValue');
        }

        scope.$watch('html', function(newV, oldV) {
          if(!newV && newV === oldV) { return; }
          getImages();
        });

        scope.toggleInput = function(img) {
          var imageElm = angular.element(images[img.id]);
          img.showInput = !img.showInput;
          if(img.showInput) {
            $timeout(function() {
              imageElm.focus();
              if(imageElm[0].setSelectionRange) {
                imageElm[0].setSelectionRange(0,0);
              } else {
                imageElm.val(imageElm.val());
              }
            });
          }
        };

        scope.setImageUrl = function(img) {
          var imageElm = angular.element(images[img.id]);
          var src = img.src !== "" ? img.src : E50EditorConfig.placeholder;
          imageElm.attr('src', src);
          img.showInput = false;
        };

        function fileChangeHandler(e) {
          var input = angular.element(e.target);
          var imgId = input.attr('id').split('-').pop();
          var img = angular.element(images[imgId]);
          var aviaryImg = new Image();
          var file = e.target.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            aviaryImg.src = e.target.result;
            aviaryEditor.launch({
              image: aviaryImg,
              onSave: function(id, url) {
                scope.imageSaved(url, img);
                input.val("");
                scope.$emit('updateViewValue');
              },
              onClose: function() {
                input.val("");
              }
            });
          };
          reader.readAsDataURL(file);
        }

        scope.$watch('imagePopovers', function(newV) {
          if(!newV) { return; }
          var inputs = elm.find('input');
          angular.forEach(inputs, function(input) {
            var inputElm = angular.element(input);
            inputElm.unbind('change', fileChangeHandler);
            inputElm.bind('change', fileChangeHandler);
          })
        }, true);
      }
    };
  }]);
angular.module('E50Editor')
  .directive('e50Link', ["$timeout", "E50EditorConfig", "E50Documents", function($timeout, E50EditorConfig, E50Documents) {

    var template = [
      '<div class="link-manager" ng-repeat="link in links" ng-show="link.show && !toggle">',
        '<form ng-submit="setLink(link)"><input type="text" ng-model="link.link" /></form>',
        '<a href="" target="_blank" ng-attr-href="{{link.link}}">Open</a>',
        '<a href="" target="_blank" ng-click="unlink(link)"><i class="fa fa-unlink"></i></a>',
      '</div>'
    ];

    return {
      template: template.join(''),
      link: function(scope, elm) {

        var iframe = E50Documents.get(scope.iframeId);

        elm.css({
          opacity: 0,
          position:'absolute'
        });

        scope.links = {};
        var linkElms = {};
        function getLinks() {
          var links = elm.parent().find('[e50-template]').find('a');
          angular.forEach(links, function(link, i) {
            link = angular.element(link);
            if(link.attr(E50EditorConfig.attrs.editable)) { return false; }
            linkElms[i] = link;
            link.attr(E50EditorConfig.attrs.link, i);
            scope.links[i] = {
              id: i,
              show: false,
              link: link.attr('href') || 'http://'
            };
            link.unbind('mouseup', clickLinkHandler);
            link.bind('mouseup', clickLinkHandler);
          });
          scope.$emit('updateViewValue');
        }

        function clickLinkHandler(e) {
          var target = angular.element(e.target);
          var isLink = e.target.tagName.toLowerCase() === 'a';
          if(!isLink) {
            target = target.closest('a');
          }
          var id = parseInt(target.attr(E50EditorConfig.attrs.link),10);

          angular.forEach(scope.links, function(link) {
            link.show = link.id === id;
          });

          elm.css({
            opacity: 0,
            position:'absolute'
          });

          $timeout(function() {

            var offset = target.offset();
            offset.top = Math.ceil(offset.top) - elm.height() - 10;

            var extraWidth = 0;
            extraWidth += parseInt(target.css('padding-right'));
            extraWidth += parseInt(target.css('margin-right'));

            offset.left = Math.ceil(offset.left) + target.width() - elm.width() + extraWidth;
            elm.css(offset);

            elm.animate({
              top: offset.top + 5,
              opacity: 1
            }, 200);
          });
        }

        getLinks();

        scope.$watch('html', function() {
          getLinks();
        });

        // Close link managers if we clicked away
        elm.parent().bind('mousedown', function(e) {
          var linkManager = angular.element(e.target).closest('.link-manager');
          if(!linkManager.length) {
            angular.forEach(scope.links, function(link) {
              link.show = false;
              linkElms[link.id].attr('href', link.link);
            });
          }
        });

        // Set the href
        scope.setLink = function(link) {
          linkElms[link.id].attr('href', link.link);
          scope.$emit('updateViewValue');
        };

        // Unlink a link
        scope.unlink = function(link) {
          var linkElement = linkElms[link.id];
          $timeout(function() {
            var range = rangy.createRange();
            range.selectNodeContents(linkElement[0]);
            var sel = rangy.getIframeSelection(iframe[0]);
            sel.setSingleRange(range);
            link.show = false;
            var doc = iframe[0].document || iframe[0].contentWindow.document;
            doc.execCommand('unlink');
          });
        };

        scope.$on('linkCreated', function() {
          getLinks();
        });
      }
    };
  }]);
angular.module('E50Editor')
.directive('e50Template', ["E50Documents", "E50EditorConfig", "$sanitize", function(E50Documents, E50EditorConfig, $sanitize) {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ngModel) {

      scope.buttons = scope.buttons || {};

      // If there's no initial html, use the view's html
      if(!scope.html) {
        ngModel.$setViewValue(elm.html());
      }

      function setupEditableAreas() {
        var editables = elm.find('['+E50EditorConfig.attrs.editable+']');
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
      scope.execute = function(tag) {
        return command(tag).execute();
      };
    }
  };

}]);
angular.module('E50Editor')
  .factory('E50BrowswerTag', function() {
    var _browserDetect = {
      ie: (function(){
        var undef,
          v = 3,
          div = document.createElement('div'),
          all = div.getElementsByTagName('i');

        while (
          div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
            all[0]
          );

        return v > 4 ? v : undef;
      }()),
      webkit: /AppleWebKit\/([\d.]+)/i.test(navigator.userAgent)
    };
    return function(tag){
      if(!tag) return (_browserDetect.ie <= 8)? 'P' : 'p';
      else if(tag === '') return (_browserDetect.ie === undefined)? 'div' : (_browserDetect.ie <= 8)? 'P' : 'p';
      else return (_browserDetect.ie <= 8)? tag.toUpperCase() : tag;
    };
  });
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
.factory('E50EditorButtons', ["E50BrowswerTag", "E50Documents", "E50EditorConfig", "$rootScope", function(E50BrowswerTag, E50Documents, E50EditorConfig, $rootScope) {

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
      this.document.execCommand('formatBlock', false, '<'+E50BrowswerTag(newTag)+'>');
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
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand(tag);
    };
    this.setDocument = setDocument;
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
    this.setDocument = setDocument;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var url = window.prompt('Link URL:', 'http://');
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand('createLink', false, url);
      $rootScope.$broadcast('linkCreated');
    };
    this.isActive = function() {
      return false;
    };
    this.setDocument = setDocument;
  }

  var formats = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote'];
  var styles  = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertOrderedList', 'insertUnorderedList', 'unlink'];
  var buttons = {};

  formats.forEach(function(format) {
    buttons[format] = new FormatCommand(format);
  });

  styles.forEach(function(style) {
    buttons[style] = new StyleCommand(style);
  });

  buttons['placeholder'] = new InsertCommand('placeholder', '<img src="'+E50EditorConfig.placeholder+'" class="placeholder" alt="Placeholder"/>');
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
      fontAwesome: '../bower_components/font-awesome/css/font-awesome.css',
      placeholder: 'images/placeholder.png',
      aviaryKey: null,
      attrs: {
        editable: 'cs-editable',
        format: 'cs-format',
        popover: 'cs-popover',
        placeholder: 'cs-placeholder',
        link: 'cs-link',
        button: 'cs-button'
      }
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

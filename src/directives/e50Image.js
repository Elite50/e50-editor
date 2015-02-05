angular.module('E50Editor')
  .directive('e50Image', function($timeout, E50EditorConfig) {
    var template = [
      '<div class="image-popovers">',
        '<div ng-repeat="img in imagePopovers" ng-show="img.show" ng-attr-class="img-popover-{{img.id}}" ng-mouseenter="img.show=true">',
          '<a href="" ng-click="toggleInput(img)"><i class="fa  fa-ellipsis-v"></i></a>',
          '<form ng-submit="setImageUrl(img)">',
            '<input type="text" ng-model="img.src" placeholder="Enter url & hit enter" ng-show="img.showInput"/>',
          '</form>',
        '</div>',
      '</div>'
    ];
    return {
      template: template.join(''),
      link: function(scope, elm) {
        elm.css({ position:'absolute', opacity: 0 });
        // Images
        var images = {};
        scope.imagePopovers = {};

        function imageHover(e) {
          var target = angular.element(e.target);
          var id = parseInt(target.attr('image-id'), 10);

          angular.forEach(scope.imagePopovers, function(img, i) {
            img.show = (id == i);
          });

          var css = target.offset();
          var popoverElm = elm.find('.img-popover-' + id);
          $timeout(function() {
            css.top = css.top + 5;
            css.left = css.left + target.width() - popoverElm.width() - 10;
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
            img.showInput = false;
          });
          scope.$apply();
        }

        function getImages() {
          var placeholders = elm.parent().find('.placeholder');
          angular.forEach(placeholders, function(image, i) {
            images[i] = image;
            var imgElm = angular.element(image);
            imgElm.attr('image-id', i);
            var src = imgElm.attr('src');
            var isPlaceholder = src.indexOf(E50EditorConfig.placeholder) !== -1;
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
              console.log('should be in focus');
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
      }
    };
  });
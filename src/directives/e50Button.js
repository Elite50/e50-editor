angular.module('E50Editor')
  .directive('e50Button', function($timeout, E50EditorConfig) {

    var template = [
      '<div class="link-manager" ng-repeat="btn in buttons" ng-show="btn.show && !toggle">',
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

        scope.buttons = {};
        var btnElms = {};
        function getButtons() {
          var btns = elm.parent().find('[e50-template]').find('['+E50EditorConfig.attrs.button+']');
          angular.forEach(btns, function(btn, i) {
            btn = angular.element(btn);
            btnElms[i] = btn;
            btn.attr(E50EditorConfig.attrs.button, i);
            scope.buttons[i] = {
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

          angular.forEach(scope.buttons, function(btn) {
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
            angular.forEach(scope.buttons, function(btn) {
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
  });
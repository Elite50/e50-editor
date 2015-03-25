angular.module('E50Editor')
  .directive('e50Link', function($timeout, E50EditorConfig, E50Documents) {

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
            if(offset.left < 0) {
              offset.left = 5;
            }
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
  });
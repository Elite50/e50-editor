angular.module('E50Editor')
  .directive('e50Iframe', function($compile) {
    return {
      scope: {
        html: '=ngModel',
        toggle: "=?",
        buttons: "=?",
        template: "=?"
      },
      link: function(scope, elm) {
        scope.template = scope.template || 'iframe-template.tpl.html';

        // Allow the ability to pass in a template url
        var iframeElm = angular.element('<iframe src="{{template}}"/>');
        var iframe = $compile(iframeElm)(scope);

        // Attach the iframe
        elm.html(iframe);

        // The iframe is using the src tag, so we need to wait until it loads
        iframe[0].onload = function() {
          var body = iframe.contents().find('body');

          // Grab the iframe's document, so we can use execCommand and other contenteditable commands
          scope.document = iframe[0].contentDocument || iframe[0].contentWindow.document;

          // Compile and append the e50-editor directive
          var directive = '<div e50-editor ng-model="html" toggle="toggle" buttons="buttons" document="document">initial editable content</div>';
          var directiveElm = $compile(directive)(scope);
          body.append(directiveElm);

          // This will resize the iframe's height to it's html height.
          var html = angular.element(scope.html);
          var images = html.find('img');
          images.on('load', function() {
            iframe.height(iframe.contents().find('html').height());
          });
        }
      }
    };
  });
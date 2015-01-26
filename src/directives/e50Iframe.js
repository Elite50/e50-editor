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
        var iframeElm = angular.element('<iframe src="{{template}}"/>');
        var iframe = $compile(iframeElm)(scope);

        elm.html(iframe);

        iframe[0].onload = function() {
          var body = iframe.contents().find('body');
          var directive = '<div e50-editor ng-model="html" toggle="toggle" buttons="buttons" document="document">initial editable content</div>';

          scope.document = iframe[0].contentDocument || iframe[0].contentWindow.document;

          var directiveElm = $compile(directive)(scope);
          body.append(directiveElm);
        }
      }
    };
  });
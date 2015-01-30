angular.module('E50Editor')
  .directive('e50Iframe', function($compile, E50Documents) {
    return {
      scope: {
        html: '=ngModel',
        toggle: "=?",
        buttons: "=?",
        override: "=?",
        id: "@e50Iframe"
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

        var body = contents.find('body');
        body.css({margin: 0, padding: 0});

        // Set the iframe for later, so we can use it in our other editor directives
        E50Documents.set(scope.id, iframe);

        // Emit the iframe id and document, in case we want to build our buttons outside of the iframe
        scope.$emit('e50Document', scope.id, true, iframe);

        // Compile and append the e50-editor directive
        var directive = '<div e50-editor ng-model="html" toggle="toggle" buttons="buttons" document="id" override="override">initial editable content</div>';
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
  });
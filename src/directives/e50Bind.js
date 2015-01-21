angular.module('E50Editor')
.directive('e50Bind', function($timeout, $document, taSelection) {
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
});
angular.module('E50Editor')
  .factory('E50EditorConfig', function() {
    return {
      fontAwesome: '../bower_components/font-awesome/css/font-awesome.css',
      placeholder: 'images/placeholder.png',
      aviaryKey: aviaryKey || '',
      attrs: {
        editable: 'cs-editable',
        format: 'cs-format',
        popover: 'cs-popover',
        placeholder: 'cs-placeholder'
      }
    };
  });
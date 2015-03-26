angular.module('E50Editor')
  .factory('E50EditorConfig', function() {
    return {
      fontAwesome: '../bower_components/font-awesome/css/font-awesome.css',
      placeholder: 'http://placehold.it/WIDTHxHEIGHT/f7f7f7/ccc',
      defaultWidth: 418,
      defaultHeight: 178,
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
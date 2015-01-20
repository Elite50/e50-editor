angular.module('E50Editor')
.factory('E50DefaultToolbar', function() {
  // These are all keys that map to E50EditorButtons
  return [
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'blockquote'],
    ['insertOrderedList', 'insertUnorderedList'],
    ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight']
  ];
});
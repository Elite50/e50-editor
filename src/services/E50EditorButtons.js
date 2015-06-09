angular.module('E50Editor')
.factory('E50EditorButtons', function(E50BrowswerTag, E50Documents, E50EditorConfig, $rootScope) {

  /**
   * Each command must implement the given interface 
   * { 
   *    name:string;
   *    execute():void;
   *    isActive():boolean;
   *    setDocument(document):void;
   *  }
   */

  function setDocument(doc) {
    this.document = doc;
  }

  // This wraps the selection around the given tag
  function FormatCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return this.document.queryCommandValue('formatBlock').toLowerCase() === tag;
    };
    this.execute = function() {
      var newTag = this.isActive() ? 'P' : tag;
      this.document.execCommand('formatBlock', false, '<'+E50BrowswerTag(newTag)+'>');
    };
    this.setDocument = setDocument;
  }

  // This executes the given style command, ie 'bold' or 'italic'
  function StyleCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return this.document.queryCommandState(tag);
    };
    this.execute = function() {
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand(tag, false, null);
    };
    this.setDocument = setDocument;
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
    this.setDocument = setDocument;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var url = window.prompt('Link URL:', 'http://');
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document || document;
      doc.execCommand('createLink', false, url);
      $rootScope.$broadcast('linkCreated');
    };
    this.isActive = function() {
      return false;
    };
    this.setDocument = setDocument;
  }

  var formats = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote'];
  var styles  = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertOrderedList', 'insertUnorderedList', 'unlink'];
  var buttons = {};

  formats.forEach(function(format) {
    buttons[format] = new FormatCommand(format);
  });

  styles.forEach(function(style) {
    buttons[style] = new StyleCommand(style);
  });


  var placeholderSrc = E50EditorConfig.placeholder
    .replace('WIDTH', E50EditorConfig.defaultWidth)
    .replace('HEIGHT', E50EditorConfig.defaultHeight);

  buttons['placeholder'] = new InsertCommand('placeholder', '<img src="'+placeholderSrc+'" class="placeholder" alt="Placeholder" cs-placeholder style="border: 1px solid rgb(231, 231, 231);"/>');
  buttons['link']        = new LinkCommand();

  // Expose the commands, so ppl can add there own later
  buttons.factory = function(command) {
    var commands = {
      FormatCommand : FormatCommand,
      StyleCommand  : StyleCommand,
      InsertCommand : InsertCommand,
      LinkCommand   : LinkCommand,
      ImageCommand  : ImageCommand
    };
    return commands[command] !== "undefined" ? commands[command] : false;
  };
  return buttons;
});
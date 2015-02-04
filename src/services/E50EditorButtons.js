angular.module('E50Editor')
.factory('E50EditorButtons', function(taBrowserTag, taSelection, taExecCommand, E50Documents) {

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
      this.document.execCommand('formatBlock', false, '<'+taBrowserTag(newTag)+'>');
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
      var execCommand = taExecCommand(this.document)('p');
      execCommand(tag);
    };
    this.setDocument = setDocument;
  }

  // This inserts an image at the given cursor position
  function ImageCommand() {
    this.name = "image";
    this.isActive = function() {
      if(!this.document) { return false; }
      var selection = taSelection(this.document);
      var elm = selection.getSelectionElement();
      return elm.tagName === 'IMG';
    };
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      var url = window.prompt('Image url', 'http://');
      execCommand('insertImage', false, url);
    };
    this.setDocument = setDocument;
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      var execCommand = taExecCommand(this.document)('p');
      execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
    this.setDocument = setDocument;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var url = window.prompt('Link URL:', 'http://');
      var doc = this.iframe[0].document || this.iframe[0].contentWindow.document;
      doc.execCommand('createLink', false, url);
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

  buttons['image']       = new ImageCommand();
  buttons['placeholder'] = new InsertCommand('placeholder', '<img src="placeholder.png" class="placeholder" alt="Placeholder"/>');
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
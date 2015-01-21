angular.module('E50Editor')
.factory('E50EditorButtons', function(E50ExecCommand, taBrowserTag, taSelection) {
  
  // alias
  var execCommand = E50ExecCommand;

  /**
   * Each command must implement the given interface 
   * { 
   *    name:string;
   *    execute():void;
   *    isActive():boolean;
   *  }
   */

  // This wraps the selection around the given tag
  function FormatCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return document.queryCommandValue('formatBlock').toLowerCase() === tag;
    };
    this.execute = function() {
      execCommand('formatBlock', false, '<'+taBrowserTag(tag)+'>');
    };
  }

  // This executes the given style command, ie 'bold' or 'italic'
  function StyleCommand(tag) {
    this.name = tag;
    this.isActive = function() {
      return document.queryCommandState(tag);
    };
    this.execute = function() {
      execCommand(tag);
    };
  }

  // This inserts an image at the given cursor position
  function ImageCommand() {
    this.name = "image";
    this.isActive = function() {
      var elm = taSelection.getSelectionElement();
      return elm.tagName === 'IMG';
    };
    this.execute = function() {
      var url = window.prompt('Image url', 'http://');
      $document[0].execCommand('insertImage', false, url);
    };
  }

  // This inserts custom html at the given cursor position
  function InsertCommand(tag, html) {
    this.name = tag;
    this.execute = function() {
      execCommand('insertHTML', false, html);
    };
    this.isActive = angular.noop;
  }

  // Creates a link
  function LinkCommand() {
    this.execute = function() {
      var url = window.prompt('Link?', 'http://');
      execCommand('createLink', false, url);      
    };
    this.isActive = function() {
      var elm = taSelection.getSelectionElement();
      return $(elm).closest('a').length;      
    };
  }

  var formats = ['h1','h2','h3','h4','h5','h6','p','pre','blockquote'];
  var styles  = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertOrderedList', 'insertUnorderedList'];
  var buttons = {};

  formats.forEach(function(format) {
    buttons[format] = new FormatCommand(format);
  });

  styles.forEach(function(style) {
    buttons[style] = new StyleCommand(style);
  });

  buttons['image'] = new ImageCommand();
  buttons['placeholder'] = new InsertCommand('placeholder', '<img src="placeholder.png" class="placeholder" alt="Placeholder"/>');
  buttons['link'] = new LinkCommand();

  buttons.factory = function(command) {
    var commands = {
      FormatCommand: FormatCommand,
      StyleCommand: StyleCommand,
      InsertCommand: InsertCommand,
      LinkCommand: LinkCommand,
      ImageCommand: ImageCommand
    };
    return commands[command] !== "undefined" ? commands[command] : false;
  };
  return buttons;
});
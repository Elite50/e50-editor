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

  return {
    'h1'           : new FormatCommand('h1'),
    'h2'           : new FormatCommand('h2'),
    'h3'           : new FormatCommand('h3'),
    'h4'           : new FormatCommand('h4'),
    'h5'           : new FormatCommand('h5'),
    'h6'           : new FormatCommand('h6'),
    'p'            : new FormatCommand('p'),
    'pre'          : new FormatCommand('pre'),
    'blockquote'   : new FormatCommand('blockquote'),
    'bold'         : new StyleCommand('bold'),
    'italic'       : new StyleCommand('italic'),
    'underline'    : new StyleCommand('underline'),
    'justifyLeft'  : new StyleCommand('justifyLeft'),
    'justifyCenter': new StyleCommand('justifyCenter'),
    'justifyRight' : new StyleCommand('justifyRight'),
    'link'         : new LinkCommand(),
    'image'        : new ImageCommand(),
    'placeholder'  : new InsertCommand('placeholder', '<img src="placeholder.png" class="placeholder" alt="Placeholder"/>'),
    'insertOrderedList'   : new StyleCommand('insertOrderedList'),
    'insertUnorderedList' : new StyleCommand('insertUnorderedList')
  };  
});
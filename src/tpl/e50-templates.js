angular.module('e50Editor.tpls', ['views/e50-editor.tpl.html']);

angular.module("views/e50-editor.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("views/e50-editor.tpl.html",
    "<div class=\"e50-editor\">\n" +
    "  \n" +
    "  <a href=\"\" ng-click=\"edit=!edit\" class=\"toggle\">\n" +
    "    <i class=\"fa fa-edit\"></i>\n" +
    "  </a>\n" +
    "  \n" +
    "  <div class=\"format-buttons\" ng-show=\"edit\">\n" +
    "    <div ng-repeat=\"group in toolbars\">\n" +
    "      <button type=\"button\" unselectable=\"on\" ng-repeat=\"button in group\" ng-bind-html=\"name(button)\" ng-click=\"execute(button)\" ng-disabled=\"isDisabled()\" tabindex=\"-1\" ng-class=\"{active:isActive(button)}\"></button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"live-editor\" contenteditable=\"true\" e50-bind ng-model=\"html\" ng-transclude=\"\"></div>\n" +
    "\n" +
    "</div>");
}]);

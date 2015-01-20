angular.module('E50Editor')
.factory('E50ExecCommand', function(taExecCommand) {
  return taExecCommand('p');
});
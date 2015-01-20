var app = angular.module('app', ['E50Editor', 'ngSanitize', 'textAngular']);
app.controller('MainCtrl', function($scope, $http) {
  $scope.headerHtml  = '<h3>Header html</h3>';
  $scope.footerHtml  = '<p>&copy; Copyright 2015</p>';
  $scope.contentHtml = "";

  // Bacon ipsum text
  $http.get('http://baconipsum.com/api/?type=meat-and-filler&paras=4').success(function(res) {
    res.forEach(function(p, i) {
      $scope.contentHtml += '<p>'+p+'</p>';
      if(i === 0 || i === 2) {
        $scope.contentHtml += '<p><img class="placeholder" src="placeholder.png" alt="" /><br></p>';
      }
    });
  });

  $scope.done = function() {
    console.log($scope.headerHtml + $scope.contentHtml);
  };
});
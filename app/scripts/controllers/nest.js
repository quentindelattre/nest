'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:nestCtrl
 * @description
 * # nestCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('nestCtrl',['$scope', 'initialize', 'connectTwitter', 'user', function ($scope, initialize, connectTwitter, user) {
   //   console.log(user);
   $scope.user=user;

   $scope.signOut = function() {
      twitterService.clearCache();
   }
}]);


  // 'use strict';
  //
  // var ctrl = angular.module('myApp.controllers', []);
  //
  // ctrl.controller('AutoCtrl', ['$scope', function($scope) {}]);
  //
  //
  // ctrl.controller('LibraryCtrl', ['$scope', 'books', 'movies', function($scope, books, movies) {
  // 	$scope.books = books.data;
  // 	$scope.movies = movies.data;
  // }]);

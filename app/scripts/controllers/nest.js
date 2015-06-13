'use strict';

/**
* @ngdoc function
* @name nestApp.controller:nestCtrl
* @description
* # nestCtrl
* Controller of the nestApp
*/
angular.module('nestApp')
.controller('nestCtrl',['$scope', '$location', 'twitterService', 'initialize', 'connectTwitter', 'user', function ($scope, $location, twitterService, user) {

   // twitterService.initialize();
   // twitterService.connectTwitter().then(function() {
   //    if (twitterService.isReady()) {
   //       console.log('connected');
   //    }
   // });

   // $scope.user=user;

   $scope.signOut = function() {
      console.log('Bye bye');
      $location.path('/');
      twitterService.clearCache();
   };
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

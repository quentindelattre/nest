'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('MainCtrl', ['$scope', '$location', 'twitterService', function ($scope, $location, twitterService) {
    $scope.initializeNest = function(){
      twitterService.initialize();
      twitterService.connectTwitter().then(function() {
         if (twitterService.isReady()) {
            $location.path('/nest');
         }else {
         }
      });
   };
}]);

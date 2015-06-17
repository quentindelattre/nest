'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('MainCtrl', ['$scope', '$rootScope', '$location', 'twitterService', function ($scope, $root, $location, twitterService) {
    $root.loadingView = false;
    $root.firstOpen = true;
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

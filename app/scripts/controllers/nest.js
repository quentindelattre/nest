'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:nestCtrl
 * @description
 * # nestCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('nestCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });

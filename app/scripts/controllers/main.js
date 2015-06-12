'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });

'use strict';

/**
 * @ngdoc function
 * @name nestApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the nestApp
 */
angular.module('nestApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });

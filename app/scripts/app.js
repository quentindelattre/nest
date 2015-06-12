'use strict';

/**
 * @ngdoc overview
 * @name nestApp
 * @description
 * # nestApp
 *
 * Main module of the application.
 */
angular
  .module('nestApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/nest', {
        templateUrl: 'views/nest.html',
        controller: 'nestCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }).run(['$rootScope', function($root) {

  $root.$on('$routeChangeStart', function(e, curr, prev) {
    if (curr.$$route && curr.$$route.resolve) {
      // Show a loading message until promises are not resolved
      $root.loadingView = true;
    }
  });

  $root.$on('$routeChangeSuccess', function(e, curr, prev) {
    // Hide loading message
    $root.loadingView = false;
  });

}]);

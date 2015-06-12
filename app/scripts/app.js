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
   'nestApp.services',
   'oauth.io',
   'rzModule',
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
      controller: 'nestCtrl',
      resolve: {
         initialize: function(twitterService) {
            return twitterService.initialize();
         },
         connectTwitter: function(twitterService){
            return twitterService.connectTwitter().then(function() {
               if (twitterService.isReady()) {
                  twitterService.getUser();
               }
            });
         },
         user: function(twitterService) {
            return twitterService.getUser();
         // },
         // UserTimeline: function(twitterService) {
         //    return twitterService.getUserTimeline();
         // },
         // followersActivity: function(twitterService) {
         //    return twitterService.getFollowersActivity();
         // },
         // mentionsTimeline: function(twitterService) {
         //    return twitterService.getMentionsTimeline();
         }
      }
   })
   .otherwise({
      redirectTo: '/'
   });
})
.run(['$rootScope', function($root) {

   $root.$on('$routeChangeStart', function(e, curr, prev) {
      if (curr.$$route && curr.$$route.resolve) {
         // Show a loading message until promises are not resolved
         $root.loadingView = true;
         console.log('loading', $root.loadingView);
      }
   });

   $root.$on('$routeChangeSuccess', function(e, curr, prev) {
      // Hide loading message
      // $root.loadingView = false;
      console.log('done.', $root.loadingView);
   });

}]);

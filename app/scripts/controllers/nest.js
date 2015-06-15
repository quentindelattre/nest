'use strict';

/**
* @ngdoc function
* @name nestApp.controller:nestCtrl
* @description
* # nestCtrl
* Controller of the nestApp
*/
angular.module('nestApp')
.controller('nestCtrl',['$scope', '$rootScope', '$location', '$q', 'twitterService', 'user', function ($scope, $root, $location, $q, twitterService, user) {

   var isDataRetrieved = false;

   $scope.user=user;


   getValues(user);

   function getValues (user){
      var defer = $q.defer();
      // $scope.engagedFollowers=getCircleB(user.id);
      // if ($scope.engagedFollowers){
      //    $root.loadingView=false;
      // }

      getFollowersActivity(user.id).then(function(ret){
         $root.loadingView=false;
         console.log('getValues getFollowersActivity then', ret);
      })
   }


   function getFollowersActivity(usrId){
      var defer = $q.defer();
      var promise = twitterService.getFollowersActivity(usrId).then(function(data){
         defer.resolve(data);
      })
      return defer.promise;
   }

   $scope.timeMachine = {
       max: 180,
       ceil: 500,
       floor: 0
   };


   $scope.translate = function(value){
       return value + ' days';
   }

   $scope.signOut = function() {
      console.log('Bye bye');
      $location.path('/');
      twitterService.clearCache();
   };

   function countMentions(allTweets, timeLimit){
         var men_count=0;
         // Do stuff with favCount
         for (var i = 0; i < allTweets.length; i++) {
            if(allTweets[i].created_at.days<timeLimit){
               men_count++;
            } // If tweet is more recent than the time limit
         }
         return men_count;
   }

   function countFavorites(allTweets, timeLimit){
         var favCount=0;
         // Do stuff with favCount
         for (var i = 0; i < allTweets.length; i++) {
            if(allTweets[i].created_at.days<timeLimit){
               favCount+=allTweets[i].favorite_count;
            } // If tweet is more recent than the time limit
         }
         return favCount;
   }

   function countRetweets(allTweets, timeLimit){
      var rtCount = 0;
      // Do stuff with rtCount
      for (var i = 0; i < allTweets.length; i++) {
         if(allTweets[i].created_at.days<timeLimit
            && allTweets[i].text.slice(0,2)!='RT'){
            rtCount+=allTweets[i].retweet_count;
         } // If tweet is more recent than the time limit
      }
      return rtCount;
   }

   function processSingleTweet(tweet){
      var tweetDate = tweet.created_at;

      tweetDate=parseTwitterDate(tweetDate);

      var today = new Date();

      var deltaT = today - tweetDate; //in ms
      var dDiff = deltaT / 3600 / 1000 / 24; //in days
      var humanReadable = {};
      humanReadable.days = Math.floor(dDiff);
      tweet.created_at=humanReadable;
      return tweet;
   }

   function processTweets(tweets){
      // Process Tweets to get time difference
      for (var i = 0; i < tweets.length; i++) {
         var tweetDate = tweets[i].created_at;

         tweetDate=parseTwitterDate(tweetDate);

         var today = new Date();

         var deltaT = today - tweetDate; //in ms
         var dDiff = deltaT / 3600 / 1000 / 24; //in days
         var humanReadable = {};
         humanReadable.days = Math.floor(dDiff);
         tweets[i].created_at=humanReadable;
      }
      return tweets;
   }

   function parseTwitterDate(date) {
      return new Date(Date.parse(date.replace(/( +)/, ' UTC$1')));
   }

   // function compareTweets(a,b) {
   //   if (a.created_at < b.created_at){
   //      return -1;
   //   }else if (a.created_at > b.created_at){
   //      return 1;
   //   }else{
   //      return 0;
   //   }
   // }

   function compareTweets(a,b) {
     if (a.created_at.days < b.created_at.days){
        return 1;
     }else if (a.created_at.days > b.created_at.days){
        return -1;
     }else{
        return 0;
     }
   }

   function compareFollowers(a,b) {
     if (a.status.created_at.days < b.status.created_at.days){
        return 1;
     }else if (a.status.created_at.days > b.status.created_at.days){
        return -1;
     }else{
        return 0;
     }
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

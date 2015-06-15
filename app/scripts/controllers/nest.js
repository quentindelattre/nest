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


   setTimeMachine(user);


   $scope.translate = function(value){
       return value + ' days';
   }

   $scope.signOut = function() {
      console.log('Bye bye');
      $location.path('/');
      twitterService.clearCache();
   };


   $scope.refresh = function() {
      if (confirm('Refreshing your data is going to take some time, are you sure you want to do it ?')) {
         getValues(user);
      }else{
         console.log('Nope.');
      }
   };

   function getValues (user){
      $root.loadingView=true;
      var defer = $q.defer();

      getFollowersActivity(user.id).then(function(activityRet){
         getFollowersEngagement(user.id).then(function(engagementRet){
            // setTimeMachine();
            defer.resolve();
            $root.loadingView=false;
         });
      });
      return defer.promise;
   }

   function getFollowersActivity(usrId){
      var defer = $q.defer();
      var promise = twitterService.getFollowersActivity(usrId).then(function(data){
         $scope.engagedFollowers=processFollowers(data);
         console.log('followers activity');
         defer.resolve(data);
      })
      return defer.promise;
   }

   function getFollowersEngagement(usrId){
      console.log('followers engagement');
      var defer = $q.defer();
      $q.all([
         getUserTimeline(usrId),
         getUserMentions()
      ]).then(function(){
         defer.resolve();
      });
      return defer.promise;
   }

   function getUserTimeline(usrId){
      console.log('getUserMentions');
      var defer = $q.defer();
      var userTimelinePromise = twitterService.getUserTimeline(usrId).then(function(timelineData){
         $scope.userTimeline = processTimeline(timelineData);
         defer.resolve(timelineData);
      });
      return defer.promise;
   }

   function getUserMentions(usrId){
      console.log('getUserMentions');
      var defer = $q.defer();
      var userMentionsPromise = twitterService.getMentionsTimeline().then(function(mentionsData){
         $scope.mentionsTimeline = processTimeline(mentionsData);
         defer.resolve(mentionsData);
      });
      return defer.promise;
   }

   function processTimeline(timeline){
      var processedTimeline=processTweets(timeline);
      processedTimeline.reverse(processedTimeline.sort(compareTweets));
      return processedTimeline;
   }

   function processFollowers(followers){
      var engagedFollowers=[];
      for (var i = 0; i < followers.length; i++) {
         if (followers[i].status) {
            followers[i].status=processSingleTweet(followers[i].status);
            engagedFollowers.push(followers[i]);
         }
      }
      engagedFollowers.reverse(engagedFollowers.sort(compareFollowers));
      return engagedFollowers;
   }

   function setTimeMachine(){
      getValues(user).then(function(){
         var oldestItems = [
             $scope.engagedFollowers[$scope.engagedFollowers.length-1].status.created_at.days,
             $scope.mentionsTimeline[$scope.mentionsTimeline.length-1].created_at.days,
             $scope.userTimeline[$scope.userTimeline.length-1].created_at.days
         ];

         $scope.timeMachine = {
             max: 180,
             ceil: Math.max.apply(Math, oldestItems),
             floor: 0
         };
      });
   }

   function countMentions(allTweets, timeLimit){
         var menCount=0;
         // Do stuff with favCount
         for (var i = 0; i < allTweets.length; i++) {
            if(allTweets[i].created_at.days<timeLimit){
               menCount++;
            } // If tweet is more recent than the time limit
         }
         return menCount;
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

   function processTweets(tweets){
      // Process Tweets to get time difference
      for (var i = 0; i < tweets.length; i++) {
         var tweet_date = tweets[i].created_at;

         tweet_date=parseTwitterDate(tweet_date);

         var today = new Date();

         var deltaT = today - tweet_date; //in ms
         var dDiff = deltaT / 3600 / 1000 / 24; //in days
         var humanReadable = {};
         humanReadable.days = Math.floor(dDiff);
         tweets[i].created_at=humanReadable;
      }
      return tweets;
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

   function parseTwitterDate(date) {
      return new Date(Date.parse(date.replace(/( +)/, ' UTC$1')));
   }

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

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
   $scope.user=user;

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

   $scope.$on("slideEnded", function() {
      setStats();
      $scope.$apply();
   });

   function getValues (user){
      $root.loadingView=true;
      var defer = $q.defer();

      getFollowersActivity(user.id).then(function(activityRet){
         getFollowersEngagement(user.id).then(function(engagementRet){
            defer.resolve();
            $root.loadingView=false;
            $root.firstOpen = false;
         });
      });
      return defer.promise;
   }

   function getFollowersActivity(usrId){
      var defer = $q.defer();
      var promise = twitterService.getFollowersActivity(usrId).then(function(data){
         $scope.activeFollowers=processFollowers(data);
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
      console.log('getUserTimeline');
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
      var activeFollowers=[];
      for (var i = 0; i < followers.length; i++) {
         if (followers[i].status) {
            followers[i].status=processSingleTweet(followers[i].status);
            activeFollowers.push(followers[i]);
         }
      }
      activeFollowers.reverse(activeFollowers.sort(compareFollowers));
      return activeFollowers;
   }

   function initializeNest(){
      getValues(user).then(function(){
         var oldestItems = [
            //  $scope.activeFollowers[$scope.activeFollowers.length-1].status.created_at.days,
            //  $scope.mentionsTimeline[$scope.mentionsTimeline.length-1].created_at.days,
            $scope.userTimeline[$scope.userTimeline.length-1].created_at.days
         ];

         $scope.timeMachine = {
            max: 7,
            ceil: Math.max.apply(Math, oldestItems),
            // ceil: 183, // 6 months
            floor: 0
         };
         setStats();
      });
   }

   function setStats(){
      var userFollowersCount = user.followers_count;

      var   activeVal = countActiveFollower($scope.activeFollowers, $scope.timeMachine.max),
      activeRatio = ((activeVal/userFollowersCount)*100).toFixed(1),
      mentionsCount = countMentions($scope.mentionsTimeline, $scope.timeMachine.max),
      rtCount = countRetweets($scope.userTimeline, $scope.timeMachine.max),
      favCount = countFavorites($scope.userTimeline, $scope.timeMachine.max),
      engagementVal = mentionsCount+rtCount+favCount,
      engagementRatio = ((engagementVal/userFollowersCount)*100).toFixed(1),
      hashtag = setHashtags($scope.userTimeline, $scope.timeMachine.max);;

      $scope.stats= {
         active:{
            val   :  activeVal,
            ratio :  activeRatio
         },
         engaged:{
            mentions :  mentionsCount,
            retweets :  rtCount,
            favorite :  favCount,
            val      :  engagementVal,
            ratio    :  engagementRatio
         }
      };
   };

   function countActiveFollower(followers, timeLimit){
      var followerCount = 0;

      for (var i = 0; i < followers.length; i++) {
         if (followers[i].status.created_at.days<=timeLimit) {
            followerCount++
         }
      }

      return followerCount;
   }

   function countMentions(allTweets, timeLimit){
      var menCount=0;
      // Do stuff with favCount
      for (var i = 0; i < allTweets.length; i++) {
         if(allTweets[i].created_at.days<=timeLimit){
            menCount++;
         } // If tweet is more recent than the time limit
      }
      return menCount;
   }

   function countFavorites(allTweets, timeLimit){
      var favCount=0;
      // Do stuff with favCount
      for (var i = 0; i < allTweets.length; i++) {
         if(allTweets[i].created_at.days<=timeLimit){
            favCount+=allTweets[i].favorite_count;
         } // If tweet is more recent than the time limit
      }
      return favCount;
   }

   function countRetweets(allTweets, timeLimit){
      var rtCount = 0;
      // Do stuff with rtCount
      for (var i = 0; i < allTweets.length; i++) {
         if(allTweets[i].created_at.days<=timeLimit &&
            allTweets[i].retweeted === false){
               rtCount+=allTweets[i].retweet_count;
            } // If tweet is more recent than the time limit
         }
         return rtCount;
      }

      function setHashtags(timeline, timeLimit){
         var hashtags = [];
         for (var i = 0; i < timeline.length; i++) {
            if (timeline[i].created_at.days<=timeLimit) {
               for (var j = 0; j < timeline[i].entities.hashtags.length; j++) {
                  hashtags.push(timeline[i].entities.hashtags[j].text);
               }
            }
         }

         hashtags.sort();

         function count(arr) { // count occurances
            var o = {};
            for (var i = 0; i < arr.length; ++i) {
               o[arr[i]] = (o[arr[i]] || 0) + 1;
            }
            o = sortProperties(o);
            return o;
         }

         function sortProperties(obj){
            // convert object into array
            var sortable=[];
            for(var key in obj){
               if(obj.hasOwnProperty(key)){
                  sortable.push([key, obj[key]]);
               }
            }

            // sort items by value
            sortable.sort(function(a, b)
            {
               return b[1]-a[1]; // compare numbers
            });

            var hasht = [];
            for (var i = 0; i < sortable.length; i++) {
               var t = {};
               t.hashtag = sortable[i][0];
               t.count = sortable[i][1];
               hasht[i]=t;
            }
            return hasht; // array in format [ {key1 :val1 }, ... ]
         }

         $scope.hashtags = count(hashtags);
      }

      var limitStep = 10;
      $scope.limit = 2*limitStep;
      $scope.incrementLimit = function() {
         $scope.limit += limitStep;
         if ($scope.limit>=$scope.hashtags) {
            $scope.disableMore=true;
         }
         $scope.disableLess=false;
      };
      $scope.decrementLimit = function() {
         $scope.limit -= limitStep;
         if ($scope.limit<=0) {
            $scope.disableLess=true
         }
         $scope.disableMore=false
      };

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



      initializeNest();
   }]);

'use strict';
/**
* @ngdoc function
* @name nestApp.controller:nestCtrl
* @description
* # nestCtrl
* Controller of the nestApp
*/
angular.module('nestApp')
.controller('nestCtrl', ['$scope', '$rootScope', '$location', '$q', 'twitterService', 'user', function($scope, $root, $location, $q, twitterService, user) {
   // Set scope with user data
   $scope.user = user;
   // Simply add ' days' in the Time Machine slider
   $scope.translate = function(value) {
      return value + ' days';
   }
   // Sign out, clear authentication and back to home
   $scope.signOut = function() {
      console.log('Bye bye');
      $location.path('/');
      twitterService.clearCache();
   };
   // Refresh data WARNING this takes a loooong time
   $scope.refresh = function() {
      if (confirm('Refreshing your data is going to take some time, are you sure you want to do it ?')) {
         getValues(user);
      } else {
         console.log('Nope.');
      }
   };
   // Steps in popular hashtags list
   var limitStep = 10;
   $scope.limit = 2 * limitStep;
   // Show more hashtags
   $scope.incrementLimit = function() {
      $scope.limit += limitStep;
      // If user reaches the end of the list, disable button
      if ($scope.limit >= $scope.hashtags) {
         $scope.disableMore = true;
      }
      $scope.disableLess = false;
   };
   // Show less hashtags
   $scope.decrementLimit = function() {
      $scope.limit -= limitStep;
      // If user reaches the end of the list, disable buttons
      if ($scope.limit <= 0) {
         $scope.disableLess = true;
      }
      $scope.disableMore = false;
   };
   // Listen for interraction with time machine slider
   $scope.$on("slideEnded", function() {
      // refresh data
      setStats();
      // Apply to scope
      $scope.$apply();
   });
   function initializeNest() {
      // Call get values
      getValues(user).then(function() {
         // When all data have been retrieved, set the time machine to max at the oldes tweet from user
         var oldestUserTweet = $scope.userTimeline[$scope.userTimeline.length - 1].created_at.days;
         // Apply value to the slider
         $scope.timeMachine = {
            max: 7,
            ceil: oldestUserTweet,
            floor: 0
         };
         // Calculate stats
         setStats();
         setBarData();
      });
   }
   function getValues(user) {
      // When method is called, overlay loadingView
      $root.loadingView = true;
      // Set glyphicons to spinning arrows
      $root.acquFollowers = 'refresh';
      $root.acquUserTimeline = 'refresh';
      $root.acquMentions = 'refresh';
      // Create deferred object
      var defer = $q.defer();
      // The two promises can be executed in parallel
      var promise1 = getFollowersActivity(user),
      promise2 = getFollowersEngagement(user);
      // When all of them have been resolved
      $q.all([promise1, promise2]).then(function(data) {
         defer.resolve();
         // Remove loadingView
         $root.loadingView = false;
         $root.firstOpen = false;
      });
      return defer.promise;
   }
   function getFollowersActivity(usr) {
      console.log('Calling followers activity');
      var defer = $q.defer();
      var promise = twitterService.getFollowersActivity(usr).then(function(data) {
         // Send retrieved values to be processed
         $scope.activeFollowers = processFollowers(data);
         // Switch glyphicon to a check
         $root.acquFollowers = 'ok';
         // Resolve promise
         defer.resolve(data);
      })
      return defer.promise;
   }
   function getFollowersEngagement(usr) {
      console.log('Calling followers engagement');
      var defer = $q.defer();
      $q.all([
         // Send both promises in parallel to be resolved
         getUserTimeline(usr),
         getUserMentions()
      ]).then(function() {
         defer.resolve();
      });
      return defer.promise;
   }
   function getUserTimeline(usr) {
      console.log('Calling getUserTimeline');
      var defer = $q.defer();
      // Call twitterService and execute promise
      var userTimelinePromise = twitterService.getUserTimeline(usr).then(function(timelineData) {
         $scope.userTimeline = processTimeline(timelineData);
         // Switch glyphicon to a check
         $root.acquUserTimeline = 'ok';
         // Resolve promise
         defer.resolve(timelineData);
      });
      return defer.promise;
   }
   function getUserMentions(usrId) {
      console.log('Calling getUserMentions');
      var defer = $q.defer();
      // Call twitterService and execute promise
      var userMentionsPromise = twitterService.getMentionsTimeline().then(function(mentionsData) {
         $scope.mentionsTimeline = processTimeline(mentionsData);
         // Switch glyphicon to a check
         $root.acquMentions = 'ok';
         // Resolve promise
         defer.resolve(mentionsData);
      });
      return defer.promise;
   }
   function processTimeline(timeline) {
      var processedTimeline = processTweets(timeline);
      // Set timeline order for most recent first
      processedTimeline.reverse(processedTimeline.sort(compareTweets));
      return processedTimeline;
   }
   function processFollowers(followers) {
      // Empty array to collect active followers (ie. having tweeted in the last XX days set by time slider)
      var activeFollowers = [];
      // Setup followers "health" analysis
      $scope.fStats = {
         fSpam: 0,
         fUser: 0,
         fVerif: 0
      };
      for (var i = 0; i < followers.length; i++) {
         // If user has tweeted AT LEAST ONCE
         if (followers[i].status) {
            // Process date to be useful
            followers[i].status = processSingleTweet(followers[i].status);
            activeFollowers.push(followers[i]);
         }
         // If follower has a pristine default account and follows way more people than is followed by (following 10'000 accounts and is followed by 20), it is likely to be a bot or spam account
         var defaultProfile = followers[i].default_profile,
         defaultProfileImage = followers[i].default_profile_image,
         ffRatio = followers[i].followers_count / followers[i].friends_count;
         if (defaultProfileImage && defaultProfile && ffRatio < 0.01) {
            $scope.fStats.fSpam++;
         } else if (followers[i].tweet_count !== 0) {
            // If user has tweeted at least once and modified his default account, it is considered a regular user
            $scope.fStats.fUser++;
         }
         if (followers[i].verified) {
            // VIP accounts are officially verified by Twitter
            $scope.fStats.fVerif++;
         }
      }
      // Sort followers array from most recent tweet to oldest
      activeFollowers.reverse(activeFollowers.sort(compareFollowers));
      return activeFollowers;
   }
   function setStats() {
      var userFollowersCount = user.followers_count;
      // Count elements in each arrays of data compared to the time limit in the slider.
      var activeVal = countActiveFollower($scope.activeFollowers, $scope.timeMachine.max),
      activeRatio = ((activeVal / userFollowersCount) * 100).toFixed(1),
      mentionsCount = countMentions($scope.mentionsTimeline, $scope.timeMachine.max),
      rtCount = countRetweets($scope.userTimeline, $scope.timeMachine.max),
      favCount = countFavorites($scope.userTimeline, $scope.timeMachine.max),
      engagementVal = mentionsCount + rtCount + favCount,
      engagementRatio = ((engagementVal / userFollowersCount) * 100).toFixed(1),
      hashtag = setHashtags($scope.userTimeline, $scope.timeMachine.max);
      $scope.stats = {
         active: {
            val: activeVal,
            ratio: activeRatio
         },
         engaged: {
            mentions: mentionsCount,
            retweets: rtCount,
            favorite: favCount,
            val: engagementVal,
            ratio: engagementRatio
         }
      };
      // Send data to be visualized in venn diagram
      setVenn($scope.stats);
   };
   function setBarData(){
      var userTimeline = $scope.userTimeline,
         tMax = $scope.timeMachine.ceil,
         favCount = 0,
         rtCount = 0,
         prevFavCount = 0,
         prevRtCount = 0,
         barData = [];
      // Get engagement statistics for each day in the time machine
      for (var i = 0; i < tMax; i++) {
         rtCount = countRetweets(userTimeline, i)-prevRtCount;
         favCount = countFavorites(userTimeline, i)-prevFavCount;
         var newData = {
            day:  i,
            retweets:   rtCount,
            favorites:  favCount
         };
         barData.push(newData);
         prevRtCount=rtCount;
         prevFavCount=favCount;
      }
      $scope.barData=barData;
   }
   function setVenn(stats) {
      var sets = [{
         sets: ['Total'],
         size: user.followers_count
      }, {
         sets: ['Active'],
         size: stats.active.val
      }, {
         sets: ['Engaged'],
         size: stats.engaged.val
      }, {
         sets: ['Total', 'Active'],
         size: stats.active.val
      }, {
         sets: ['Total', 'Engaged'],
         size: stats.engaged.val
      }, {
         sets: ['Active', 'Engaged'],
         size: stats.engaged.val
      }, {
         sets: ['Total', 'Active', 'Engaged'],
         size: stats.engaged.val
      }];
      $scope.vennData = sets;
   }
   function getTweetForDay(d, userTimeline){
      var dayTweets = [];
      for (var i = 0; i < d; i++) {
         if (userTimeline[i].created_at.days===d) {
            dayTweets.push(userTimeline[i]);
         }
      }
   }
   function countActiveFollower(followers, timeLimit) {
      var followerCount = 0;
      for (var i = 0; i < followers.length; i++) {
         // If the date of the follower's latest tweet is prior to the time limit, count it.
         if (followers[i].status.created_at.days <= timeLimit) {
            followerCount++
         }
      }
      return followerCount;
   }
   function countMentions(allTweets, timeLimit) {
      var menCount = 0;
      for (var i = 0; i < allTweets.length; i++) {
         // If the date of the tweet is prior to the time limit, count it.
         if (allTweets[i].created_at.days <= timeLimit) {
            menCount++;
         }
      }
      return menCount;
   }
   function countFavorites(allTweets, timeLimit) {
      var favCount = 0;
      for (var i = 0; i < allTweets.length; i++) {
         // If the date of the tweet is prior to the time limit, count it.
         if (allTweets[i].created_at.days <= timeLimit) {
            favCount += allTweets[i].favorite_count;
         }
      }
      return favCount;
   }
   function countRetweets(allTweets, timeLimit) {
      var rtCount = 0;
      for (var i = 0; i < allTweets.length; i++) {
         // If the date of the tweet is prior to the time limit, count it.
         if (allTweets[i].created_at.days <= timeLimit &&
            allTweets[i].retweeted === false) {
               rtCount += allTweets[i].retweet_count;
            }
         }
         return rtCount;
      }
      function setHashtags(timeline, timeLimit) {
         // Create empty array to collect all hashtags in user's timeline
         var hashtags = [];
         for (var i = 0; i < timeline.length; i++) {
            // If the date of the tweet is prior to the time limit, get its hashtags.
            if (timeline[i].created_at.days <= timeLimit) {
               for (var j = 0; j < timeline[i].entities.hashtags.length; j++) {
                  hashtags.push(timeline[i].entities.hashtags[j].text);
               }
            }
         }
         hashtags.sort();
         function count(arr) { // count occurrences of indentical hashtags
            var o = {};
            for (var i = 0; i < arr.length; ++i) {
               o[arr[i]] = (o[arr[i]] || 0) + 1;
            }
            o = sortProperties(o);
            return o;
         }
         function sortProperties(obj) {
            // convert object into array
            var sortable = [];
            for (var key in obj) {
               if (obj.hasOwnProperty(key)) {
                  sortable.push([key, obj[key]]);
               }
            }
            // sort items by value
            sortable.sort(function(a, b) {
               return b[1] - a[1]; // compare numbers
            });
            var hasht = [];
            for (var i = 0; i < sortable.length; i++) {
               var t = {};
               t.hashtag = sortable[i][0];
               t.count = sortable[i][1];
               hasht[i] = t;
            }
            return hasht; // array in format [ {key1 :val1 }, ... ]
         }
         $scope.hashtags = count(hashtags);
         // Disable buttons if there are no hashtags to display
         if ($scope.hashtags === 0) {
            $scope.disableMore = true;
            $scope.disableLess = true;
         }
      }
      function processTweets(tweets) {
         // Process Tweets to get time difference
         for (var i = 0; i < tweets.length; i++) {
            var tweet_date = tweets[i].created_at;
            // parse twitter date format to human readable date
            tweet_date = parseTwitterDate(tweet_date);
            var today = new Date();
            var deltaT = today - tweet_date; //in ms
            var dDiff = deltaT / 3600 / 1000 / 24; //in days
            var humanReadable = {};
            humanReadable.days = Math.floor(dDiff);
            tweets[i].created_at = humanReadable;
         }
         return tweets;
      }
      function processSingleTweet(tweet) {
         var tweetDate = tweet.created_at;
         // parse twitter date format to human readable date
         tweetDate = parseTwitterDate(tweetDate);
         var today = new Date();
         var deltaT = today - tweetDate; //in ms
         var dDiff = deltaT / 3600 / 1000 / 24; //in days
         var humanReadable = {};
         humanReadable.days = Math.floor(dDiff);
         tweet.created_at = humanReadable;
         return tweet;
      }
      function parseTwitterDate(date) {
         return new Date(Date.parse(date.replace(/( +)/, ' UTC$1')));
      }
      function compareTweets(a, b) {
         if (a.created_at.days < b.created_at.days) {
            return 1;
         } else if (a.created_at.days > b.created_at.days) {
            return -1;
         } else {
            return 0;
         }
      }
      function compareFollowers(a, b) {
         if (a.status.created_at.days < b.status.created_at.days) {
            return 1;
         } else if (a.status.created_at.days > b.status.created_at.days) {
            return -1;
         } else {
            return 0;
         }
      }
      // Call initialization function
      initializeNest();
   }])
.filter('twitterDate', function() {
  return function(input) {
    input = input || '';
    var tDate = new Date(input);
    var out = "";
    out=tDate.toLocaleString().replace(/:\d+ UTC\+.$/gi, "");
    return out;
  };
});

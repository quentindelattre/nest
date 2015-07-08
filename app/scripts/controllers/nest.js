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
   $scope.predicate = 'Engagement';
   $scope.reverse = true;
   $scope.order = function(predicate) {
     $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
     $scope.predicate = predicate;
   };
   // Simply add ' days' in the Time Machine slider
   $scope.translate = function(value) {
      return value + ' days';
   };
   $scope.countReplies = function(status) {
      return getRepliesToTweet(status.id_str);
   };
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
   var limitStep = 5;
   $scope.limit = 3 * limitStep;
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
   $scope.getTweetForDay = function (d){
      var dayTweets = [];
      var userTimeline = $scope.userTimeline;
      // console.log(d);
      $scope.$apply(function() {
         $scope.timeMachine.max=d;
         setStats();
         for (var i = 0; i < userTimeline.length; i++) {
            if (userTimeline[i].created_at.days===d) {
               dayTweets.push(userTimeline[i]);
            }
         }
         $scope.dayTweets=dayTweets;
         if (!$scope.tweetModal) {
            $scope.tweetModal=true
         }
      });
   };
   $scope.showTweetsForHashtag = function(h){
      var userTimeline = $scope.userTimeline,
         tweetId=h.tweetId,
         hTweets = [];
      for (var i = 0; i < tweetId.length; i++) {
         for (var j = 0; j < userTimeline.length; j++) {
            if (userTimeline[j].id_str===tweetId[i]) {
               hTweets.push(userTimeline[j]);
            }
         }
      }
      $scope.selHash=h.Hashtag;
      $scope.hTweets=hTweets;
      if (!$scope.hModal) {
         $scope.hModal=true
      }
   };
   $scope.toggleSpam = function(){
      $scope.showSpam=!$scope.showSpam;
   };
   $scope.blockUser = function (user){
      console.log('block',user.id);
      if (confirm('Are you sure you want to block '+user.screen_name+' ?')) {
         var defer = $q.defer(),
            promise = twitterService.blockUser(user.id).then(function(data){
               console.log(data);
               $scope.spamUsers = $scope.spamUsers.filter(function (el) {
                  return el.id !== user.id;
               });
               $scope.fStats.fSpam--;
            });
      } else {
         console.log('Nope.');
      }
   };
   $scope.closeModal = function(){
      $scope.tweetModal = false;
      $scope.hModal = false;
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
      var spamUsers = [];
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
         // If follower has a pristine default account that has been created more than a month ago and follows way more people than is followed by (following 10'000 accounts and is followed by 20), we will assume in this case taht it is likely to be a bot or spam account
         var defaultProfile = followers[i].default_profile,
         defaultProfileImage = followers[i].default_profile_image,
         ffRatio = followers[i].followers_count / followers[i].friends_count,
         isProtected = followers[i].protected,
         creationDate = parseTwitterDate(followers[i].created_at),
         today = new Date(),
         timeDiff = (today-creationDate)/ 3600 / 1000 / 24; // in days

         if (defaultProfileImage && defaultProfile && ffRatio < 0.01 && timeDiff>31 && !isProtected && followers[i].followers_count>0) {
            spamUsers.push(followers[i]);
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
      $scope.spamUsers=spamUsers;
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
         mentionsTimeline = $scope.mentionsTimeline,
         tMax = $scope.timeMachine.ceil,
         favCount = 0,
         rtCount = 0,
         prevFavCount = 0,
         prevRtCount = 0,
         barData = [];
      // Get engagement statistics for each day in the time machine
      for (var i = 0; i <= tMax; i++) {
         rtCount = countRetweets(userTimeline, i)-prevRtCount;
         favCount = countFavorites(userTimeline, i)-prevFavCount;
         var newData = {
            Day:  i,
            Retweets:   rtCount,
            Favorites:  favCount,
            Replies:    0
         };
         barData.push(newData);
         prevRtCount=prevRtCount+rtCount;
         prevFavCount=prevFavCount+favCount;
      }
      for (var i = 0; i < mentionsTimeline.length; i++) {
         var correspondingTweet = null;
         if (mentionsTimeline[i].in_reply_to_status_id_str !== null) {
            correspondingTweet = userTimeline.filter(function (el) {
              return el.id_str === mentionsTimeline[i].in_reply_to_status_id_str;
            });
            if (correspondingTweet.length>0) {
               barData[correspondingTweet[0].created_at.days].Replies++;
            }
         }
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
            // If the date of the tweet is before the time limit, get its hashtags.
            if (timeline[i].created_at.days <= timeLimit) {
               for (var j = 0; j < timeline[i].entities.hashtags.length; j++) {
                  var newData = {
                     Hashtag:    timeline[i].entities.hashtags[j].text,
                     tweetId:    timeline[i].id_str,
                     Favorites:  timeline[i].favorite_count,
                     Retweets:   timeline[i].retweet_count,
                     Replies:    getRepliesToTweet(timeline[i].id_str),
                     Engagement: timeline[i].favorite_count+timeline[i].retweet_count+getRepliesToTweet(timeline[i].id_str),
                     Frequency:  1
                  };
                  hashtags.push(newData);
               }
            }
         }
         function compare(a,b) {
           if (a.Hashtag < b.Hashtag)
             return -1;
           if (a.Hashtag > b.Hashtag)
             return 1;
           return 0;
         }
         hashtags.sort(compare);

         var merge = function(list) {
           var result = [];
           var store = {};
           var addables = ['Favorites', 'Retweets', 'Replies', 'Frequency', 'Engagement'];

           list.forEach(function(item) {
             // Check exist by hashtag.
             if (typeof store[item.Hashtag] === 'undefined') {
               // clone item, not alter origin list.
               store[item.Hashtag] = JSON.parse(JSON.stringify(item));
               result.push(store[item.Hashtag]);
             } else {
               var soruce = store[item.Hashtag];
               // Check if its already combined or not.
               if( Object.prototype.toString.call(soruce.tweetId) === '[object Array]') {
                 soruce.tweetId.push(item.tweetId);
               } else {
                 soruce.tweetId = [soruce.tweetId, item.tweetId];
               }
               // Add addable attributes.
               addables.forEach(function(key) {
                 soruce[key] += item[key];
               });
             }
           });

           return result;
         };
         $scope.hashtags=merge(hashtags);
         $scope.hashtagMaxEngagement = Math.max.apply( Math, $scope.hashtags.map(function(o){return o.Engagement;}));
         // Disable buttons if there are no hashtags to display
         if ($scope.hashtags === 0) {
            $scope.disableMore = true;
            $scope.disableLess = true;
         }
      }
      function getRepliesToTweet(id){
         var mentionsTimeline = $scope.mentionsTimeline,
            repliesCount = 0;

         for (var i = 0; i < mentionsTimeline.length; i++) {
            if (mentionsTimeline[i].in_reply_to_status_id_str === id) {
               repliesCount++;
            }
         }
         return repliesCount;
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

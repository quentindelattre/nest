'use strict';
var services = angular.module('nestApp.services', []);
services.factory('twitterService', function($q, $rootScope, $timeout) {
   // initialize TwitterAuth service
   var TwitterAuth = false;
   return {
      initialize: function() {
         // Set callback URL to localhost for Developement
         OAuth.setOAuthdURL('http://localhost:6284');
         //initialize OAuth Demon with public key of the application
         OAuth.initialize('t2URC7TqRzmRbkpdwDq0w12fyqU', {
            cache: true
         });
         //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
         TwitterAuth = OAuth.create('twitter');
      },
      isReady: function() {
         // Return boolean of twitter authorization state
         return (TwitterAuth);
      },
      connectTwitter: function() {
         var defer = $q.defer();
         OAuth.popup('twitter', {
            cache: true
         }, function(error, result) { //cache means to execute the callback if the tokens are already present
            if (!error) {
               TwitterAuth = result;
               defer.resolve();
            } else {
               //do something if there's an error
               defer.reject('Connexion failed', error);
            }
         });
         return defer.promise;
      },
      clearCache: function() {
         // Clear cache on logout to erase authentication token
         OAuth.clearCache('twitter');
         TwitterAuth = false;
      },
      getUser: function() {
         var defer = $q.defer();
         var promise = TwitterAuth.get('/1.1/account/verify_credentials.json').then(function(data) {
            // Calculate time to execute Nest with retrieved data
            setRemainingTime(data);
            // Set rootscope value for followers count
            $rootScope.totalFollowers = data.followers_count;
            //when the data is retrieved resolved the defer object
            defer.resolve(data);
         }, function(err) {
            // If session has expired
            console.log('waiting...');
            $timeout(getAuthUser, 300000); // Wait 5 minutes for new session
         });
         //return the promise of the defer object
         return defer.promise;
         function setRemainingTime(usr){
            // The total execution time depends on the amount of followers
            // We can execute 15 requests of 200 followers in a 15-minute window
            // Calculate how many minutes will be needed
            var minutes = Math.floor(((usr.followers_count / 12000) - Math.floor(usr.followers_count / 12000)) * 60);
            // Calculate how many hours will be needed
            var hours = Math.floor(usr.followers_count / 12000);
            // Set in rootscop to display while loadingView is active
            $rootScope.remaining = {
               h: hours,
               m: minutes
            };
         }
      },
      getFollowersActivity: function(usrId, cursor) {
         // Initiate empty array that will contain the user's followers
         var followersList = [];
         //create a main defer object using Angular's $q service
         var mainDefer = $q.defer();
         //Form request URL
         var baseURL = '/1.1/followers/list.json?';
         var params = ['count=200', 'user_id=' + usrId, 'skip_status=false'];
         params = params.join('&');
         // Bind the base URL and the query params
         var url = baseURL + params;
         var i = -1; // For dev purposes
         function updateRemainingTime() {
            var hours = $rootScope.remaining.h;
            var minutes = $rootScope.remaining.m;
            minutes--;
            if (hours>0) {
               if (minutes < 0) {
                  minutes = 60 + minutes;
                  hours--;
               }
            }else{
               if (minutes<0) {
                  minutes=0;
                  hours=0;
               }
            }
            $rootScope.remaining.h = hours;
            $rootScope.remaining.m = minutes;
            $rootScope.$apply();
         }
         function getFollowers(cursor) {
            i++; // For dev purposes
            // Update rootscope with current state of the promise
            $rootScope.progressFollowers = followersList.length;
            var defer = $q.defer();
            // console.log('current cursor: ' + cursor); // For dev purposes
            if (cursor || cursor === 0) {
               // console.log('run for cursor defined: ' + cursor); // For dev purposes
               // Replace cursor in URL query params with new cursor
               url = url.replace(/&cursor=[\d]*/gi, "");
               url += '&cursor=' + cursor;
               // console.log(url); // For dev purposes
               // if (i < 10) { // returns the last 1'000 followers for testing
               if (cursor!==0) { // Final condition
               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data) {
                  defer.resolve(data);
                  // Set new cursor according to last page's next_id
                  var newCursor = data.next_cursor;
                  // Update followers list with retrieved values
                  followersList = followersList.concat(data.users);
                  // Update timer
                  updateRemainingTime();
                  // Repeat function asynchronously
                  getFollowers(newCursor);
               }, function(err) {
                  // If session has expired
                  console.log('waiting...');
                  $timeout(getFollowers, 300000); // Wait 5 minutes for new session
               });
            } else {
               // console.log('getFollowersActivity over', followersList.length); // For dev purposes
               // Resolve main pormise
               mainDefer.resolve(followersList);
               return defer.promise;
            }
         } else {
            //Execute request for the first time
            // console.log('run for cursor undefined', url); // For dev purposes
            // Create promise
            var promise = TwitterAuth.get(url);
            promise.then(function(data) {
               defer.resolve(data);
               // Set first cursor for paging
               cursor = data.next_cursor;
               // console.log('cursor', cursor); // For dev purposes
               // Update followersList with retrieved values
               followersList = followersList.concat(data.users);
               // Update timer
               updateRemainingTime();
               // Repeat function asynchronously
               getFollowers(cursor);
            }, function(err) {
               console.log('waiting...');
               $timeout(getFollowers, 300000); // Wait 5 minutes for new session
            });
            return defer.promise;
         }
      }
      getFollowers();
      mainDefer.promise.then(function(data) {
         console.log('get followers activity success'); // For dev purposes
      });
      return mainDefer.promise;
   },
   getUserTimeline: function(usr, maxId) {
      var usrId = usr.id;
      var statusesCount = usr.statuses_count;
      var loops = Math.ceil(statusesCount/200);
      if (loops>16) {
         loops=16;
      }
      // Initiate empty array to collect user's tweets
      var timeline = [];
      //create a defer object using Angular's $q service
      var mainDefer = $q.defer();
      //Form request URL
      var baseURL = '/1.1/statuses/user_timeline.json?';
      var params = ['count=200', 'user_id=' + usrId];
      params = params.join('&');
      // Bind base URL and query params
      var url = baseURL + params;
      // set counter
      var i = -1;
      function getTweet(maxId) {
         i++;
         var defer = $q.defer();
         if (maxId) {
            // Replace cursor in URL query params with new cursor
            url = url.replace(/&max_id=[\d]*/gi, "");
            url += '&max_id=' + maxId;
            if (i < loops) { // 16 to get up to 3200 last tweets
               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data) {
                  defer.resolve(data);
                  // Set new maxId according to last tweet's id
                  var newMaxId = data[data.length - 1].id;
                  // Set new timeline with retrieved values
                  timeline = timeline.concat(data);
                  // Repeat function asynchronously
                  getTweet(newMaxId);
               }, function(err) {
                  console.log('waiting…');
                  $timeout(getTweet(), 300000); // Wait 5 minutes for new session
               });
               return defer.promise;
            } else {
               // resolve main promise
               mainDefer.resolve(timeline);
               return defer.promise;
            }
         } else {
            //Execute request for the first time
            // console.log('user timelin run for maxId undefined'); // For dev purposes
            // Create promise
            var promise = TwitterAuth.get(url);
            promise.then(function(data) {
               defer.resolve(data);
               // Set first maxId according to last tweet's id
               maxId = data[data.length - 1].id;
               // Set new timeline with retrieved values
               timeline = timeline.concat(data);
               // Repeat function asynchronously
               getTweet(maxId);
            }, function(err) {
               console.log('waiting…');
               $timeout(getTweet, 300000); // Wait 5 minutes for new session
            });
            return defer.promise;
         }
      }
      getTweet();
      mainDefer.promise.then(function(data) {
         console.log('get user timeline success');
      });
      return mainDefer.promise;
   },
   getMentionsTimeline: function(maxId) {
      // Initiate empty array to collect the mentions timeline
      var timeline = [];
      //create a defer object using Angular's $q service
      var mainDefer = $q.defer();
      //Form request URL
      var baseURL = '/1.1/statuses/mentions_timeline.json?';
      var params = 'count=200';
      // Bind base URL and params
      var url = baseURL + params;
      // set counter
      var i = -1;
      function getTweet(maxId) {
         i++;
         var defer = $q.defer();
         if (maxId) {
            // Replace cursor in URL query params with new cursor
            url = url.replace(/&max_id=[\d]*/gi, "");
            url += '&max_id=' + maxId;
            if (i < 2) { // 4 to get up to 800 last tweets
               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data) {
                  defer.resolve(data);
                  // Set new maxId according to last tweet's id
                  var newMaxId = data[data.length - 1].id;
                  // console.log('new maxId: '+newMaxId);
                  // Set new timeline with retrieved values
                  timeline = timeline.concat(data);
                  //Check timeline's new size (should be +200)
                  console.log('new timeline size : ' + timeline.length);
                  // Repeat function asynchronously
                  getTweet(newMaxId);
               }, function(err) {
                  console.log('waiting…');
                  $timeout(getTweet, 300000); // Wait 5 minutes for new session
               });
               return defer.promise;
            } else {
               console.log('Final timeline size: ' + timeline.length);
               // Resolve main promise
               mainDefer.resolve(timeline);
               return defer.promise;
            }
         } else {
            //Execute request for the first time
            console.log('mentions run for maxId undefined');
            // Create promise
            var promise = TwitterAuth.get(url);
            promise.then(function(data) {
               defer.resolve(data);
               // Set first maxId according to last tweet's id
               maxId = data[data.length - 1].id;
               // Set new timeline with retrieved values
               timeline = timeline.concat(data);
               // Repeat function asynchronously
               getTweet(maxId);
            }, function(err) {
               console.log('waiting…');
               $timeout(getTweet, 300000);
            });
            return defer.promise;
         }
      }
      getTweet();
      mainDefer.promise.then(function(data) {
         console.log('get mentions timeline success');
      });
      return mainDefer.promise;
   }
};
});

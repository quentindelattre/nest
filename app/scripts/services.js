'use strict';

var services = angular.module('nestApp.services', []);

services.factory('twitterService', function($q, $timeout) {

   var TwitterAuth = false;


   return {
      initialize: function() {
         OAuth.setOAuthdURL('http://localhost:6284');
         //initialize OAuth.io with public key of the application
         OAuth.initialize('t2URC7TqRzmRbkpdwDq0w12fyqU', {cache:true});
         //try to create an authorization result when the page loads, this means a returning user won't have to click the twitter button again
         TwitterAuth = OAuth.create('twitter');
      },
      isReady: function() {
         return (TwitterAuth);
      },
      connectTwitter: function() {
         var defer = $q.defer();
         OAuth.popup('twitter', {cache:true}, function(error, result) { //cache means to execute the callback if the tokens are already present
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
      getUser: function(){
         var defer = $q.defer();
         var promise = TwitterAuth.get('/1.1/account/verify_credentials.json').done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
            //when the data is retrieved resolved the defer object
            defer.resolve(data);
         });
         //return the promise of the defer object
         return defer.promise;
      },
      clearCache: function() {
         OAuth.clearCache('twitter');
         TwitterAuth = false;
      },
      getLatestTweets: function () {
         //create a defer object using Angular's $q service
         var defer = $q.defer();
         var promise = TwitterAuth.get('/1.1/statuses/home_timeline.json').done(function(data) { //https://dev.twitter.com/docs/api/1.1/get/statuses/home_timeline
            //when the data is retrieved resolved the defer object
            defer.resolve(data);
         });
         //return the promise of the defer object
         return defer.promise;
      },
      countFollowers: function (usrId) {
         //create a defer object using Angular's $q service
         // // console.log(scr_name);
         var defer = $q.defer(); // Create deffered object
         var promise = TwitterAuth.get('/1.1/users/show.json?id='+usrId);  // Create promise -> API Request
         promise.then(function(data){
            defer.resolve(data);
            // resolve retrieved data
         });
         return defer.promise;
      },
      getFollowersActivity: function (callback, usrId, cursor) {

         //user_id changed to account with more activity than @qntndlttr
         // usrId=9507972;
         var followersList=[];
         // console.log('user id: '+usrId);

         //create a defer object using Angular's $q service
         var defer = $q.defer();

         //Form request URL
         var baseURL = '/1.1/followers/list.json?';
         var params=['count=200','user_id='+usrId,'skip_status=false'];
         params=params.join('&');
         var url = baseURL+params;

         function getFollowers(cursor){
            console.log('current cursor: '+cursor);
            if (cursor || cursor===0) {
               console.log('run for cursor defined: '+cursor);
               url+='&cursor='+cursor;
               url = url.replace(/cursor=[\d]*/g, 'cursor='+cursor);
               // console.log(url);
               if (cursor!==0){ // Paginate until cursor is = 0

                  // Create promise
                  var promise = TwitterAuth.get(url);
                  promise.then(function(data){
                     defer.resolve(data);

                     // Set new cursor according to last page's next_id
                     var newCursor=data.nextCursor;
                     // console.log('new maxId: '+newMaxId);

                     // Update followers list with retrieved values
                     followersList=followersList.concat(data.users);

                     // Repeat function asynchronously
                     getFollowers(newCursor);
                  }, function(err){
                     // If session has expired
                     console.log('waiting...');
                     $timeout(getFollowers, 900000); // Wait 15 minutes for new session
                  });
                  return defer.promise;
               } else {
                  console.log('Game over', followersList.length);

                  // Callback function from controller
                  callback(followersList);
               }
            } else {
               //Execute request for the first time
               console.log('run for cursor undefined',url);

               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data){
                  defer.resolve(data);
                  // Set first cursor for paging
                  cursor=data.nextCursor;
                  console.log('cursor', cursor);
                  // Update followersList with retrieved values
                  followersList=followersList.concat(data.users);
                  // Repeat function asynchronously
                  getFollowers(cursor);
               }, function(err){
                  console.log('waiting...');
                  $timeout(getFollowers, 900000); // Wait 15 minutes for new session
               });
               return defer.promise;
            }
         }
         getFollowers();
      },
      getUserTimeline: function (callback, usrId, maxId) {

         //user_id changed to account with more activity than @qntndlttr
         // usrId=9507972;
         var timeline=[];
         // console.log('user id: '+usrId);

         //create a defer object using Angular's $q service
         var defer = $q.defer();

         //Form request URL
         var baseURL = '/1.1/statuses/user_timeline.json?';
         var params=['count=200','user_id='+usrId];
         params=params.join('&');
         var url = baseURL+params;

         // set counter
         var i=0;

         function getTweet(maxId){
            // console.log('run : '+i);
            // console.log('current maxId: '+maxId);
            if (maxId) {
               // console.log('run for maxId defined: '+maxId);
               if (i===1) {
                  url+='&maxId='+maxId;
               }
               url = url.replace(/maxId=[\d]*/g, 'maxId='+maxId);
               // console.log(url);
               if (i<0){ // to get up to 3200 last tweets

                  // Create promise
                  var promise = TwitterAuth.get(url);
                  promise.then(function(data){
                     // When request is done, increment counter
                     i++;
                     defer.resolve(data);

                     // Set new maxId according to last tweet's id
                     var newMaxId=data[data.length-1].id;
                     // console.log('new maxId: '+newMaxId);

                     // Set new timeline with retrieved values
                     timeline=timeline.concat(data);

                     //Check timeline's new size (should be +200)
                     // console.log('new timeline size : '+timeline.length);

                     // Repeat function asynchronously
                     getTweet(newMaxId);
                  });
                  return defer.promise;
               } else {
                  // console.log('Final timeline size: '+timeline.length);

                  // Callback function from controller
                  callback(timeline);
               }
            } else {
               //Execute request for the first time
               // console.log('run for maxId undefined');

               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data){
                  // When request is done, increment counter
                  i++;
                  defer.resolve(data);

                  // Set first maxId according to last tweet's id
                  maxId=data[data.length-1].id;

                  // Set new timeline with retrieved values
                  timeline=timeline.concat(data);

                  // Repeat function asynchronously
                  getTweet(maxId);
               });
               return defer.promise;
            }
         }

         getTweet();
      },
      getMentionsTimeline: function (callback, maxId) {

         //user_id changed to account with more activity than @qntndlttr
         // usrId=9507972;
         var timeline=[];

         //create a defer object using Angular's $q service
         var defer = $q.defer();

         //Form request URL
         var baseURL = '/1.1/statuses/mentions_timeline.json?';
         var params='count=200';
         var url = baseURL+params;

         // set counter
         var i=0;


         function getTweet(maxId){
            // console.log('run : '+i);
            // console.log('current maxId: '+maxId);
            if (maxId) {
               // console.log('run for maxId defined: '+maxId);
               if (i===1) {
                  url+='&maxId='+maxId;
               }
               url = url.replace(/maxId=[\d]*/g, 'maxId='+maxId);
               // console.log(url);
               if (i<0){ // to get up to 3200 last tweets

                  // Create promise
                  var promise = TwitterAuth.get(url);
                  promise.then(function(data){
                     // When request is done, increment counter
                     i++;
                     defer.resolve(data);

                     // Set new maxId according to last tweet's id
                     var newMaxId=data[data.length-1].id;
                     // console.log('new maxId: '+newMaxId);

                     // Set new timeline with retrieved values
                     timeline=timeline.concat(data);

                     //Check timeline's new size (should be +200)
                     // console.log('new timeline size : '+timeline.length);

                     // Repeat function asynchronously
                     getTweet(newMaxId);
                  });
                  return defer.promise;
               } else {
                  // console.log('Final timeline size: '+timeline.length);

                  // Callback function from controller
                  callback(timeline);
               }
            } else {
               //Execute request for the first time
               // console.log('run for maxId undefined');

               // Create promise
               var promise = TwitterAuth.get(url);
               promise.then(function(data){
                  // When request is done, increment counter
                  i++;
                  defer.resolve(data);

                  // Set first maxId according to last tweet's id
                  maxId=data[data.length-1].id;

                  // Set new timeline with retrieved values
                  timeline=timeline.concat(data);

                  // Repeat function asynchronously
                  getTweet(maxId);
               });
               return defer.promise;
            }
         }

         getTweet();
      }
   };
});

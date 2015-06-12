'use strict';

var services = angular.module('nestApp.services', []);

services.factory('twitterService', function($q, $timeout) {

	var tServ = {

		getBooks: function() {

			var promise = $http({ method: 'GET', url: 'api/books.php' }).success(function(data, status, headers, config) {
				return data;
			});

			return promise;

		},

		getMovies: function() {

			var promise = $http({ method: 'GET', url: 'api/movies.php' }).success(function(data, status, headers, config) {
				return data;
			});

			return promise;

		}

	}

	return tServ;

}]);

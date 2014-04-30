'use strict';

var app = angular.module('webMatch', ['ui.router', 'ngAnimate', 'ngSanitize']);
app.config(function($locationProvider, $stateProvider, $urlRouterProvider){
	$locationProvider.html5Mode(true);
	$urlRouterProvider.otherwise("/")
	  
	$stateProvider.state('index', { 
		url: "/",
		views : {
			'@' : {templateUrl :"/template/public/home.html", controller: 'loginCtrl'}
		}
	})
	.state('search', {
		url: "/search",
		views : {
			'@' : {templateUrl :"/template/public/search/list.html", controller: 'searchListCtrl'}
		},
		resolve: {
			promiseList:function(searchServices) {
				return searchServices.promiseList();
			}
		}
	})
	.state('profile', { 
		url: "/profile",
		views : {
			'@' : {templateUrl :"/template/public/profile.html", controller: 'profileCtrl'}
		}
	})
	.state('search.create', {
		url: "/new",
		views : {
			'@' : {templateUrl :"/template/public/search/create.html", controller: 'searchCreateCtrl'}
		},
		resolve: {
			promiseDetail:function(searchServices, $stateParams){
				return null;
			}
		}
	})
	.state('search.edit', {
		url: "/edit/{id:[0-9a-z]+}",
		views : {
			'@' : {templateUrl :"/template/public/search/create.html", controller: 'searchCreateCtrl'}
		},
		resolve: {
			promiseDetail:function(searchServices, $stateParams){
				return searchServices.promiseDetail($stateParams.id);
			}
		}
	})
	.state('search.detail', {
		url: "/{id}",
		views : {
			'@' : {templateUrl :"/template/public/search/detail.html", controller: 'searchDetailCtrl'}
		},
		resolve: {
			promiseDetail:function(searchServices, $stateParams){
				return searchServices.promiseDetail($stateParams.id);
			}
		}
	})
})


app.run(function ($rootScope, $state, $stateParams) {
		$rootScope.$on('$stateChangeStart', function(toState, toParams, fromState) { 
        	//console.info('Route Debug : [', fromState.name, '] to [', toState.name, '][', toParams, ']')
        });

  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
})



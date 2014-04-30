'use strict';

/* Services */

app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    getSocket: function() { return socket; },
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

app.factory('searchServices', function($http, $q, $location, $rootScope) {

    var searches = [];

    var startSocket = function(socket) {
      socket.on('init', function (message) {
        console.log('SOCKET : ', message)
      });

      socket.on('search:create', function (search) {
        addToList(search);
      });
      socket.on('search:delete', function (search) {
        removeFromList(search._id);
      });
      socket.on('search:update', function (search) {
        updateInList(search);
        $rootScope.$broadcast('updateSearch', {search : search._id});
      });
      socket.on('post:new', function (data) {
        addPostToList(data.search, data.post);
      });
    };

    var promiseList = function() {
      if (!window.isAuthenticated)
        return $location.path('/');

      var defer = $q.defer();

      $http.get('/api/search').success(function (data) {
        if (!data.success)
        {
          searches = [];
          defer.resolve(false);
        }
        else
        {
          searches = data.list
          defer.resolve(data.list);
        }
      }).error(function() {
        searches = [];
      });

      return defer.promise;
    };

    var promiseDetail = function(id) {
      if (!window.isAuthenticated)
        return $location.path('/');

      var defer = $q.defer();

      $http.get('/api/search/' + id).success(function (data) {
        if (!data.success)
        {
          defer.resolve(false);
        }
        else
        {
          updateInList(data.search);
          defer.resolve(data.search);
        }
      });
      
      return defer.promise;
    };

    
    var updateInList = function (search) {
      for (var i in searches)
        if (searches[i]._id == search._id)
        {
          searches[i] = search;
        }
    };

    var setList = function (list) {
        searches = data;
    };

    var getList = function () {
        return searches;
    };

    var removeFromList = function (id) {
        for (var i in searches)
        {
          if (searches[i]._id == id)
          {
            searches.splice(i, 1);
            break ;
          }
        }
    };

    var getFromList = function (id) {
        for (var i in searches)
        {
          if (searches[i]._id == id)
          {
            return (searches[i]);
          }
        }
    };

    var addToList = function (search) {
      searches.unshift(search);
    };

    var addPostToList = function (search, post) {
      for (var i in searches)
      {
        if (searches[i]._id == search._id)
        {
          var test = true;
          for (var j in searches[i].posts)
            if (searches[i].posts[j]._id == post._id)
              test = false;
          if (test)
            searches[i].posts.unshift(post);
          break ;
        }
      }
      
    };

    var ret = {
      promiseList:promiseList,
      promiseDetail:promiseDetail,
      setList: setList,
      getList: getList,
      getFromList: getFromList,
      removeFromList: removeFromList,
      addToList: addToList,
      updateInList: updateInList,
      startSocket:startSocket
    };

    return (ret);
});

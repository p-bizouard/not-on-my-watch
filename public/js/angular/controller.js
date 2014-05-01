'use strict';

app.controller('loginCtrl', function($scope, $rootScope, $http) {

  $rootScope.$on('$locationChangeSuccess', function(evt) {
      $scope.signInMessage = '';
  });

  $scope.submitSignin = function() {
    $scope.signInMessage = '';
    $http.post('/user/signin', $scope.formSigninData)
      .success(function(data) {
        if (!data.success) {
          $scope.signInMessage = data.message;

        } else {
          if ($scope.formSigninData.login_state == 'reset')
          {
            $scope.signInMessage = data.message;
            $scope.signInMessageType = 'success';
          }
          else
          {
            $rootScope.$broadcast('userAuthenticates', {setTo : true});
            $scope.isAuthenticated = window.isAuthenticated = true;

            $scope.userEmail = window.userEmail = $scope.formSigninData.email;
            $rootScope.$state.go('search');
          }
        }
      });
  };

  $scope.submitSignup = function() {
    $http.post('/user/signup', $scope.formSignupData)
      .success(function(data) {
          $scope.errorEmailExists = undefined;
        if (!data.success) {
          if (data.errors.email)
            $scope.errorEmailExists = data.errors.email.message;
        } else {
          $rootScope.$broadcast('userAuthenticates', {setTo : true});
          $scope.isAuthenticated = window.isAuthenticated = true;

          $scope.userEmail = window.userEmail = $scope.formSignupData.email;
          $rootScope.$state.go('search');
        }
      });
  };

  $scope.submitProfile = function() {
    $scope.signInMessage = '';
    $http.post('/user/profile', $scope.formSignupData)
      .success(function(data) {
          $scope.errorEmailExists = undefined;
        if (!data.success) {
          if (data.message)
            $scope.errorEmailExists = data.message;
        } else {
            $scope.signInMessage = data.message;
            $scope.signInMessageType = 'success';
            $scope.userEmail = window.userEmail = $scope.formSignupData.email;
        }
      });
  };

  if (window.isAuthenticated)
  {
    //$rootScope.$state.go('search');
  }

  $scope.formSignupData = {};
  $scope.formSigninData = {};

  $scope.isAuthenticated = window.isAuthenticated;
  $scope.userEmail = window.userEmail;

});


app.controller('profileCtrl', function($scope, $http) {

  $scope.submitProfile = function() {
    $scope.signInMessage = '';
    $http.post('/user/profile', $scope.formProfileData)
      .success(function(data) {
          $scope.errorEmailExists = undefined;
        if (!data.success) {
          if (data.message)
            $scope.errorEmailExists = data.message;
        } else {
            $scope.signInMessage = data.message;
            $scope.signInMessageType = 'success';
            $scope.userEmail = window.userEmail = $scope.formProfileData.email;
        }
      });
  };

  $scope.formProfileData = {};

  $scope.isAuthenticated = window.isAuthenticated;
  $scope.userEmail = window.userEmail;

});


app.controller('searchListCtrl', function($scope, $rootScope, $http, searchServices, socket) {
  $scope.searches = searchServices.getList();

  searchServices.startSocket(socket);
});

app.controller('searchDetailCtrl', function($scope, $rootScope, $http, $stateParams, $sce, searchServices, promiseDetail, socket) {

  if (!promiseDetail)
    return ($rootScope.$state.go('search'));

  searchServices.startSocket(socket);

  $scope.search = promiseDetail;

  $scope.pagination = {current: 0, length: Math.ceil($scope.search.posts.length / 20), limit : 20};

  $scope.$on('updateSearch', function(event, args) {
    $scope.search = searchServices.getFromList($scope.search._id);
  });


  /**
   * Ng-click
   */
  $scope.markAllRead = function() {
    for (var i in $scope.search.posts)
      if ($scope.search.posts_read.indexOf($scope.search.posts[i]._id) == -1)
        $scope.search.posts_read.push($scope.search.posts[i]._id);

    $http.put('/api/search/' + $stateParams.id, { 'socketId' : socket.getSocket().socket.sessionid, 'allRead': true, '_csrf': $scope._csrf}).success(function(data) {
      $scope.messageGlobal.message = undefined;
      if (!data.success && data.message)
        $scope.messageGlobal.message = data.message;
    }).error(function() {
      $scope.messageGlobal.message = 'An error occured';
    });
  };

  $scope.switchSearchFav = function() {
    $scope.search.favorite = $scope.search.favorite == 1 ? 0 : 1;

    $http.put('/api/search/' + $stateParams.id, { 'socketId' : socket.getSocket().socket.sessionid, 'favorite': $scope.search.favorite, '_csrf': $scope._csrf}).success(function(data) {
      $scope.messageGlobal.message = undefined;
      if (!data.success && data.message)
        $scope.messageGlobal.message = data.message;
    }).error(function() {
      $scope.messageGlobal.message = 'An error occured';
    });
  };

  $scope.switchPostFav = function(post, $event) {
    var http_data = {'socketId' : socket.getSocket().socket.sessionid, '_csrf': $scope._csrf};
    var indexOf = -1;

    if ((indexOf = $scope.search.posts_favorite.indexOf(post._id)) == -1)
    {
      http_data.pushPostFav = post._id;
      $scope.search.posts_favorite.push(post._id);
    }
    else
    {
      $scope.search.posts_favorite.splice(indexOf, 1);
      http_data.pullPostFav = post._id;
    }

    $http.put('/api/search/' + $stateParams.id, http_data).success(function(data) {
      if (!data.success && data.message)
        $scope.messageGlobal = {type: 'error', message: data.message};
    }).error(function() {
      $scope.messageGlobal = {type: 'error', message: 'An error occured'};
    });
  }

  $scope.showPost = function(post, $event) {
    $($event.target).parents('.panel').find('.panel-body').toggle();

    // if not cached
    if (!post.body)
    {
      if ($scope.search.posts_read.indexOf(post._id) == -1)
        $scope.search.posts_read.push(post._id);
      
      // we get the content
      $http.get('/api/search/' + $stateParams.id + '/post/' + post._id, {'_csrf': $scope._csrf}).success(function(data) {
        if (!data.success && data.message)
          $scope.messageGlobal = {type: 'error', message: data.message};
        else
        {
          // we set ie read localy
          var regex = new RegExp($scope.search.regex, "gi");
          post.body = $sce.trustAsHtml(data.post.body.replace(regex, '<font color="red" size="5">$1</font>'));

          // but if it is not readed, we put it to the server
          if (data.is_read == false)
          {
            $http.put('/api/search/' + $stateParams.id, {'socketId' : socket.getSocket().socket.sessionid, pushPostRead: post._id, '_csrf':$scope._csrf} ).success(function(data) {
              if (!data.success && data.message)
                $scope.messageGlobal = {type: 'error', message: data.message};
            }).error(function() {
              $scope.messageGlobal = {type: 'error', message: 'An error occured'};
            });
          }
        }
      }).error(function() {
        $scope.messageGlobal = {type: 'error', message: 'An error occured'};
      });
    }
  }

  $scope.changePage = function(page) {
    if (page >= 0 && page < $scope.pagination.length)
      $scope.pagination.current = page
  }

  /**
   * Filters
   */
  $scope.filterFavs = function(isFav) {
    return function(post) {
      if (isFav)
        return ($scope.search.posts_favorite.indexOf(post._id) > -1);
      else
        return ($scope.search.posts_favorite.indexOf(post._id) == -1);
    };
  }

  /**
   * ng-repeat helper
   */
  $scope.range = function(n) {
      return new Array(n);
  };



  /**
   * Watchs
   */
  $scope.$watch("search.posts.length", function(newValue, oldValue) {
    $scope.pagination.length = Math.ceil($scope.search.posts.length / $scope.pagination.limit);
  });
  $scope.$watch("_csrf", function(newValue, oldValue) {
    if ($scope.search.is_alerted)
    {
      $scope.search.is_alerted = false;
      $http.put('/api/search/' + $stateParams.id, { 'socketId' : socket.getSocket().socket.sessionid, search: {is_alerted: $scope.search.is_alerted}, '_csrf': $scope._csrf}).success(function(data) {
        $scope.messageGlobal.message = undefined;
        if (!data.success && data.message)
          $scope.messageGlobal.message = data.message;
      }).error(function() {
        $scope.messageGlobal.message = 'An error occured';
      });
    }
  });


});


app.controller('searchCreateCtrl', function($scope, $rootScope, $http, $stateParams, searchServices, promiseDetail, socket) {

  searchServices.startSocket(socket);

  var search_update_attr = ['_id', 'title', 'email_alert', 'filter', 'active', 'test_regex'];

  if ($stateParams.id == undefined)
  {
    $scope.search = {
      _id:undefined,
      title:'',
      email_alert: 'no',
      filter:'',
      active: 1,
      test_regex: 'You can test your search here.\nYou should copy/paste a text containing your keywords.'
    }
  }
  else
    $scope.search = promiseDetail;

  $scope.test_regex_onerror = false;
  /**
   * Ng-click
   */
  $scope.save = function() {
    var http_method = $stateParams.id == undefined ? $http.post : $http.put;
    
    var data_search = {};
    for (var i in search_update_attr)
      data_search[search_update_attr[i]] = $scope.search[search_update_attr[i]];

    http_method('/api/search' + ($stateParams.id == undefined ? '' : '/' + $stateParams.id), {'socketId' : socket.getSocket().socket.sessionid, '_csrf' : $scope._csrf, search: data_search} )
      .success(function(data) {
        $scope.messageGlobal.message = undefined;
        if (!data.success)
        {
          if (data.message)
          {
            $scope.messageGlobal.type = 'error';
            $scope.messageGlobal.message = data.message;
          }
        }
        else
        {
          if ($stateParams.id == undefined)
          {
            searchServices.addToList(data.search);
            $rootScope.$state.go('search.detail', {id:data.search._id});
          }
          else
          {
            $scope.messageGlobal.type = 'success';
            $scope.messageGlobal.message = data.message;
          }
        }
      });
  }

  $scope.deleteSearch = function() {
    if (!confirm('Are you sure ?'))
      return ;
    
    $http.delete('/api/search/' + $stateParams.id, {data: {'socketId' : socket.getSocket().socket.sessionid}, headers : {'x-csrf-token' : $scope._csrf } }).success(function(data) {
      $scope.messageGlobal.message = data.message;
      if (!data.success) {
        if (data.message)
          $scope.messageGlobal.message = data.message;
      } else {
          searchServices.removeFromList($stateParams.id);
          $rootScope.$state.go('search');
      }
    }).error(function() {
      $scope.messageGlobal.message = 'An error occured';
    });
  };

  /**
   * ng-keyup
   */
  $scope.check_regex = function() {
    var regex = new RegExp($scope.getRegexFromFilter($scope.search.filter), 'i');
    if (regex.test($scope.search.test_regex.replace(/(\r|\n)/mg, ' ')))
      $scope.test_regex_onerror = false;
    else
      $scope.test_regex_onerror = true;
  }

  /**
   * Static method
   */
  $scope.getRegexFromFilter = function(filter) {
    var regex = '';
    var prepare_regex = '(' + filter + ')';
    var regex_split = prepare_regex.split(/(ET|OU|AND|OR|\(|\))/i);

    for (var i in regex_split)
      if (!regex_split[i].match(/^\s*$/))
      {
        regex_split[i] = regex_split[i].replace(/^\s+|\s+$/g, "")
        if (regex_split[i].match(/^(ET|OU|AND|OR|\(|\))$/i))
        {
          regex_split[i] = regex_split[i].replace(/ET|AND/i, '')
          regex_split[i] = regex_split[i].replace(/OU|OR/i, '|')
        }
        else
        {
          regex_split[i] = regex_split[i].replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
          regex_split[i] = '(\\b' + regex_split[i] + '\\b)'
        }
        regex += regex_split[i]
      }

    return regex
  }
});

app.controller('headerCtrl', function($scope, $rootScope) {

  $scope.navbarMenuDisplay = 'block';
  $scope.isAuthenticated = window.isAuthenticated;

  $scope.$on('userAuthenticates', function(event, args) {
    $scope.isAuthenticated = args.setTo;
  });

  $scope.isActive = function(reg) {
    var regex = new RegExp(reg);
    return (regex.test($rootScope.$state.current.name));
  }

});
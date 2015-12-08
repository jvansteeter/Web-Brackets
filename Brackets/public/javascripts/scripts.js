var blogApp = angular.module('blogApp', []);

blogApp.service('Credentials', function($window)
{
    var credService = {};

    credService.getUsername = function()
    {
        var myData = $window.sessionStorage.getItem("user");
        return myData;
    };
    credService.getPassword = function()
    {
        var myData = $window.sessionStorage.getItem("password");
        return myData;
    };
    credService.setUsername = function(name)
    {
        $window.sessionStorage.setItem("user", name);
    };
    credService.setPassword = function(secret)
    {
        $window.sessionStorage.setItem("password", secret);
    };
    return credService;
});

blogApp.factory('auth', ['$http', '$window', function($http, $window)
{
  var auth = {};

  auth.saveToken = function (token)
  {
    $window.localStorage['brackets-token'] = token;
  };

  auth.getToken = function ()
  {
    return $window.localStorage['brackets-token'];
  };

  auth.isLoggedIn = function()
  {
    var token = auth.getToken();

    if(token)
    {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    }
    else
    {
      return false;
    }
  };

  auth.currentUser = function()
  {
    if(auth.isLoggedIn())
    {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.username;
    }
  };

  auth.register = function(user)
  {
    return $http.post('api/auth/register', user).success(function(data)
    {
      auth.saveToken(data.token);
    });
  };

  auth.login = function(user)
  {
    return $http.post('/api/auth/login/local', user).success(function(data)
    {
      auth.saveToken(data.token);
    });
  };

  auth.loginFacebook = function()
  {
    return $http.get('/api/auth/login/local').success(function(data)
    {
      console.log("<Facebook Data>: " + data);
      //auth.saveToken(data.token);
    });
  };

  auth.logout = function()
  {
    $window.localStorage.removeItem('brackets-token');
  };

  return auth;
}]);

blogApp.controller('headerControl', function($scope, Credentials) 
{
  var userName = Credentials.getUsername();
  $scope.title = userName + "'s Blog";
});

blogApp.controller('blogControl', function($scope, $window, $http, Credentials, auth) 
{
  $scope.searchInput = "";
  $scope.title = Credentials.getUsername();
  posts = [];

  var post1 = { 
    title: "Welcome to the CS201R Blog",
    body: "Please feel free to check our new blog website.  Everything should be pretty straight forward.  You are currently on the homepage which displays all posts that have been posted to our server.  Click on 'My Posts' to see only posts you have made.",
    date: "31 October 2015",
    author: "System",
    tags: [
      "test",
      "stuff",
      "blogs",
      "cats"
    ]
  };
  var url = "getAllPosts?u=" + Credentials.getUsername() + "&p=" + Credentials.getPassword();
  /*console.log(url);
  $http.get(url).success(function(data)
  {
    // console.log(data);
    // var author = data[k]["_id"];
    // var entries = data[k]['entry'];
    for(var i = 0; i < data.length; i++)
    {
      var post = {
        "author" : data[i]['author'],
        "title" : data[i]['title'],
        "date" : data[i]['date'],
        "tags" : data[i]['tags'],
        "body" : data[i]['body']
      };
      posts.push(post);
    }
  });*/
  posts.push(post1);
  $scope.posts = posts;

//-------------------------------------------------------------------------
//  Brakcets DEV Section
//-------------------------------------------------------------------------

  $scope.testUser = function()
  {
    var data = {
        "title": "Test Tournament"
      };

    return $http.post('/api/testUser', data).success(function(response)
    {
      console.log("Test response: " + response);
    });
  };

  $scope.createTournament = function()
  {
    var data = {
      "title": "Test Tournament"
    };

    $http.post('/api/tournament/create', data, { headers: { Authorization: 'Bearer '+auth.getToken() }}).success(function(response)
    {
      console.log("Successfully created tournament: " + response);
    });
  }

//-------------------------------------------------------------------------
//  End DEV
//-------------------------------------------------------------------------

  $scope.logout = function()
  {
    //auth.logout();
    $https.get('api/auth/logout').success(function (response)
    {
      console.log("Successfully logged out: " + response);
      $window.location.href = "login.html";
    })
  };

});

blogApp.controller('loginControl', function($scope, $window, $http, Credentials, auth) 
{
    $scope.usernameInput = "";
    $scope.passwordInput = "";
    $scope.loginInfo;
    
    $scope.login = function()
    {
      console.log("login username =" + $scope.usernameInput);
      if ($scope.usernameInput === "")
      {
        $scope.loginInfo = "Username is blank";
        return;
      }
      if ($scope.passwordInput === "")
      {
        $scope.loginInfo = "Password is blank";
        return;
      }

      var url = "api/users/login";
      console.log(url);
      var user =  {
                  "username" : $scope.usernameInput,
                  "password" : $scope.passwordInput
                };
      auth.login(user).success(function(data)
      {
        console.log("Successfully logged in");
        $window.location.href = "index.html";
      });
    };

    $scope.createUser = function()
    {
      if ($scope.usernameInput === "")
      {
        $scope.loginInfo = "Username is blank";
        return;
      }
      if ($scope.passwordInput === "")
      {
        $scope.loginInfo = "Password is blank";
        return;
      }

      var url = "api/users/register";
      var data = {
          "username" : $scope.usernameInput,
          "password" : $scope.passwordInput
      };
      auth.register(data).success(function(data)
      {
        console.log("Successfully registered user");
        $window.location.href = "index.html";
      });
    }    
});

/*blogApp.controller('newPostControl', function($scope, $window, $http, Credentials, auth) 
{
  $scope.postTitle = "";
  $scope.tags = "";
  $scope.postBody = "";
  $scope.newPostInfo = "";
  $scope.title = Credentials.getUsername();
  var time = new Date();
  var data = {};

  $scope.submitNewPost = function()
  {
    console.log("submit new post");
    if($scope.postTitle === "")
    {
      $scope.newPostInfo = "Post Title cannot be Blank";
      return;
    }
    else if($scope.tags === "")
    {
      $scope.newPostInfo = "Must have at least one tag";
      return;
    }

    var tagList = $scope.tags.split(" ");
    var data =  {
                  "author" : Credentials.getUsername(),
                  "title" : $scope.postTitle,
                  "date" : time.getTime(),
                  "tags" : tagList,
                  "body" : $scope.postBody
                };
    var url = "api/createNewPost";
    $http.post(url, data, { headers: { Authorization: 'Bearer '+auth.getToken() }} ).success(function(response)
    {
      console.log("post=" + response);
      $window.location.href = "index.html";
    });
  };
});*/

$(document).ready(function(){$('#sidebar').affix({
    offset: {
      top: 240
    }
  });
});
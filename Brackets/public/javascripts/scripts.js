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

blogApp.controller('headerControl', function($scope, Credentials) 
{
  var userName = Credentials.getUsername();
  $scope.title = userName + "'s Blog";
});

blogApp.controller('blogControl', function($scope, $window, $http, Credentials) 
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
  console.log(url);
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
  });
  posts.push(post1);
  $scope.posts = posts;

  $scope.search = function()
  {
    $scope.posts = [];
    console.log("searching");
    var tags = $scope.searchInput.split(' ');
    var url = "search?u=" + Credentials.getUsername() + "&p=" + Credentials.getPassword();
    for(var i = 0; i < tags.length; i++)
    {
      url += "&q=" + tags[i];
    }
    console.log(url);
    $http.get(url).success(function(data)
    {
      // console.log(data);
      for(var i = 0; i < data.length; i++)
      {
        var post = {
          "author" : data[i]['author'],
          "title" : data[i]['title'],
          "date" : data[i]['date'],
          "tags" : data[i]['tags'],
          "body" : data[i]['body']
        };
        $scope.posts.push(post);
      }
    });
  };
});

blogApp.controller('myPostsControl', function($scope, $window, $http, Credentials) 
{
  $scope.posts = [];
  $scope.searchInput = "";
  $scope.title = Credentials.getUsername();

  var url = "getMyPosts?u=" + Credentials.getUsername() + "&p=" + Credentials.getPassword();
  console.log(url);
  $http.get(url).success(function(data)
  {
    // console.log(data);
    //var entries = data[0]['entry'];
    if (data.length === 0)
    {
      var post = {
        "title" : "You Have No Entries",
        "tags" : ["new", "entry"],
        "body" : "To create posts click on Create New Post"
      };
      $scope.posts.push(post);
    }
    for(var i = 0; i < data.length; i++)
    {
      var post = {
        "title" : data[i]['title'],
        //"date" : data[i]['data'],
        "tags" : data[i]['tags'],
        "body" : data[i]['body']
      };
      $scope.posts.push(post);
      //$scope.posts.reverse();
    }
  });

  $scope.search = function()
  {
    $scope.posts = [];
    console.log("searching");
    var tags = $scope.searchInput.split(' ');
    var url = "searchMyPosts?u=" + Credentials.getUsername() + "&p=" + Credentials.getPassword();
    for(var i = 0; i < tags.length; i++)
    {
      url += "&q=" + tags[i];
    }
    console.log(url);
    $http.get(url).success(function(data)
    {
      // console.log(data);
      for(var i = 0; i < data.length; i++)
      {
        var post = {
          "author" : data[i]['author'],
          "title" : data[i]['title'],
          "date" : data[i]['date'],
          "tags" : data[i]['tags'],
          "body" : data[i]['body']
        };
        $scope.posts.push(post);
      }
    });
  };
});

blogApp.controller('loginControl', function($scope, $window, $http, Credentials) 
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
      var data =  {
                  "username" : $scope.usernameInput,
                  "password" : $scope.passwordInput
                };
      $http.post(url, data).success(function(data)
      {
        console.log(data);
        if(data.length === 0)
        {
          $scope.loginInfo = "Server Error";
        }
        else if(data === "Invalid Username")
          $scope.loginInfo = data;
        else if(data === "true")
        {
          Credentials.setUsername($scope.usernameInput);
          Credentials.setPassword($scope.passwordInput);
          $window.location.href = "index.html";
        }
        else if(data === "false")
          $scope.loginInfo = "Invalid Password";
        else
          $scope.loginInfo = "Unknown Error";
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
      $http.post(url, data).success(function(data)
      {
          if(data === "OK")
          {
              $scope.loginInfo = "User created";
          }
          else
              $scope.loginInfo = data;
      });
    }    
});

blogApp.controller('newPostControl', function($scope, $window, $http, Credentials) 
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
                  "title" : $scope.postTitle,
                  "date" : time.getTime(),
                  "tags" : tagList,
                  "body" : $scope.postBody
                };
    var url = "createNewPost?u=" + Credentials.getUsername() + "&p=" + Credentials.getPassword();
    $http.post(url, data).success(function(response)
    {
      console.log("post=" + response);
      $window.location.href = "index.html";
    });
  };
});

$(document).ready(function(){$('#sidebar').affix({
    offset: {
      top: 240
    }
  });
});
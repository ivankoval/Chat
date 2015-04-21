/**
 * Created by Ivan on 17.04.15.
 */

//$(function() {
//    var curr = getUrlParameter('curr');
//    var conv = getUrlParameter('conv');
//
//    var chatManager = new ChatManager();
//    chatManager.init(curr, conv);
//});

'use strict';

var app = angular.module('Chat', []);

app.config(function($locationProvider){
   $locationProvider.html5Mode({
       enabled: true,
       requireBase: false
   });
});

app.controller('AppController', ['$http', '$location', '$interval', '$rootScope', '$scope',
    function($http, $location, $interval, $rootScope, $scope){
    $rootScope.userId = $location.search()['userId'];
    $rootScope.userRole = undefined;
    $rootScope.usersList = [];
    $scope.groupNames = [];
    $rootScope.headers =  {'Content-Type': 'application/x-www-form-urlencoded',
        'X-Parse-Application-Id': 'SSzU4YxI6Z6SwvfNc2vkZhYQYl86CvBpd3P2wHF1',
        'X-Parse-REST-API-Key': 'pKDap5jqe7lyBG5vTRgvTz7t8AiRWXpMYbuS2oak'
    };

    $http({
        method: 'GET',
        url: 'https://api.parse.com/1/users/' + $rootScope.userId,
        headers: $rootScope.headers
    }).success(function(data){
        data.userRole ? $rootScope.userRole = data.userRole : $rootScope.userRole = "user";
        if($rootScope.userRole == 'user') {
            $http({
                method: 'GET',
                url: 'https://api.parse.com/1/classes/UserLink',
                headers: $rootScope.headers,
                params: {
                    where: {
                        userId: $rootScope.userId
                    }
                }
            }).success(function(data){
                var currentGroup = {
                    groupName: 'Doctors',
                    users: []
                };
                for(var i = 0; i < data.results.length; i++){
                   var object = data.results[i];
                    $http({
                       method: 'GET',
                       url: 'https://api.parse.com/1/classes/UserGroup/' + data.results[i].groupId,
                       headers: $rootScope.headers
                   }).success(function(data) {
                        currentGroup.users.push(data.ownerId);
                        console.log('yep');
                   });
                }
                $rootScope.usersList.push(currentGroup);
                console.log($rootScope.usersList[0].users.length)
            });
        }
        else {
            $http({
                method: 'GET',
                url: 'https://api.parse.com/1/classes/UserGroup',
                headers: $rootScope.headers,
                params: {
                    where: {
                        ownerId: $rootScope.userId
                    }
                }
            }).success(function(data){
                for(var i = 0; i < data.results.length; i++){
                    var object = data.results[i];
                    $scope.groupNames[object.objectId] = object.name;
                    $http({
                        method: 'GET',
                        url: 'https://api.parse.com/1/classes/UserLink',
                        headers: $rootScope.headers,
                        params: {
                            where: {
                                groupId: object.objectId
                            }
                        }
                    }).success(function(data) {
                        if(data.results.length != 0) {
                            var currentGroup = {
                                groupName: $scope.groupNames[data.results[0].groupId],
                                users: []
                            };
                            for(var i = 0; i < data.results.length; i++){
                                currentGroup.users.push(data.results[i].userId);
                            }
                            $rootScope.usersList.push(currentGroup);
                        }
                    });
                }
            });
        }
    });

}]);

app.directive('appGroup', function() {
    return {
        restrict: 'E',
        scope: {
            group: '='
        },
        templateUrl: 'app-group.html'
    }
});

app.directive('appUser', function() {
    return {
        restrict: 'E',
        scope: {
            user: '='
        },
        templateUrl: 'app-user.html',
        controller: function($http, $rootScope, $scope) {
            $http({
                method: 'GET',
                url: 'https://api.parse.com/1/users/' + $scope.user,
                headers: $rootScope.headers
            }).success(function(data) {
                $scope.username = data.username;
            });
        },
        controllerAt: 'user'
    }
});
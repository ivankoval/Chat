/**
 * Created by Ivan on 17.04.15.
 */

'use strict';

var app = angular.module('Chat', ['luegg.directives']);

app.config(function($locationProvider){
   $locationProvider.html5Mode({
       enabled: true,
       requireBase: false
   });
});

app.controller('AppCtrl', ['$http', '$location', '$rootScope', '$scope', function($http, $location, $rootScope, $scope){
    $rootScope.userLink = 'https://api.parse.com/1/classes/UserLink/';
    $rootScope.userGroup = 'https://api.parse.com/1/classes/UserGroup/';
    $rootScope.CardioMoodChat = 'https://api.parse.com/1/classes/CardioMoodChat/';
    $rootScope.users = 'https://api.parse.com/1/users/';

    $rootScope.headers =  {'Content-Type': 'application/x-www-form-urlencoded',
        'X-Parse-Application-Id': 'SSzU4YxI6Z6SwvfNc2vkZhYQYl86CvBpd3P2wHF1',
        'X-Parse-REST-API-Key': 'pKDap5jqe7lyBG5vTRgvTz7t8AiRWXpMYbuS2oak'
    };

    $rootScope.userId = $location.search()['userId'];
    $scope.userRole = undefined;

    $rootScope.chatList = [];

    $scope.groupNames = [];

    //get role by user id
    $http.get($rootScope.users + $rootScope.userId, {headers: $rootScope.headers}).success(function(data) {

        data.userRole ? $rootScope.userRole = data.userRole : $rootScope.userRole = "user";

        if($rootScope.userRole == 'user') {

            //get groups of current user
            $http.get($rootScope.userLink, {headers: $rootScope.headers, params: {where: {userId: $rootScope.userId}}}
            ).success(function(data) {
                var currentGroup = {
                    groupName: 'Doctors',
                    users: [],
                    lastMessageTime: '1970-01-01T0:00:00Z'
                };

                for(var i = 0; i < data.results.length; i++){
                    (function(){
                        var userLink = data.results[i];

                        //get doctor of current group
                        $http.get($rootScope.userGroup + userLink.groupId, {headers: $rootScope.headers}).success(function(data) {
                            var ownerId  = data.ownerId;

                            $http.get($rootScope.CardioMoodChat, {headers: $rootScope.headers, params: {where: {$or: [{fromId: $rootScope.userId, toId: ownerId},
                                {fromId: ownerId, toId: $rootScope.userId}]}}}).success(function(data) {

                                if(data.results.length != 0) {
                                    currentGroup.users.push({
                                        id: ownerId,
                                        lastMessageTime: data.results[data.results.length-1].createdAt
                                    });
                                }
                                else {
                                    currentGroup.users.push({
                                        id: ownerId,
                                        lastMessageTime: '1970-01-01T0:00:00Z'
                                    });
                                }
                            });
                        });
                    })();
                }
                $rootScope.chatList.push(currentGroup);
            });
        }
        else {
            //get groups of current doctor
            $http.get($rootScope.userGroup, {headers: $rootScope.headers, params: {where: {ownerId: $rootScope.userId}}}
            ).success(function(data) {

                for(var i = 0; i < data.results.length; i++) {
                    (function(){

                        var groups = data.results[i];
                        var latest = '1970-01-01T0:00:00Z';

                        $scope.groupNames[groups.objectId] = groups.name;

                        //get users of current group
                        $http.get($rootScope.userLink, {headers: $rootScope.headers, params: {where: {groupId: groups.objectId}}}
                        ).success(function(data) {
                            if(data.results.length != 0) {

                                var currentGroup = {
                                    groupName: $scope.groupNames[data.results[0].groupId],
                                    users: [],
                                    lastMessageTime: '1970-01-01T0:00:00Z'
                                };

                                for(var t = 0; t < data.results.length; t++) {
                                    (function(){
                                        var userId = data.results[t].userId;

                                        $http.get($rootScope.CardioMoodChat, {headers: $rootScope.headers, params: {where: {$or: [{fromId: $rootScope.userId, toId: userId},
                                            {fromId: userId, toId: $rootScope.userId}]}}}).success(function(data) {


                                            if(data.results.length != 0) {
                                                currentGroup.users.push({
                                                    id: userId,
                                                    lastMessageTime: data.results[data.results.length - 1].createdAt
                                                });

                                                if(data.results[data.results.length - 1].createdAt > latest) {
                                                    latest = data.results[data.results.length-1].createdAt;
                                                    currentGroup.lastMessageTime = latest;
                                                }

                                            }
                                            else {
                                                currentGroup.users.push({
                                                    id: userId,
                                                    lastMessageTime: '1970-01-01T0:00:00Z'
                                                });
                                            }
                                        });
                                    })();
                                }
                                $rootScope.chatList.push(currentGroup);
                            }
                        });
                    })();
                }
            });
        }
    });
}]);

app.controller('ChatCtrl', ['$http', '$timeout', '$interval', '$rootScope', '$scope',
    function($http, $timeout, $interval, $rootScope, $scope) {

    $scope.lastMessageTime = '1970-01-01T0:00:00Z';
    $scope.sendMessage = '';
    $scope.messages = [];
    $scope.intervals = [];
    $rootScope.messagesIsRead = [];

    $scope.headerss =  {'Content-Type': 'application/json',
       'X-Parse-Application-Id': 'SSzU4YxI6Z6SwvfNc2vkZhYQYl86CvBpd3P2wHF1',
       'X-Parse-REST-API-Key': 'pKDap5jqe7lyBG5vTRgvTz7t8AiRWXpMYbuS2oak'
    };

    $scope.loadChat = function() {
        $http.get('https://api.parse.com/1/classes/CardioMoodChat', {headers: $rootScope.headers,
            params: {where:  {createdAt: {$gt : $scope.lastMessageTime}, $or: [{fromId: $rootScope.userId, toId: $rootScope.currentSpeaker},
                {fromId: $rootScope.currentSpeaker, toId: $rootScope.userId}]}, order: 'createdAt'}}).success(function(data) {
            for(var i = 0; i < data.results.length; i++) {
                var message = data.results[i];
                if(message.fromId == $rootScope.userId) {
                    $scope.messages.push({id: message.objectId, text: message.message, type: 'sent', createdAgo: moment(message.createdAt).fromNow()});
                } else {
                    $scope.messages.push({id: message.objectId, text: message.message, type: 'received', createdAgo: moment(message.createdAt).fromNow()});

                    $http({
                        method: "PUT",
                        url: 'https://api.parse.com/1/classes/CardioMoodChat/' + message.objectId,
                        headers: $scope.headerss,
                        data: {isRead: true}
                    });
                }
                $scope.lastMessageTime = message.createdAt;
            }
        });

        $http.get('https://api.parse.com/1/classes/CardioMoodChat', {headers: $rootScope.headers,
            params: {where: {$or: [{fromId: $rootScope.userId, toId: $rootScope.currentSpeaker},
                {fromId: $rootScope.currentSpeaker, toId: $rootScope.userId}]}, order: 'createdAt'}}).success(function(data) {
            for(var i = 0; i < data.results.length; i++) {
                var message = data.results[i];
                $rootScope.messagesIsRead[message.objectId] = message.isRead;
            }
        });
    };

    $timeout(function() {
        var latest = '1970-01-01T0:00:00Z';
        var latest_user = '';

        for(var i = 0; i < $rootScope.chatList.length; i++) {
            var group = $rootScope.chatList[i];
            for(var t = 0; t < group.users.length; t++) {
                var user = group.users[t];
                if(user.lastMessageTime > latest) {
                    latest = user.lastMessageTime;
                    latest_user = user.id;
                }
            }
        }
        if(latest_user != '') {
            $rootScope.currentSpeaker = latest_user;
        }

    }, 5000);

    $scope.$watch('$root.currentSpeaker', function() {
        if($rootScope.currentSpeaker) {

            angular.forEach($scope.intervals, function(interval) {
                $interval.cancel(interval);
            });
            $scope.intervals.length = 0;

            $scope.messages.length = 0;
            $scope.lastMessageTime = '1970-01-01T0:00:00Z';

            $scope.loadChat();
            $scope.intervals.push($interval($scope.loadChat, 3000));
        }
    });

    $scope.send = function() {
        $http({
            method: "POST",
            url: 'https://api.parse.com/1/classes/CardioMoodChat',
            headers: $scope.headerss,
            data: {message: $scope.sendMessage, fromId: $rootScope.userId, toId: $rootScope.currentSpeaker, isRead: false}
        }).success(function(data) {
            $scope.loadChat();
        });
        $scope.sendMessage = '';
    };

}]);

app.controller('UnreadCtrl', ['$http', '$interval', '$rootScope', '$scope', function($http, $interval, $rootScope, $scope) {
    $rootScope.totalUnread = 0;
    $rootScope.unreadByUser = [];

    $interval(function() {
        $http.get('https://api.parse.com/1/classes/CardioMoodChat', {headers: $rootScope.headers,
            params: {where: {toId: $rootScope.userId}}, order: 'createdAt'}).success(function(data) {
            var totalUnread = 0;
            var unreadByUser = [];

            for(var i = 0; i < data.results.length; i++) {
                var message = data.results[i];

                if(!unreadByUser[message.fromId]) {
                    unreadByUser[message.fromId] = 0;
                }

                if(!message.isRead) {
                    unreadByUser[message.fromId]++;
                    totalUnread++;
                }
            }

            if($rootScope.totalUnread != totalUnread) {
                console.log(totalUnread);
                $rootScope.totalUnread = totalUnread;
            }

            for (var userId in unreadByUser) {
                if($rootScope.unreadByUser[userId] != unreadByUser[userId]) {
                    $rootScope.unreadByUser[userId] = unreadByUser[userId];
                }
            }
        });
    }, 5000);
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
                url: 'https://api.parse.com/1/users/' + $scope.user.id,
                headers: $rootScope.headers
            }).success(function(data) {
                $scope.username = data.username;
            });

            $scope.setSpeaker = function(userId) {
                $rootScope.currentSpeaker = userId;
            }
        },
        controllerAt: 'user'
    }
});

app.directive('appMessage', function() {
    return {
        restrict: 'E',
        scope: {
            message: '='
        },
        templateUrl: 'app-message.html',
        controller: function() {

        },
        controllerAt: 'message'
    }
});
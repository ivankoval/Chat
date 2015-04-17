/**
 * Created by Ivan on 17.04.15.
 */

var ChatManager = function() {
    var self = this;
    this.currentUserId = undefined;
    this.convUserId = undefined;
    this.lastMessageTime = '1970-01-01T0:00:00Z';

    this.init = function(current, conv) {
        self.currentUserId = current;
        self.convUserId = conv;
        initParse();
        $('#sendBtn').on('click', function() {
            self.send();
        });
        setInterval(function() {
            self.receive();
        }, 1000);
    };

    this.send = function() {
        var message = $("input").val();
        if(message.length != 0) {
            console.log(message);
            var Chat = Parse.Object.extend('CardioMoodChat');
            var chat = new Chat();
            chat.set("message", message);
            chat.set("fromId", self.currentUserId);
            chat.set("toId", self.convUserId);
            chat.set("isRead", false);
            chat.save(null, {
                success: function(chat) {
                    console.log('saved' + chat);
                    //self.lastMessageTime = chat.createdAt;
                },
                error: function(chat, error) {
                    console.log('error' + error);
                }
            });
        }
    };

    this.receive = function() {
        var Chat = Parse.Object.extend('CardioMoodChat');

        var queryOne = new Parse.Query(Chat);
        queryOne.equalTo("fromId", self.currentUserId);
        queryOne.equalTo("toId", self.convUserId);

        var queryTwo = new Parse.Query(Chat);
        queryTwo.equalTo("fromId", self.convUserId);
        queryTwo.equalTo("toId", self.currentUserId);

        var query = new Parse.Query.or(queryOne, queryTwo);
        query.ascending('createdAt');
        query.greaterThan("createdAt", self.lastMessageTime);

        query.find({
           success: function(result) {
               for(var i = 0; i < result.length; i++) {
                   var object = result[i];
                    if(object.get("fromId") == self.currentUserId) {
                        $('#chat').append("<li>I: " + object.get('message') + "</li>")
                    } else {
                        $('#chat').append("<li>Person: " + object.get('message') + "</li>")
                    }
                    self.lastMessageTime = object.createdAt;
               }
           },
           error: function(error) {
                console.log("Error: " + error.code + " " + error.message)
           }
        });
    };

};


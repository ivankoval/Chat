/**
 * Created by Ivan on 17.04.15.
 */

var ChatManager = function() {
    var self = this;
    this.currentUserId = undefined;
    this.convUserId = undefined;
    //this.lastMessageTime = '1970-01-01T0:00:00Z';

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
        var message = $("#input").val();
        if(message.length != 0) {
            var Chat = Parse.Object.extend('CardioMoodChat');
            var chat = new Chat();
            chat.set("message", message);
            chat.set("fromId", self.currentUserId);
            chat.set("toId", self.convUserId);
            chat.set("isRead", false);
            chat.save(null, {
                success: function(chat) {
                    console.log('saved' + chat);
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
        //query.greaterThan("createdAt", self.lastMessageTime);

        query.find({
           success: function(result) {
               for(var i = 0; i < result.length; i++) {
                   var object = result[i];
                    if(object.get("fromId") == self.currentUserId) {
                        var status = object.get('isRead') ? 'Read' : 'Delivered';
                        $('#chat').append(' <div class="chatbox-user"> <a href="javascript:;" class="chat-avatar pull-left"> <img src="img/faceless.jpg" class="img-circle" title="user name" alt=""> </a> <div class="message"> <div class="panel"> <div class="panel-body"> <p>' + object.get('message') + '</p> </div> </div> <small class="chat-time"> <i class="ti-time mr5"></i> <b>' + moment(object.createdAt).fromNow() + ' ' + status + '</b> <i class="ti-check text-success"></i> </small> </div> </div>');
                    } else {
                        $('#chat').append(' <div class="chatbox-user right"> <a href="javascript:;" class="chat-avatar pull-right"> <img src="img/faceless.jpg" class="img-circle" title="user name" alt=""> </a> <div class="message"> <div class="panel"> <div class="panel-body"> <p>' + object.get('message') + '</p> </div> </div> <small class="chat-time"> <i class="ti-time mr5"></i> <b>' + moment(object.createdAt).fromNow() + '</b> <i class="ti-check text-success"></i> </small> </div> </div>');
                        object.set('isRead', true);
                        object.save();
                    }
                    //self.lastMessageTime = object.createdAt;
               }
           },
           error: function(error) {
                console.log("Error: " + error.code + " " + error.message)
           }
        });
    };

};


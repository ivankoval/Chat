/**
 * Created by Ivan on 17.04.15.
 */

$(function() {
    var curr = getUrlParameter('curr');
    var conv = getUrlParameter('conv');

    var chatManager = new ChatManager();
    chatManager.init(curr, conv);
});

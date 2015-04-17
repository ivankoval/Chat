/**
 * Created by Ivan on 17.04.15.
 */

function initParse() {
    var appId = "SSzU4YxI6Z6SwvfNc2vkZhYQYl86CvBpd3P2wHF1";
    var jsKey = "0ppjIVaWy3aqHyGEA95InejakxRELOMrePgRfREt";
    Parse.initialize(appId, jsKey);
}

function getUrlParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
}


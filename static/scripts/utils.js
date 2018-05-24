var utils = (function() {
    'use strict';

    function calcTime(offset) {

        // create Date object for current location
        var d = new Date();
    
        // convert to msec
        // add local time zone offset
        // get UTC time in msec
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    
        // create new Date object for different city
        // using supplied offset
        var nd = new Date(utc + (3600000*offset));
    
        // return time as a string
        return nd.toLocaleString();
    }

    function getCloseTime() {
        var d = Date.today()
        var t = d.toString('yyyy-MM-dd');
        var gmtOffset = -d.getTimezoneOffset()/60;
        var newyork = gmtOffset + 3;
        var numpart = Math.abs(newyork).toFixed(0)
        var isNeg = (gmtOffset < 0);
        var snumpart = 
            (numpart.length==1) ? 
                ((isNeg)? '-0'+numpart: '0'+numpart) :
                ((isNeg)? '-'+numpart : numpart);
        var datestr = `${t}T16:30:00${snumpart}:00`;
        var closeTime = Date.parse(datestr);
        return closeTime;
    }

    function getOpenTime() {
        var d = Date.today()
        var t = d.toString('yyyy-MM-dd');
        var gmtOffset = -d.getTimezoneOffset()/60;
        var newyork = gmtOffset + 3;
        var numpart = Math.abs(newyork).toFixed(0)
        var isNeg = (gmtOffset < 0);
        var snumpart = 
            (numpart.length==1) ? 
                ((isNeg)? '-0'+numpart: '0'+numpart) :
                ((isNeg)? '-'+numpart : numpart);
        var datestr = `${t}T09:00:00${snumpart}:00`;
        var openTime = Date.parse(datestr);
        return openTime;
    }

    function isMarketOpen()
    {
        var now = new Date()
        return (now >= utils.openTime() && now <= utils.closeTime());
    }

    return {
        calcTime: calcTime,
        closeTime: getCloseTime,
        openTime: getOpenTime,
        isMarketOpen: isMarketOpen,
    };

}());


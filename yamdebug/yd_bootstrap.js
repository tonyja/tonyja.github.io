// ==UserScript== for Tampermonkey
// @name       HookStache
// @namespace  http://www.yammer.com/
// @version    0.1
// @description  YamJS debugging info (requests, realtime clients, client ORM models) with configurable data driven  Mustache templates.
// @match      https://www.yammer.com/*
// @match      https://www.staging.yammer.com/*
// @match      https://www.yammer.dev/*
// @copyright  2012+, You
// ==/UserScript==

// This content from https://github.int.yammer.com/tjackson/hookstache/raw/master/hookstache.tampermonkey.txt

var setYamDebugRetriesLeft = 100;
var debugTimeout = null;
function setYamConfigToDebug() {
    console.log("Calling setYamConfigToDebug to see yam.log messages");
    clearTimeout(debugTimeout);
    if("undefined" != typeof(yam) && !!yam.ready)
    {
        yam.ready(function() {
            yam.config({debug:true});
            console.log("yam.ready() call completed in setYamConfigToDebug",yam.config());
            //yam.$(document.body).removeClass("wd-seen-unseen");
            var extendFunc = (_ || $ || {}).extend;
            if(!!extendFunc && !!require) {
                window.ym = _.extend({},require("core/lib/session"),require("core/lib/yammer_config"),require("core/lib/treatment"));
                unsafeWindow.ym = window.ym;
                console.log("Added 'ym' object with global yam functions for debug",ym);
            } else {
                console.log("Could not add 'ym' debug object due to missing '($ || _).extend' or 'require' functions. extendFunc=",extendFunc,"requireFunc=",require);
            }

            //require("yam.$")('.yj-nav-fixed-content').addClass('yj-fixed-bottom');
        });
    }
    else if(setYamDebugRetriesLeft > 0)
    {
        console.log("Delay and retry setYamConfigToDebug due to missing 'yam' object.  Attempts remaining=",setYamDebugRetriesLeft)
        setYamDebugRetriesLeft--;
        debugTimeout = setTimeout(setYamConfigToDebug, 100);
    }
};



window.HookStacheLoad = (function(){HookStache_H='0b9f5391a9d5a0a7e873';HookStache_SCRIPT=document.createElement('SCRIPT');HookStache_SCRIPT.type='text/javascript';HookStache_SCRIPT.src='https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache.js';document.getElementsByTagName('head')[0].appendChild(HookStache_SCRIPT)});

if(typeof(unsafeWindow) != "undefined") unsafeWindow.HookStacheLoad = window.HookStacheLoad;

setYamConfigToDebug();
//window.HookStacheLoad();
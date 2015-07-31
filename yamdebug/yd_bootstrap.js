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
//var console = console || window.console;
//var _ = _ || window._;
//var yd = yd || window.yd;
//var HookStache_SCRIPT = HookStache_SCRIPT || window.HookStache_SCRIPT;
//var HookStache_H = HookStache_H || window.HookStache_H;
//var unsafeWindow = unsafeWindow || window;
function setYamConfigToDebug() {
    console.log("Calling setYamConfigToDebug to see yam.log messages");
    clearTimeout(debugTimeout);
    if("undefined" != typeof(yam) && !!yam.ready)
    {
        yam.ready(function() {
            yam.config({debug:true});
            console.log("yam.ready() call completed in setYamConfigToDebug",yam.config());
            var extendFunc = (_ || $ || {}).extend;
            window.unsafeWindow = window.unsafeWindow || window;
            if(!!extendFunc && !!require) {
                window.yd = window.yd || {};
                window.yd = _.extend(window.yd,{
                    _config: {
                        aliases: {
                            "core/lib/session": ".",
                            "core/lib/yammer_config": ".",
                            "core/lib/treatment": ".",
                            "core/lib/namespace": ".",
                            'yam.model.Feed': "mdl.F",
                            'models/lib/backbone/model/group': "mdl.G",
                            'yam.model.Message': "mdl.M",
                            'yam.model.Network': "mdl.N",
                            'yam.model.Thread': "mdl.T",
                            'yam.model.User': "mdl.U",
                            'models/lib/helper/modular_feeds_experiment': 'modular_feeds_experiment',
                            'core/lib/yammer_api': 'api',
                            "models/lib/model/helper/report_feed_events": 'report_feed_events'
                        }
                    }
                });
                window.yd.a = {};

                // First copy func from 'core/lib/namespace' to get yd.val
                window.yd.val = function (root, path, value) {
                    var prnt = root
                      , parts = path.split('.')
                      , setting = arguments.length === 3
                      , ordlen = parts.length-1;

                    for (var i = 0, ii = parts.length; i < ii; i++) {
                      var p = parts[i];

                      if (!prnt[p]){
                        if (!setting){ return prnt[p]; }
                        prnt[p] = (i === ordlen) ? value : {};
                      } else if (i === ordlen){
                        return setting ? prnt[p] = value : prnt[p];
                      }
                      prnt = prnt[p];
                    }
                  };

                console.log("Adding 'yd' object with global yam functions for debug",window.yd);

                window.yd.addAlias = function(pair) {
                    var foundVal = pair[0].indexOf('/') == -1 ?
                        (yd.val(window, pair[0]) || yd.val(unsafeWindow, pair[0])) :
                        (function(){
                            try{return require(pair[0]);}
                            catch(e){console.log(e);}
                        })();
                    if(!foundVal) {
                        console.log("No global or require found for alias: ","yd.a."+pair[1]," under path:",pair[0]);
                    } else if("." === pair[1]) {
                        _.extend(window.yd,foundVal);
                        console.log("Extended 'yd' global with:",pair[0],"=",foundVal);

                    } else {
                        yd.val(yd.a, pair[1], foundVal);
                        console.log("Aliased:","yd.a."+pair[1],"for:",pair[0],"=",yd.val(yd.a, pair[1]));
                    }
                };
                _.chain(yd._config.aliases).pairs().each(yd.addAlias).value();

                window.yd.wrapReportFeedEvent = function() {
                    var rfe = require("models/lib/model/helper/report_feed_events");
                    window.yd.wrapWithDiags(
                            rfe,
                            "reportFeedEvent",
                            function(){
                                console.error("BEFORE reportFeedEvent:",arguments,this);
                                debugger;
                            },
                            function(){
                                console.error("AFTER reportFeedEvent:",arguments,this);
                                debugger;
                            },
                            rfe
                        );
                };

                window.yd.wrapWithDiags = function(obj,funcName,before,after, self) {
                    var fn = yd.val(obj,funcName);
                    if(!fn)
                        return console.error("FAILED to find funk in yd.wrapWithDiags",arguments);

                    if(!!fn._yd)
                        return console.error("FUNK already wrapped with the following:",
                            fn._yd," WILL not replace with the following:",arguments);

                    yd.val(fn,"_yd",{
                        origFunc: fn,
                        origFuncName:funcName,
                        before:before,
                        after:after,
                        context:self
                    });
                    var go = fn._yd.go = function() {inspect(fn._yd.origFunc)};
                    console.error("Calling yd.wrapWithDiags with:",fn._yd);
                    var wrappedFunc = function() {
                        if(before) before.apply(self,arguments);
                        var res = fn.apply(self,arguments);
                        if(after) after.apply(self,arguments);
                        return res;
                    };
                    yd.val(obj,funcName,wrappedFunc);

                    return wrappedFunc;
                };

                if(typeof(unsafeWindow) != "undefined") unsafeWindow.yd = window.yd;
                //unsafeWindow.BootstrapHook(unsafeWindow);
                //unsafeWindow.HookStacheLoad(unsafeWindow);
            } else {
                console.log("Could not add 'yd' debug object due to missing '($ || _).extend' or 'require' functions. extendFunc=",extendFunc,"requireFunc=",require);
            }
        });
    }
    else if(setYamDebugRetriesLeft > 0)
    {
        console.log("Delay and retry setYamConfigToDebug due to missing 'yam' object.  Attempts remaining=",setYamDebugRetriesLeft);
        setYamDebugRetriesLeft--;
        debugTimeout = setTimeout(setYamConfigToDebug, 100);
    }
}

window.HookStacheLoad = (function(){BootstrapHook(unsafeWindow);HookStache_H='0b9f5391a9d5a0a7e873';HookStache_SCRIPT=document.createElement('SCRIPT');HookStache_SCRIPT.type='text/javascript';HookStache_SCRIPT.src='https://tonyja.github.io/hookstache_v1_broken/HookStache.js';document.getElementsByTagName('head')[0].appendChild(HookStache_SCRIPT)});

window.BootstrapHook = (function(unsafeWindow){
 unsafeWindow = unsafeWindow || wiindow.unsafeWindow || window;
 unsafeWindow.yam.mixin = _.extend;
 unsafeWindow.Mustache = require('Mustache');
 unsafeWindow.yam.ns = unsafeWindow.yd.ns;
 unsafeWindow.yam.$ = require('yam.$');
 unsafeWindow.templateKey = null;
 unsafeWindow.fallbackTemplateKey = "yam.*";
});

if(typeof(unsafeWindow) != "undefined") unsafeWindow.HookStacheLoad = window.HookStacheLoad;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.BootstrapHook = window.BootstrapHook;

setYamConfigToDebug();
//window.HookStacheLoad();
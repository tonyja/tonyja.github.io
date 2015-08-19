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
                            'models/lib/model/helper/report_feed_events': 'report_feed_events',
                            'feeds/lib/ui/threads/future/feed_delegate': 'ui.feedDelegate',
                            'models/lib/helper/realtime_connection_factory': 'rt.modular.factory',
                            'models/lib/client/realtime_feed_connection': 'rt.modular.connection',
                            'models/lib/helper/realtime_message_resolver': 'rt.modular.messageResolver',
                            'models/lib/helper/realtime_fetchnewer_resolver': 'rt.modular.fetchNewerResolver',

                            'models/lib/client/realtime_feed_client': 'rt.control.feedClient',
                            'models/lib/client/base_realtime_client': 'rt.modular.baseClient',

'core/lib/data/repository': 'process.both.modelRepository',
'models/lib/model/message_payload_processor': 'process.both.messagePayloadProcessor',
'models/lib/model/announcement_bubbling_processor': 'process.both.announcementBubblingProcessor',
'models/lib/helper/inbox_update_processor': 'process.modular.inboxUpdateProcessor',
'models/lib/helper/cursor_update_processor': 'process.modular.cursorUpdateProcessor',
'models/lib/helper/feed_hydrator': 'process.modular.cursorUpdateProcessor',
'models/lib/helper/feed_fetcher': 'process.modular.feedFetcher',


'core/lib/uri_helper':'uriHelper'
                        },


        "yd.a.feed_delegate._onAfterProcess": {
            before: {
                log: (function feed_delegate_updateModelIndexes() {
                    console.error("feed_delegate._onAfterProcess. Items=",(this._feed.getThreads() || []).length,"first=",(this._feed.getThreads() || [{}])[0].id,this._feed.getUrl());
                    console.error("feed_delegate._updateModelIndexes. Items=",(this._feed.getThreads() || []).length,"first=",(this._feed.getThreads() || [{}])[0].id,this._feed.getUrl());
                    }),
                debug: true,
                trackStacks: true
            }
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
                
                window.yd.Mustache = require('Mustache');

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

                /// HERE is where the alias map is defined
                _.chain(yd._config.aliases).pairs().each(yd.addAlias).value();

                // LET's DEFINE some useful toString functions
             try
             {
                yd.a.mdl.F.prototype.toString = function () {
                    return "[F:" + this.keyType + ":" + (this.keyId||"") + "]";
                };
                yd.feedPropToStringTemplate = function (classAlias, feedPropPath) {
                    var feedObj = yd.val(this,feedPropPath) || yd.val(this,"feed") || yd.val(this,"_feed") || yd.val(this,"options.feed");
                    return "[" +
                        (classAlias||"{obj?}") + " on " +
                        (feedObj||"[{No this."+feedPropPath+" set}]").toString() +
                        "]";
                };

                yd.a.ui.feedDelegate.toString = _.partial(yd.feedPropToStringTemplate,"feedDelegate",'_feed');
                yd.a.rt.modular.connection.toString = _.partial(yd.feedPropToStringTemplate,"rtFeedConnection(MOD)",'options.feed');
             }
                catch(tse){ console.error("ERROR: Failure updating diagnostic toString() methods: ",tse) }
                
                window.yd.wrapAndLog = function(objPath, funcName) {
                    var obj = yd.val(window,objPath) ||  yd.val(unsafeWindow,objPath) || {};
                    var func = obj[funcName];

                    window.yd.wrapWithDiags(
                            obj,
                            funcName,
                            function(){
                                var argsString = _.map(arguments,function(arg){return (arg||"{empty}").toString();}).join(", ");
                                console.error("CALLING:",objPath,funcName,"on",this,(this||"{no 'this'}").toString(),"with",arguments,argsString);
                                //debugger;
                            },
                            function(){
                                //console.error("AFTER reportFeedEvent:",arguments,this);
                                //debugger;
                            },
                            objPath
                        );
                };

    window.yd.logRealtimeMethods = function logRealtimeMethods () {

        window.yd.wrapAndLog('yd.a.rt.factory',"openConnectionForFeed");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"connect");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"disconnect");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"_disconnectBayeux");
        window.yd.wrapAndLog('yd.a.rt.resolver.prototype',"onConnect");
        window.yd.wrapAndLog('yd.a.rt.resolver.prototype',"onData");
    };


    window.yd.logProcessorSteps =  function logProcessorSteps () {

// Control path flow of method calls expected.
window.yd.wrapAndLog('yd.a.mdl.F.prototype','setNewestMessageId'); // in feedClient for control but later in update_processor for modular
window.yd.wrapAndLog('yd.a.mdl.F.prototype','onData'); // Hook alias to onDataSingle
window.yd.wrapAndLog('yd.a.mdl.F.prototype','onDataSingle'); //,'uses feedHydrator.hydrate in treatment');
    window.yd.wrapAndLog('yd.a.process.both.modelRepository.prototype','transaction'); //,'uses feedHydrator._getProcessors in treatment');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','process'); //,'uses cursorUpdateProcessor.process in treatment');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','setLocalLastSeenMessageId'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','_getProcessors'); //,'uses feedHydrator._getProcessors in treatment');
                window.yd.wrapAndLog('yd.a.process.both.announcementBubblingProcessor.prototype','process');
                window.yd.wrapAndLog('yd.a.process.both.messagePayloadProcessor.prototype','process');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','updateUnseenCounts'); //,'goes after processors in control');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','onAfterProcess');
            window.yd.wrapAndLog('yd.a.ui.feedDelegate.prototype','_onAfterProcess');
//                window.yd.wrapAndLog('yd.a.ui.feedDelegate.prototype','trigger');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','onFirstPayload');

    };
             try
             {
// CALL it right away
window.yd.logProcessorSteps();
             }
                catch(elog){ console.error("ERROR: Failure initializing log wrap diags",elog) }
                


/*
                            'models/lib/client/realtime_feed_connection': 'rt.modular.connection',
                            'models/lib/helper/realtime_message_resolver': 'rt.modular.messageResolver',
                            'models/lib/helper/realtime_fetchnewer_resolver': 'rt.modular.fetchNewerResolver',

                            'models/lib/client/realtime_feed_client': 'rt.control.feedClient',
                            'models/lib/client/base_realtime_client': 'rt.modular.baseClient',

'core/lib/data/repository': 'process.both.modelRepository',
'models/lib/model/message_payload_processor': 'process.both.messagePayloadProcessor',
'models/lib/model/announcement_bubbling_processor': 'process.both.announcementBubblingProcessor',
'models/lib/helper/inbox_update_processor': 'process.modular.inboxUpdateProcessor',
'models/lib/helper/cursor_update_processor': 'process.modular.cursorUpdateProcessor',
'models/lib/helper/feed_hydrator': 'process.modular.cursorUpdateProcessor',
'models/lib/helper/feed_fetcher': 'process.modular.feedFetcher',

*/

                window.yd.wrapWithDiags = function(obj,funcName,before,after, objPath) {
                    var fn = yd.val(obj,funcName);
                    if(!fn)
                        return console.error("FAILED to find funk in",objPath,funcName,obj,before,after);

                    if(!!fn._yd)
                        return console.error("FUNK already wrapped with the following:",objPath,funcName,
                            fn._yd," WILL not replace with the new before/after");

                    yd.val(fn,"_yd",{
                        origFunc: fn,
                        origFuncName:funcName,
                        before:before,
                        after:after,
                        context:self
                    });
                    var go = fn._yd.go = function() {yd.dbg.inspect(fn._yd.origFunc);};
                    console.error("Calling yd.wrapWithDiags with:",fn._yd);
                    var wrappedFunc = function() {
                        if(before) before.apply(this,arguments);
                        var res = fn.apply(this,arguments);
                        if(after) after.apply(this,arguments);
                        return res;
                    };
                    yd.val(obj,funcName,wrappedFunc);

                    return wrappedFunc;
                };

                window.yd.initDevTools = function () {
                    // Execute on the devtools commandline to make the commandline API functions for that instance available to the JS in the window
                    // https://developer.chrome.com/devtools/docs/commandline-api
                    eval("window.yd.dbg = {inspect,debug,undebug, getEventListeners,keys,values,monitor,unmonitor}");
                    
                    // If the https://github.com/amasad/debug_utils extension is installed then add that too
                    window.yd.dbg.debugUtils = window['debugUtils'];
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
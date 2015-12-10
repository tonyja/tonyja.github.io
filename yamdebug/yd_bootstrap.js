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
var HookStache_SCRIPT = HookStache_SCRIPT || window.HookStache_SCRIPT;
var HookStache_H = HookStache_H || window.HookStache_H;
//var unsafeWindow = unsafeWindow || window;
function setYamConfigToDebug() {
    console.log("Calling setYamConfigToDebug to set up debug environment.");
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
                            //"core/lib/namespace": ".",
                            'yam.model.Feed': "mdl.F",
                            'models/lib/backbone/model/group': "mdl.G",
                            'yam.model.Message': "mdl.M",
                            'yam.model.Network': "mdl.N",
                            'yam.model.Thread': "mdl.T",
                            'yam.model.User': "mdl.U",
                            'models/lib/helper/assured_delivery_experiments': 'assured_delivery_experiments',
                            'core/lib/yammer_api': 'api',

                            'core/lib/pubsub': 'pubsub',
                            'feeds/lib/ui/attachments/uploader': 'uploader',

                            'models/lib/model/helper/report_feed_events': 'report_feed_events',
                            'feeds/lib/ui/threads/future/feed_delegate': 'ui.feedDelegate',
                            'models/lib/helper/realtime_connection_factory': 'rt.modular.factory',
                            'models/lib/client/realtime_feed_connection': 'rt.modular.connection',
                            'models/lib/helper/realtime_message_resolver': 'rt.modular.messageResolver',
                            'models/lib/helper/realtime_fetchnewer_resolver': 'rt.modular.fetchNewerResolver',

                            'models/lib/client/realtime_network_client': 'rt.control.networkClient',
                            'models/lib/client/base_realtime_client': 'rt.control.baseClient',

'core/lib/data/repository': 'process.both.modelRepository',
'models/lib/model/message_payload_processor': 'process.both.messagePayloadProcessor',
'models/lib/model/announcement_bubbling_processor': 'process.both.announcementBubblingProcessor',
'models/lib/helper/inbox_update_processor': 'process.modular.inboxUpdateProcessor',
'models/lib/helper/cursor_update_processor': 'process.modular.cursorUpdateProcessor',
                            'models/lib/model/helper/feed_viewed_messages_processor': 'process.modular.feedViewedMessagesProcessor',
'models/lib/helper/feed_hydrator': 'process.modular.feedHydrator',
'models/lib/helper/feed_fetcher': 'process.modular.feedFetcher',
                            "core/lib/client/message_payload": 'process.both.messagePayload',

'models/lib/backbone/collection/global_viewed_states': 'gvs',
'models/lib/helper/feed_factory': 'feed_factory',
'models/lib/helper/viewed_state_helper': 'viewed_state_helper',
'models/lib/backbone/model/viewed_state': 'viewed_state',
'models/lib/backbone/viewed_state_collection': 'viewed_state_collection',
'core/lib/yammer_request': 'request',
'core/lib/report': 'report',


'core/lib/uri_helper':'uriHelper'
                       },


        "yd.a.feed_delegate._onAfterProcess": {
            before: {
                log: (function feed_delegate_updateModelIndexes() {
                    console.trace("feed_delegate._onAfterProcess. Items=",(this._feed.getThreads() || []).length,"first=",(this._feed.getThreads() || [{}])[0].id,this._feed.getUrl());
                    console.trace("feed_delegate._updateModelIndexes. Items=",(this._feed.getThreads() || []).length,"first=",(this._feed.getThreads() || [{}])[0].id,this._feed.getUrl());
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
                    path = path||"";
                    root = root ||{};
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

                window.yd.$ = require('yam.$');
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

                console.groupCollapsed('(+) Adding the following aliases to the "yd.a" debug namespace:',_.uniq(_.values(yd._config.aliases)));
                /// HERE is where the alias map is defined
                _.chain(yd._config.aliases).pairs().each(yd.addAlias).value();

                console.groupEnd();

                // LET's DEFINE some useful toString functions
             try
             {

yd.a.viewed_state.prototype.toString = function(verbose) {
  var eo = this;

  return yd.Mustache.render('{{lastReplyMessageId}}:{{lastViewedMessageId}}:{{id}}:{{threadState}}:{{isLoaded}}:{{isRendered}}:{{loadType}}:{{loadFeed}}:{{fetchType}}:{{fetchFeed}}:{{dataOrigin}}:{{reconcileInfo}}:{{keepHigher}}{{keepHigherOrigin}}',
    this.asConsoleTableProps());

/*
  // Old obsolete logic
  var retVal = eo.get('lastReplyMessageId')+":"+(yd.a.viewed_state_helper.isViewed(eo)?"":"UV")+":";
    retVal += eo.get('lastViewedMessageId')+":"+eo.get('id');
    retVal += ":"+eo.get('loadType')+":"+eo.get('loadFeed');
    retVal += ":"+eo.get('fetchType')+":"+eo.get('fetchFeed');
    retVal += ":"+eo.get('dataOrigin')+":"+eo.get('reconcileInfo');
    retVal += ":"+eo.get('keepHigher')||eo.get('keepHigherOrigin');
    if (verbose) {
        retVal += "\nLastChange:" + JSON.stringify(eo.changed||{});
        var previousValues = _.pick(eo._previousAttributes,_.keys(eo.changed));
        retVal += "\nPreviousValues:" + JSON.stringify(previousValues);
    }
    return retVal;
*/
};

yd.a.viewed_state.prototype.consoleTableProps = [
    'lastReplyMessageId',
    'lastViewedMessageId',
    'id',
    'threadState',
    'loadState',
    'isViewed',
    'isLoaded',
    'isRendered',
    'loadType',
    'loadFeed',
    'fetchType',
    'feedFeeed',
    'dataOrigin',
    'reconcileInfo',
    'keepHigher' //,
//    'latestChanges',
//    'previousValues'
  ];
yd.a.viewed_state.prototype.asConsoleTableProps = function(newThis) {
  if(!newThis) newThis = this;
  var latestChanges = newThis.changed||{};
//  var previousValues = _.pick(newThis._previousAttributes,_.keys(newThis.changed));
  var isViewed = yd.a.viewed_state_helper.isViewed(newThis);
  var viewedString = !isViewed ? 'UV' : 'VW';
  if((newThis.attributes.dataOrigin||"").indexOf('forc') > -1) {
    viewedString = 'VW_FORCED';
  }
  if((newThis.attributes.dataOrigin||"").indexOf('mark') > -1) {
    viewedString = 'VW_MARKED';
  }
  var calculatedProps = {
      lastViewedMessageId: '{no-value}',
      isViewed: viewedString,
      isLoaded: !!yd.a.mdl.T.findById(newThis.id) ? 'L' : '',
      isRendered: false, //(yd.$('[data-thread-id='+newThis.id+']').length > 0) ? 'R' : '',
//      latestChanges: JSON.stringify(latestChanges),
//      previousValues: JSON.stringify(previousValues),
      latestChangesObj: latestChanges //,
//      previousValuesObj: previousValues
    };
    calculatedProps.threadState = calculatedProps.isLoaded ? 'LOADED_' : 'NO_LOAD_';
    calculatedProps.threadState += calculatedProps.isRendered ? 'RENDERED_' : '';
    calculatedProps.threadState += calculatedProps.isViewed;
    calculatedProps.loadState = calculatedProps.isLoaded + calculatedProps.isRendered;
  return _.extend(calculatedProps, newThis.attributes);
};

yd.a.viewed_state.prototype.toConsoleTable = function(verbose) {
  console.group(this.toString());
  console.groupEnd();
};

yd.a.mdl.F.prototype.toConsoleTable = function(verbose) {
  console.group(this.toString());
  console.table(_.map(this.feedCounter._viewedStates.models.sort().reverse(),yd.a.viewed_state.prototype.asConsoleTableProps),(this.feedCounter._viewedStates.models[0]||{}).consoleTableProps);
  console.groupEnd();
};

yd.a.mdl.F.prototype.toString = function (verbose) {
                    var retVal = "'[feed:"+
                        this.keyType + ":" + (this.keyId||"") +
                         " unv:" + this.getUnseenThreadCount() +
                         " newest:" + this.newest_message_id +
                         " oldest:"+ this._oldest_threaded_id +
                        (_.isBoolean(this._olderAvailable) ? (" hasOlder:"+this._olderAvailable) : "") +
                        " realtime:"+(this._realtimeConnection && this.isRealtimeConnected()) +
                         " hasPayld?:" + this._hasFirstPayload +
                      "]";
                    if (verbose) {
                        retVal += "\n" +
                            (this.feedCounter && this.feedCounter._viewedStates.models.sort().reverse().join('\n')) + '\n\n';
                    }
    return retVal;
                };
                yd.feedPropToStringTemplate = function (classAlias, feedPropPath) {
                    var feedObj = yd.val(this,(feedPropPath||"")) || yd.val(this,"feed") || yd.val(this,"_feed") || yd.val(this,"options.feed");
                    return "[" +
                        (classAlias||"{obj?}") + " for " +
                        (feedObj||"[{No feed at this."+feedPropPath+"}]").toString() +
                        "]";
                };

                yd.a.ui.feedDelegate.prototype.toString = _.partial(yd.feedPropToStringTemplate,"feedDelegate",'_feed');
                yd.a.rt.modular.connection.prototype.toString = _.partial(yd.feedPropToStringTemplate,"rtFeedConnection(MOD)",'options.feed');
                yd.a.process.both.messagePayloadProcessor.prototype.toString =_.partial(yd.feedPropToStringTemplate,"msgPayldPrcsr",'_feed');
                yd.a.process.both.announcementBubblingProcessor.prototype.toString =_.partial(yd.feedPropToStringTemplate,"ancmntPayldPrcsr",'_feed');

                 yd.a.process.both.modelRepository.prototype.toString = function(){return "[ORMTransaction]";};
                 yd.diagsString = '';
                 yd.p = function(col, verbose) {
                     var obj = yd.val(yd.a.mdl,col) || yd.val(yd.a,col) ||  yd.val(yd,col) ||  yd.val(window,col) || [col,"Not Found"];
                     obj = obj.models ||  (obj.all ? obj.all() : obj);
                     var msg = _.map(obj, function(eo){ return eo.toString(verbose)}).join('\n');
                     console.log(yd.logd(msg + '\n'));
                 };
                 yd.logd = function(input) {
                     yd.diagsString += input + '\n';
                     return input;
                 };
                 yd.dump = function(popup) {
                     var verbose = true;
                     console.group(yd.logd("(+) Viewed States and Feed Counts - " + Date() +" " + Date.now()));

                       console.log(yd.logd('SAVE THESE IDS AND THIS DATA TO A FILE AND REPORT THE ISSUE:'));
                       console.log(yd.logd('client_load_id: ' + yd.a.request.getPageLoadId()));
                       console.log(yd.logd('user_id: ' + (yd.getCurrentUser()||{}).id));
                       console.log(yd.logd('date: ' + Date()));

                       var cu = yd.getCurrentUser();
                       console.log(yd.logd('RGC tow_use_unviewed_ocular_counts: ' + cu.treatments.tow_use_unviewed_ocular_counts));
                       console.log(yd.logd('ADUX tow_assured_delivery: ' + cu.treatments.tow_assured_delivery));
                       console.log(yd.logd('Additional Logging tow_log_viewed_threads_fix: ' + cu.treatments.tow_log_viewed_threads_fix));

                       var errorsInSession = _.union(yd.a.report.exception._errorsToReport,
                               yd.a.report.exception._previouslyReported);
                       if (errorsInSession.length > 0) {

                          var errorTemplate = 'ERROR TimeStamp:{{ClientTimeStamp}} Message:"{{Parameters.message}}" Stack:[{{Parameters.stack}}]';
                          var allErrorsString = _.map(errorsInSession,
                              _.partial(yd.Mustache.render,errorTemplate)).join('\n');

                          console.group(yd.logd('(+) JS errors reported in this session'));
                            console.log(yd.logd(allErrorsString));
                          console.groupEnd();
                       }

                       console.group(yd.logd("(+) Feed Counts and Viewed States"));

                         yd.p('F',verbose);

                       console.groupEnd();

                       console.groupCollapsed(yd.logd("(+) All Global Viewed States and Changes"));

                         yd.p('gvs',verbose);

                       console.groupEnd();

                     console.groupEnd();

                     console.log(yd.logd("DONE Viewed States and Feed Counts - " + Date() +" " + Date.now()));

                     if (!!popup) window.popupDiagnosticDiv(yd.diagsString);
                     yd.diagsString = '';
                 };
                 //yd.$('.yj-nav-menu')[0].ondblclick = function(){yd.dump(true)};

                 yd.a.process.both.messagePayload.prototype.toString = function() {
                     return "[msgPayload" +
                         " type:" + yd.val(this,'_raw.meta.feed_name') +
                         " messages:" + yd.val(this,"_raw.messages.length") +
                         " newest:" +yd.val(this,"_stats.threaded.newest") +
                         " oldest:"+ yd.val(this,"_stats.threaded.oldest") +
                         " unseenCount:"+ yd.val(this,"_raw.meta.unseen_thread_count") +
                         " is_read:"+ yd.val(this,"is_read") +
                         (this.is_read ? "(!!AnnouncementBubbling!!)" : "") +
                         "]";
                 };

                yd.realtimeClientToStringTemplate = function (classAlias) {
                    var feedUrl = this._url||"";
                    feedUrl = feedUrl.replace('https://www.yammer.dev/api/v1','').replace('&threaded=extended&exclude_own_messages_from_unseen=true','');
                    return "["+ (classAlias||"{unknownClient?}") + ":"+
                        feedUrl +
                         " state:" + this._lifecycleState +
                         " type:" + this._connectionType +
                         " newest:" + yd.val(this,'_newestId.threaded') +
                         " hasOlder:"+this._hasOlderAvailable +
                      "]";
                };

//              yd.a.rt.control.feedClient.prototype.toString = _.partial(yd.realtimeClientToStringTemplate,"feedClient");
                yd.a.rt.control.baseClient.prototype.toString = _.partial(yd.realtimeClientToStringTemplate,"baseClient");
                yd.a.rt.control.networkClient.prototype.toString = _.partial(yd.realtimeClientToStringTemplate,"networkClient");
                yd.a.process.modular.feedViewedMessagesProcessor.prototype.toString =_.partial(yd.feedPropToStringTemplate,"feedVwdMsgsPayldPrcsr",'_feed');
                yd.a.process.modular.inboxUpdateProcessor.prototype.toString =_.partial(yd.feedPropToStringTemplate,"inboxUpdatePayldPrcsr",'_feed');
                yd.a.process.modular.cursorUpdateProcessor.prototype.toString =_.partial(yd.feedPropToStringTemplate,"cursrUpdatePayldPrcsr",'_feed');


             }
             catch(tse)
             {
                 console.error("ERROR: Failure updating diagnostic toString() methods: ",tse);
             }

                 window.yd.wrapWithDiags = function(obj,funcName,before,after, objPath) {
                    var fn = yd.val(obj,funcName);
                    if(!fn)
                        return console.error("WRAP FAILED to find funk in",objPath,funcName,obj,before,after);

                    if(!!fn._yd)
                        return console.error("WRAP FAILED FUNK already wrapped with the following:",objPath,funcName,
                            fn._yd," WILL not replace with the new before/after");

                    yd.val(fn,"_yd",{
                        origFunc: fn,
                        origFuncName:funcName,
                        before:before,
                        after:after,
                        context:objPath
                    });
//                    var go = fn._yd.go = function() {yd.dbg.inspect(fn._yd.origFunc);};
                     console.error("WRAPPING:",objPath,funcName,"with:",fn._yd);
                    var wrappedFunc = function() {
                        if(before) before.apply(this,arguments);
                        var res = fn.apply(this,arguments);
                        if(after) after.apply(this,arguments);
                        return res;
                    };
                    yd.val(obj,funcName,wrappedFunc);

                    return wrappedFunc;
                };

               window.yd.wrapAndLog = function(objPath, funcName) {
                    var obj = yd.val(window,objPath) ||  yd.val(unsafeWindow,objPath) || {};
                    //var func = obj[funcName];

                    window.yd.wrapWithDiags(
                            obj,
                            funcName,
                            function(){
                                console.group(funcName,objPath);

                                var argsString = _.map(arguments,function(arg){return ("function"=== typeof(arg)) ? "function(){...}" : (arg||"{empty}").toString();}).join(", ");
                                var stackTrace = Error().stack;
                                window.yd.stacktrack = window.yd.stacktrack||{};
                                window.yd.stacktrack[stackTrace]= (window.yd.stacktrack[stackTrace]||0)+1;
                                console.trace("CALLING:",
                                              funcName,"(",argsString,") (proto=",objPath,")\n",
                                              "ON: ",(this||"{no 'this'}").toString(),
                                              "\nCall details: arguments=",arguments,"this=",this);

                                //debugger;
                            },
                            function(){

                                console.groupEnd();
                                //console.error("AFTER reportFeedEvent:",arguments,this);
                                //debugger;
                            },
                            objPath
                        );
                };

    window.yd.logRealtimeMethods = function logRealtimeMethods () {

        window.yd.wrapAndLog('yd.a.rt.modular.factory',"openConnectionForFeed");
        window.yd.wrapAndLog('yd.a.rt.modular.connection.prototype',"connect");
        window.yd.wrapAndLog('yd.a.rt.modular.connection.prototype',"_reconnect");
        window.yd.wrapAndLog('yd.a.rt.modular.connection.prototype',"disconnect");
        window.yd.wrapAndLog('yd.a.rt.modular.connection.prototype',"_disconnectBayeux");
        window.yd.wrapAndLog('yd.a.rt.modular.connection.prototype',"_onRealtimeData");
        window.yd.wrapAndLog('yd.a.rt.modular.messageResolver',"start");
        window.yd.wrapAndLog('yd.a.rt.modular.messageResolver',"restart");
        window.yd.wrapAndLog('yd.a.rt.modular.messageResolver',"onData");
        window.yd.wrapAndLog('yd.a.rt.modular.messageResolver','_performBackfill');
        window.yd.wrapAndLog('yd.a.rt.modular.fetchNewerResolver',"start");
        window.yd.wrapAndLog('yd.a.rt.modular.fetchNewerResolver',"onData");
        window.yd.wrapAndLog('yd.a.rt.modular.fetchNewerResolver','_fetchNewer');
        window.yd.wrapAndLog('yd.a.rt.modular.fetchNewerResolver','_hydrateFeeds');
        window.yd.wrapAndLog('yd.a.rt.modular.fetchNewerResolver','restart');
    };


    window.yd.logProcessorSteps =  function logProcessorSteps () {

// Control path flow of method calls expected.


//window.yd.wrapAndLog('yd.a.rt.control.baseClient.prototype','sendRequest'); // in feedClient for control but later in update_processor for modular
//window.yd.wrapAndLog('yd.a.rt.control.baseClient.prototype','onRealtimeData'); //,'uses feedHydrator.hydrate in treatment');
window.yd.wrapAndLog('yd.a.rt.control.baseClient.prototype','onRestData'); //,'uses feedHydrator.hydrate in treatment');
window.yd.wrapAndLog('yd.a.rt.control.baseClient.prototype','onConnectionOpened'); //,'uses feedHydrator.hydrate in treatment');

// REaltime network client is too noisy for general use
//window.yd.wrapAndLog('yd.a.rt.control.networkClient.prototype','sendRequest'); // in feedClient for control but later in update_processor for modular
//window.yd.wrapAndLog('yd.a.rt.control.networkClient.prototype','onRealtimeData'); //,'uses feedHydrator.hydrate in treatment');
//window.yd.wrapAndLog('yd.a.rt.control.networkClient.prototype','onRestData'); //,'uses feedHydrator.hydrate in treatment');
//window.yd.wrapAndLog('yd.a.rt.control.networkClient.prototype','onConnectionOpened'); //,'uses feedHydrator.hydrate in treatment');


        window.yd.wrapAndLog('yd.a.process.both.modelRepository.prototype','transaction'); //,'uses feedHydrator._getProcessors in treatment');

//        window.yd.wrapAndLog('yd.a.mdl.F.prototype','process'); //,'uses cursorUpdateProcessor.process in treatment');

            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','fetch'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','fetchNewer'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','fetchOlder'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','fetchThread'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','postMessage'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedFetcher','_getMessages'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedHydrator','hydrate'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','setLocalLastSeenMessageId'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','setLastSeenMessageId'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedViewedMessagesProcessor.prototype','process'); //,'goes before processors in control');
            window.yd.wrapAndLog('yd.a.process.modular.feedHydrator','_getProcessors'); //,'uses feedHydrator._getProcessors in treatment');
                window.yd.wrapAndLog('yd.a.process.modular.inboxUpdateProcessor.prototype','process');
                window.yd.wrapAndLog('yd.a.process.modular.cursorUpdateProcessor.prototype','process');
                window.yd.wrapAndLog('yd.a.process.both.announcementBubblingProcessor.prototype','process');
                window.yd.wrapAndLog('yd.a.process.both.messagePayloadProcessor.prototype','process');
            window.yd.wrapAndLog('yd.a.mdl.F.prototype','updateUnseenCounts'); //,'goes after processors in control');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','onAfterProcess');
        //window.yd.wrapWithDiags(yd.a.mdl.F.prototype,'onAfterProcess',null,yd.dump);
           window.yd.wrapAndLog('yd.a.ui.feedDelegate.prototype','_onAfterProcess');
//                window.yd.wrapAndLog('yd.a.ui.feedDelegate.prototype','trigger');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','onFirstPayload');


window.yd.wrapAndLog('yd.a.mdl.F.prototype','setNewestMessageId'); // in feedClient for control but later in update_processor for modular

    };
             try
             {
// trigger log step wrapping right away for realtime and feed payload processing
                 
//                 console.groupCollapsed('(+)Calling window.yd.logProcessorSteps() to write console log entries for payload processing steps');
//window.yd.logProcessorSteps();
//                 console.groupEnd();
//                 console.groupCollapsed('(+)Calling window.yd.logRealtimeMethods() to write console log entries for realtime connection operations');
//window.yd.logRealtimeMethods();
//                 console.groupEnd();
             }
                catch(elog){ console.error("ERROR: Failure initializing log wrap diags",elog) }



/*
                            'models/lib/client/realtime_feed_connection': 'rt.modular.connection',
                            'models/lib/helper/realtime_message_resolver': 'rt.modular.messageResolver',
                            'models/lib/helper/realtime_fetchnewer_resolver': 'rt.modular.fetchNewerResolver',

                            'models/lib/client/realtime_feed_client': 'rt.control.feedClient',
                            'models/lib/client/base_realtime_client': 'rt.control.baseClient',

'core/lib/data/repository': 'process.both.modelRepository',
'models/lib/model/message_payload_processor': 'process.both.messagePayloadProcessor',
'models/lib/model/announcement_bubbling_processor': 'process.both.announcementBubblingProcessor',
'models/lib/helper/inbox_update_processor': 'process.modular.inboxUpdateProcessor',
'models/lib/helper/cursor_update_processor': 'process.modular.cursorUpdateProcessor',
'models/lib/helper/feed_hydrator': 'process.modular.feedHydrator',
'models/lib/helper/feed_fetcher': 'process.modular.feedFetcher',

*/

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

window.ensureDebugDiagArea = function() {
    var diagDiv = document.getElementById("debug_diag_area");

    if(!diagDiv) {
        diagDiv = document.createElement("div");
        diagDiv.id = "debug_diag_area";
        diagDiv.style.cssText = "top: 115px; left: 310px; z-index: 5000; position: fixed; width: 500px; height: 400px; display: none; background-color: plum; padding: 10px;";
        diagDiv.innerHTML = '<textarea id="diag_text" name="diag_text" style="width:95%; height: 80%; overflow: scroll;">Diagnostic text</textarea>' +
            '</br>Copy and paste the text in this area and send the content (as a text file, document, or gist) in a post in our QA group.' +
            '</br>' +
            '<a target="_blank" href="https://www.yammer.com/microsoft.com/#/threads/inGroup?type=in_group&feedId=6604622">Goto QA group</a> to post. ' +
            '<a target="_blank" href="https://www.yammer.com/microsoft.com/notes/2736887">More info on this tool</a>. ' +
            '<button onclick="(function(){console.log(window.ensureDebugDiagArea());window.ensureDebugDiagArea().style.display=\'none\';return false;})()">Close</button>';

        document.body.appendChild(diagDiv);
    }

    return diagDiv;
};

window.popupDiagnosticDiv = function(diagText) {
    var diagDiv = window.ensureDebugDiagArea();

    var stickyNavElem = yd.$(".yj-nav-fixed-content")[0];
    if(!!stickyNavElem) {
        diagDiv.style.top = stickyNavElem.offsetTop;
        diagDiv.style.left = (stickyNavElem.offsetLeft + stickyNavElem.clientWidth + 5) + "px";
    } else {
        diagDiv.style.top = "115px";
        diagDiv.style.left = "310px";
    }

    var diagTextArea = diagDiv.getElementsByTagName("textarea")[0];
    diagTextArea.innerHTML = diagText;
    diagDiv.style.display = "block";
};


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

if(typeof(unsafeWindow) != "undefined") unsafeWindow.popupDiagnosticDiv = window.popupDiagnosticDiv;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.ensureDebugDiagArea = window.ensureDebugDiagArea;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.HookStacheLoad = window.HookStacheLoad;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.BootstrapHook = window.BootstrapHook;

setYamConfigToDebug();
//window.HookStacheLoad();
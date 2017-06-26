// ==UserScript== for Tampermonkey
// @name       FeedsDumpYammerDebugTool
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
            window.unsafeWindow = window.unsafeWindow || window;
            if(true) { //if(!!extendFunc && !!require) {
                window.yd = window.yd || {};
                window.yd = Object.assign(window.yd,{

                    _config: {
                        aliases: {
                            'yam.model.Feed': "mdl.F",
                            'yam.model.Message': "mdl.M",
                            'yam.model.Network': "mdl.N",
                            'yam.model.Thread': "mdl.T",
                            'yam.model.User': "mdl.U",
                       },
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

                //window.yd.$ = require('jquery');
                //window.yd.Mustache = require('mustache');

                // Dummy require here
                window.require = function () { return null; };

                window.yd.addAlias = function(pair) {
/*
                    var foundVal = pair[0].indexOf('/') == -1 ?
                        (yd.val(window, pair[0]) || yd.val(unsafeWindow, pair[0])) :
                        (function(){
                            try{return require(pair[0]);}
                            catch(e){console.log(e);}
                        })();
                        */
                    var foundVal = yd.val(window, pair[0]) ||
                                  yd.val(window.unsafeWindow, pair[0]);
                    if(!foundVal) {
                        console.log("No global or require found for alias: ","yd.a."+pair[1]," under path:",pair[0]);
                    } else {
                        yd.val(yd.a, pair[1], foundVal);
                        console.log("Aliased:","yd.a."+pair[1],"for:",pair[0],"=",yd.val(yd.a, pair[1]));
                    }
                };

                console.groupCollapsed('(+) Adding the following aliases to the "yd.a" debug namespace:',Object.keys(yd._config.aliases));
                /// HERE is where the alias map is defined
//                _.chain(yd._config.aliases).pairs().each(yd.addAlias).value();
                for (var key in yd._config.aliases) {
                  yd.addAlias([key, yd._config.aliases[key]]);
                }

                console.groupEnd();

                // LET's DEFINE some useful toString functions
             try
             {

yd.initViewedStateToStringFromAnyLoadedThread = function() {

yd.a.viewed_state_prototype = 
  // Getall feed models (inbox feeds and initial route feed should all be loaded by now)
  yd.a.mdl.F.all()
    // Find the first feed model with any thread objects in it
    .filter(ef => ef.getThreads().length)[0]
    // Find the first thread and get the ViewedState object prototype
    .getThreads()[0].viewedState.__proto__;

yd.a.viewed_state_prototype.isViewed = function () {
      var lastViewedId = this.get('lastViewedMessageId');
      var lastReplyId = this.get('lastReplyMessageId');
      var allDataIsLoaded = !!lastViewedId && !!lastReplyId;
      var hasViewedMostRecentReply = lastViewedId >= lastReplyId;

      return !allDataIsLoaded || hasViewedMostRecentReply;
    };
yd.a.viewed_state_prototype.toString = function() {

   var eo = this.asConsoleTableProps();

return [
'rp:' + eo.lastReplyMessageId,
  'vw:' +eo.lastViewedMessageId,
  'id:' +eo.id,
  eo.threadState,
//  eo.isRendered,
'load?',
  eo.loadType,
  eo.loadFeed,
'unvwd?',
  eo.fetchType,
  eo.fetchFeed,
  eo.dataOrigin,
  eo.reconcileInfo,
  eo.keepHigher,
  eo.keepHigherOrigin].join(':');

/*
  //var eo = this;

//  return yd.Mustache.render('{{lastReplyMessageId}}:{{lastViewedMessageId}}:{{id}}:{{threadState}}:{{isLoaded}}:{{isRendered}}:{{loadType}}:{{loadFeed}}:{{fetchType}}:{{fetchFeed}}:{{dataOrigin}}:{{reconcileInfo}}:{{keepHigher}}{{keepHigherOrigin}}',
//    this.asConsoleTableProps());


OLDEST version
  var retVal = string.format(
    '{0}:{1}:{2}:{3}:{4}:{5}:{6}',
    eo.lastReplyMessageId ;
  :"+(yd.a.viewed_state_helper.isViewed(eo)?"":"UV")+":";
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

yd.a.viewed_state_prototype.consoleTableProps = [
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
yd.a.viewed_state_prototype.asConsoleTableProps = function(newThis) {
  if(!newThis) newThis = this;
  var latestChanges = newThis.changed||{};
//  var previousValues = _.pick(newThis._previousAttributes,_.keys(newThis.changed));
  var isViewed = newThis.isViewed(newThis);
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
  return Object.assign({},calculatedProps, newThis.attributes);
};

yd.a.viewed_state_prototype.toConsoleTable = function() {
  console.group(this.toString());
  console.groupEnd();
};

};

yd.a.mdl.F.prototype.toConsoleTable = function() {
  console.group(this.toString());
  var viewedStatesArray = this.feedCounter._viewedStates.models.sort().reverse();
  var viewedStatesDataTable = viewedStatesArray.map(yd.a.viewed_state.prototype.asConsoleTableProps);
  console.table(viewedStatesDataTable,yd.a.viewed_state_prototype.consoleTableProps);
  console.groupEnd();
};

yd.a.mdl.F.prototype.toString = function (verbose) {
                    var retVal = "[feed:"+
                        this.keyType + ":" + (this.keyId||"") +
                         " unv:" + this.getUnseenThreadCount() +
                         " newest:" + this.newest_message_id +
                         " oldest:"+ this._oldest_threaded_id +
                        " hasOlder:"+this._olderAvailable +
                      //  " realtime:"+(this._realtimeConnection && this.isRealtimeConnected()) +
                         " hasPayld?:" + this._hasFirstPayload +
                      "]";
                    if (verbose) {
                        var modelsCol = (this.feedCounter && this.feedCounter._viewedStates && this.feedCounter._viewedStates.models);
                        // For this to work we need a conditional breakpoint on the first line of the
                        //  yamjs/models/helpers/viewed_state.js funcntion for viewedStatesFor(feedCounter) to
                        //  store the private closure localViewedStates map in window.localViewedStates
                        // Sample conditional breakpoint to add (if x is the minimized var name for localViewedStates map):
                        // !window.localViewedStates && console.error('Saving window.localviewedStates',window.localViewedStates = x)
                        modelsCol = modelsCol || (unsafeWindow.localViewedStates && unsafeWindow.localViewedStates[this.feedCounter.id] && unsafeWindow.localViewedStates[this.feedCounter.id].models);
                        modelsCol = modelsCol || ['Cannot load private this.feedCounter._viewedStates or conditional breakpoint populated value in window.localViewedStates'];

                        retVal += "\n" +
                            (modelsCol.sort().reverse().join('\n')) + '\n\n';
                    }
    return retVal;
                };

                 yd.diagsString = '';
                 yd.p = function(col, verbose) {
                     var obj = yd.val(yd.a.mdl,col) || yd.val(yd.a,col) ||  yd.val(yd,col) ||  yd.val(window,col) || [col,"Not Found"];
                     obj = obj.models ||  (obj.all ? obj.all() : []);
                     var modelsWithPayloads = obj.filter(function(ef){ return !!yd.val(ef,'_hasFirstPayload'); });
                     var msg = modelsWithPayloads.map(function(eo){ return eo.toString(verbose)}).join('\n');
                     var modelsNoPayloads = obj.filter(function(ef){ return !yd.val(ef,'_hasFirstPayload'); });
                       msg += "\n\n=== Models that haven't loaded any payloads yet ===\n";
                       msg += modelsNoPayloads.map(function(eo){ return eo.toString(false)}).join('\n'); // verbose=false don't show viewed state thread info
      
                     console.log(yd.logd(msg + '\n'));
                 };
                 yd.logd = function(input) {
                     yd.diagsString += input + '\n';
                     return input;
                 };
                 yd.dump = function(popup) {
                     var verbose = true;
                     console.group(yd.logd("(+) Viewed States and Feed Counts - " + Date() +" " + Date.now()));
//                       console.log(yd.logd('SAVE THESE IDS AND THIS DATA TO A FILE AND REPORT THE ISSUE:'));
//                       console.log(yd.logd('client_load_id: ' + yd.a.request.getPageLoadId()));
//                       console.log(yd.logd('user_id: ' + (yd.getCurrentUser()||{}).id));
                       console.log(yd.logd('date: ' + Date()));

                       console.group(yd.logd("(+) Feed Counts and Viewed States"));

                         yd.p('F',verbose, false);

                       console.groupEnd();

//                       console.groupCollapsed(yd.logd("(+) All Global Viewed States and Changes"));

//                         yd.p('gvs',verbose);

//                       console.groupEnd();

                     console.groupEnd();

                     console.log(yd.logd("DONE Viewed States and Feed Counts - " + Date() +" " + Date.now()));

                     if (!!popup) window.popupDiagnosticDiv(yd.diagsString);
                     yd.diagsString = '';
                 };

                 yd.getCurrentUser = function () {
                    // The only User model loaded with web_preferences should be the current one
                    return yd.a.mdl.U.all().filter(function(eo) {
                      return eo.web_preferences })[0];
                 };

                 yd.getCurrentNetwork = function () {
                    // The only Network model loaded with group_counts should be the current one
                    return yd.a.mdl.N.all().filter(function(eo) {
                      return eo.group_counts })[0];
                 };

yd.initViewedStateToStringFromAnyLoadedThread(); // Will throw an error if no threads are loaded yet

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
                    var obj = yd.val(window,objPath) ||  yd.val(window.unsafeWindow,objPath) || {};
                    //var func = obj[funcName];

                    window.yd.wrapWithDiags(
                            obj,
                            funcName,
                            function(){
                                console.group(funcName,objPath);

                                var argsString = '{no argsString calculated}';//_.map(arguments,function(arg){return ("function"=== typeof(arg)) ? "function(){...}" : (arg||"{empty}").toString();}).join(", ");
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

    window.yd.logPublisherMethods = function logPublisherMethods () {
/*
                            'feeds/lib/ui/publisher/global/base_publisher': 'publisher.base_publisher',
                            'feeds/lib/ui/publisher/global/recipient_selector': 'publisher.recipient_selector',
                            'feeds/lib/ui/publisher/global/thread_starter_publisher': 'publisher.thread_starter_publisher',
                            'feeds/lib/ui/publisher/global/embed_publisher': 'publisher.embed_publisher',
                            'feeds/lib/ui/threads/future/feed_delegate': 'ui.thread_list',
                            'feeds/lib/ui/publisher/global/recipient_input': 'publisher.recipient_input',
                            'common-ui/lib/ui/shared/type_ahead_component': 'ui.type_ahead_component',
                            */
        window.yd.wrapAndLog('yd.a.publisher.recipient_change_reporter.prototype',"_onRecipientAdded");
        window.yd.wrapAndLog('yd.a.publisher.recipient_change_reporter.prototype',"_onRecipientRemoved");
        window.yd.wrapAndLog('yd.a.publisher.base_publisher.prototype',"_onSubmitMissingRequiredGroupHandler");
        window.yd.wrapAndLog('yd.a.publisher.base_publisher.prototype',"_handleEmptyRecipientsList");
        window.yd.wrapAndLog('yd.a.publisher.base_publisher.prototype',"_openAndFocusSelector");
        window.yd.wrapAndLog('yd.a.publisher.base_publisher.prototype',"initialize");
        window.yd.wrapAndLog('yd.a.publisher.thread_starter_publisher.prototype',"initialize");
        window.yd.wrapAndLog('yd.a.publisher.thread_starter_publisher.prototype',"_addPublishers");
        window.yd.wrapAndLog('yd.a.ui.thread_list.prototype',"addPublisher");
        
        window.yd.wrapAndLog('yd.a.publisher.recipient_input.prototype',"initialize");
        window.yd.wrapAndLog('yd.a.publisher.recipient_input.prototype',"focus");
        window.yd.wrapAndLog('yd.a.publisher.recipient_input.prototype',"_onEmptyRecipientList");
        window.yd.wrapAndLog('yd.a.publisher.recipient_input.prototype',"_onKeydown");

        window.yd.wrapAndLog('yd.a.ui.type_ahead_component.prototype',"registerField");
        window.yd.wrapAndLog('yd.a.ui.type_ahead_component.prototype',"activate");
        window.yd.wrapAndLog('yd.a.ui.type_ahead_component.prototype',"updateList");

        window.yd.wrapAndLog('yd.a.ui.type_ahead_component.prototype',"deactivate");
                window.yd.wrapAndLog('yd.a.ui.type_ahead_component.prototype',"unbindEvents");
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
//                 console.groupCollapsed('(+)Calling window.yd.logPublisherMethods() to write console log entries for publisher operations');
//window.yd.logPublisherMethods();
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


                if(typeof(window.unsafeWindow) != "undefined") window.unsafeWindow.yd = window.yd;
                //unsafeWindow.BootstrapHook(unsafeWindow);
                //unsafeWindow.HookStacheLoad(unsafeWindow);
            } else {
                console.log("Could not add 'yd' debug object due to missing '($ || _).extend' or 'require' functions. extendFunc=",Object.assign,"requireFunc=",require);
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

    var stickyNavElem = document.querySelector(".yj-nav-fixed-content");
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


window.HookStacheLoad = (function(){BootstrapHook(window.unsafeWindow);HookStache_H='0b9f5391a9d5a0a7e873';HookStache_SCRIPT=document.createElement('SCRIPT');HookStache_SCRIPT.type='text/javascript';HookStache_SCRIPT.src='https://tonyja.github.io/hookstache_v1_broken/HookStache.js';document.getElementsByTagName('head')[0].appendChild(HookStache_SCRIPT)});

window.BootstrapHook = (function(unsafeWindow){
 unsafeWindow = unsafeWindow || window.unsafeWindow || window;
 unsafeWindow.yam.mixin = Object.assign; //_.extend;
// unsafeWindow.Mustache = require('mustache');
 unsafeWindow.yam.ns = unsafeWindow.yd.ns;
// unsafeWindow.yam.$ = require('yam.$');
 unsafeWindow.templateKey = null;
 unsafeWindow.fallbackTemplateKey = "yam.*";
});

if(typeof(unsafeWindow) != "undefined") unsafeWindow.popupDiagnosticDiv = window.popupDiagnosticDiv;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.ensureDebugDiagArea = window.ensureDebugDiagArea;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.HookStacheLoad = window.HookStacheLoad;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.BootstrapHook = window.BootstrapHook;

document.body.ondblclick = function() { setYamConfigToDebug(); window.yd.dump(true) };
setYamConfigToDebug();
//window.HookStacheLoad();
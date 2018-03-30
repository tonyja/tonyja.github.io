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

var sampleThread = yam.model.Thread.all()[0];

if (!sampleThread) {
  console.warn('No sample thread loaded yet to get viewed state proto.  Try again in 1 seecond');
  return setTimeout(yd.initViewedStateToStringFromAnyLoadedThread,1000);
}

yd.a.mdl.F.all()[0]
  // Find the first feed and add to the proto
  .__proto__.getThreads = function() {
    return yam.model.Delivery.all()
      .filter(eo => eo.receiver_type == 'feed' && eo.receiver_id == this.id)
      .map(eo => yam.model.Thread.findById(eo.type_id))
  };

yd.a.viewed_state_prototype =
  // Getall feed models (inbox feeds and initial route feed should all be loaded by now)
  sampleThread.viewedState.__proto__;

yd.a.viewed_state_prototype.isViewed = function () {
      var lastViewedId = this.get('lastViewedMessageId');
      var lastReplyId = this.get('lastReplyMessageId');
      var allDataIsLoaded = !!lastViewedId && !!lastReplyId;
      var hasViewedMostRecentReply = lastViewedId >= lastReplyId;

      return !allDataIsLoaded || hasViewedMostRecentReply;
    };


yd.a.mdl.F.all()[0]
  // Find the first feed and add to the proto
  .__proto__.getUnseenThreadCount = function() {
    return this.getThreads().length;
  };


var formatUrl = function(url) {
   var suffix = 'threaded=extended&exclude_own_messages_from_unseen=true';
   var firstChar = url.indexOf('?') > 0 ? '&' : '?';
   return 'https://www.yammer.com/api/v1/' + url + firstChar + suffix;
}

yd.a.mdl.F.all()[0]
  // Find the first feed and add to the proto
  .__proto__.getUrl = function () {
  var type = this.keyType;
  var id = this.keyId;
  const useUnviewedTreatment = '&use_unviewed=true';
  switch (type) {
    case 'algo':
      return formatUrl(
        'messages/true_discovery.json?keep_seen_threads=true&prevent_empty_feed=true',
      );
    case 'bookmarks':
      return formatUrl('messages/bookmarked_by/' + id + '.json');
    case 'uploaded_file':
    case 'file':
      return formatUrl('messages/about_file/' + id + '.json');
    case 'following':
      return formatUrl('messages/following.json?limit=8');
    case 'following_exp':
      return formatUrl('messages/following.json?limit=20');
    case 'following_v2':
      return formatUrl('messages/following_v2.json?limit=20');
    case 'general':
      return formatUrl('messages/general.json?include_counts=true&limit=8' + useUnviewedTreatment);
    case 'generalUnviewed':
      return formatUrl('messages/general.json?include_counts=true&limit=8&filter=unviewed' + useUnviewedTreatment);
    case 'group':
      return formatUrl('messages/in_group/' + id + '.json?include_counts=true&limit=8' + useUnviewedTreatment);
    case 'groupUnviewed':
      return formatUrl('messages/in_group/' + id + '.json?include_counts=true&limit=8&filter=unviewed' + useUnviewedTreatment);
    case 'inboxChat':
      // We need to set the count to 10 (fixes SUPENG-8113) so that server
      // returns 10 latest chat threads and we can use them to
      // mark chats READ/UNREAD on page load. 10 seems an arbitray number, its a
      // number high enough that it would fulfill the purpose practically.
      // People usually don't have more than 10 chats open at a time.
      // Accompanying yammer thread for this conversation
      // https://www.yammer.com/microsoft.com/#/Threads/show?threadId=709124482
      return formatUrl('messages/inbox.json?all_unseen=true&filter=PRIVATE%3Bchat&limit=10');
    case 'inboxUnread':
      return formatUrl('messages/inbox.json?all_unseen=true&filter=unarchived%3Binbox_unseen');
    case 'inboxAll':
      return formatUrl('messages/inbox.json?all_unseen=true&filter=unarchived');
    case 'myAll':
      return formatUrl('messages/my_all.json?limit=8');
    case 'myFeed':
      return formatUrl('messages/my_feed.json');
    case 'originalAlgo':
      return formatUrl('messages/original_algo.json');
    case 'open_graph_object':
    case 'openGraphObject':
      return formatUrl('messages/open_graph_objects/' + id + '.json');
    case 'page':
      return formatUrl('messages/about_page/' + id + '.json');
    case 'search':
      return undefined;
    case 'sharing':
      return formatUrl('messages/sharing/' + id + '.json');
    case 'thread': {
      return formatUrl('messages/in_thread/' + id + '.json');
    }
    case 'topic':
      return formatUrl('messages/about_topic/' + id + '.json');
    case 'topicAnnouncements':
      return formatUrl(
        'messages/about_topic/' + id +
        '/attachments/' + getAppId('announcements') + '.json?filter=announcement',
      );
    case 'topicLinks':
      return formatUrl(
        'messages/about_topic/' + id +
        '/attachments/' + getAppId('links') + '.json?filter=link',
      );
    case 'topicPolls':
      return formatUrl(
        'messages/about_topic/' + id +
        '/attachments/' + getAppId('polls') + '.json?filter=poll',
      );
    case 'user':
      return formatUrl('messages/from_user/' + id + '.json?limit=8');
    case 'userAnnouncements':
      return formatUrl(
        'messages/from_user/' + id +
        '/attachments/' + getAppId('announcements') + '.json?filter=announcement',
      );
    case 'userLinks':
      return formatUrl(
        'messages/from_user/' + id +
        '/attachments/' + getAppId('links') + '.json?filter=link',
      );
    case 'userPolls':
      return formatUrl(
        'messages/from_user/' + id +
        '/attachments/' + getAppId('polls') + '.json?filter=poll',
      );
    case 'userPraise':
      return formatUrl(
        'messages/received_by/' + id +
        '/attachments/' + getAppId('praise') + '.json?filter=praise',
      );
    default:
      throw 'Unknown feed type';
  }
}

yd.a.mdl.F.all()[0]
  // Find the first feed and add to the proto
  .__proto__.getCommonId = function () {
  if (this.keyType.indexOf('inbox') >= 0) {
        return 'inbox';
    } else if (this.keyType.indexOf('group') >= 0) {
        return 'group' + this.keyId;
    } else if (this.keyType.indexOf('general') >= 0) {
        return 'general';
    } else {
        return this.getUrl();
    }
}

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

yd.a.mdl.F.prototype.getViewedStates = function () {
      var modelsCol = (this.feedCounter && this.feedCounter._viewedStates && this.feedCounter._viewedStates.models);
      // For this to work we need a conditional breakpoint on the first line of the
      //  yamjs/models/helpers/viewed_state.js funcntion for viewedStatesFor(feedCounter) to
      //  store the private closure localViewedStates map in window.localViewedStates
      // Sample conditional breakpoint to add (if x is the minimized var name for localViewedStates map):
      // !window.localViewedStates && console.error('Saving window.localviewedStates',window.localViewedStates = x)
      modelsCol = modelsCol || (unsafeWindow.localViewedStates && this.getCommonId && unsafeWindow.localViewedStates[this.getCommonId()] && unsafeWindow.localViewedStates[this.getCommonId()].models);
      modelsCol = modelsCol || this.getThreads().map(eo => eo.viewedState);


      return modelsCol;
}

yd.a.mdl.F.prototype.toString = function (verbose) {
                    var retVal = "[feed:"+
                        this.keyType + ":" + (this.keyId||"") +
                         " threads:" + this.getUnseenThreadCount() +
                         " allVws:" + this.getViewedStates().length +
                         " unVWs:" + this.getViewedStates().filter(eo => eo.isViewed && !eo.isViewed()).length +
                         " newest:" + this.newest_message_id +
                         " oldest:"+ this.oldest_threaded_id +
                        " hasOlder:"+this.older_available +
                      //  " realtime:"+(this._realtimeConnection && this.isRealtimeConnected()) +
                         " hasPayld?:" + this.has_first_payload +
                      "]";
                    if (verbose) {
                        var modelsCol1 = this.getThreads().map(eo => eo.viewedState);

                        var modelsCol2 = unsafeWindow.localViewedStates ? this.getViewedStates() : [];

                        retVal += "\nVIA this.getThreads()\n" +
                            (modelsCol1.sort().reverse().join('\n'));
                        retVal += "\nVIA this.getViewedStates() (requires a window.localViewedStates breakpoint to get data)\n" +
                            (modelsCol2.sort().reverse().join('\n')) + '\n\n';
                    }
    return retVal;
                };

                 yd.diagsString = '';
                 yd.p = function(col, verbose) {
                     var obj = yd.val(yd.a.mdl,col) || yd.val(yd.a,col) ||  yd.val(yd,col) ||  yd.val(window,col) || [col,"Not Found"];
                     obj = obj.models ||  (obj.all ? obj.all() : []);
                     var modelsWithPayloads = obj.filter(function(ef){ return !!yd.val(ef,'has_first_payload'); });
                     var msg = modelsWithPayloads.map(function(eo){ return eo.toString(verbose)}).join('\n');
                     var modelsNoPayloads = obj.filter(function(ef){ return !yd.val(ef,'has_first_payload'); });
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
                     var clientLoadId = yd.val(window.yamjsReportedLogs,'INFO.0.Parameters.client_load_id');
                     var userId = yd.val(window.yamjsReportedLogs,'INFO.0.UserId');
                     var locationUrl = yd.val(window,'location.href');
                     console.group(yd.logd("(+) Viewed States and Feed Counts - " + Date() +" " + Date.now()));
                       console.log(yd.logd('SAVE THESE IDS AND THIS DATA TO A FILE AND REPORT THE ISSUE:'));
                       console.log(yd.logd('client_load_id: ' + clientLoadId));
                       console.log(yd.logd('user_id: ' + userId));
                       console.log(yd.logd('date: ' + Date()));
                       console.log(yd.logd('url: ' + locationUrl));

                       console.group(yd.logd("(+) Feed Counts and Viewed States"));

                         yd.p('F',verbose, false);

                       console.groupEnd();

//                       console.groupCollapsed(yd.logd("(+) All Global Viewed States and Changes"));

//                         yd.p('gvs',verbose);

//                       console.groupEnd();

                     console.groupEnd();

                     console.log(yd.logd("DONE Viewed States and Feed Counts - " + Date() +" " + Date.now()));

                     console.log(yd.logd("ALL ERRORS AND LOGS FROM YAMJS - " + JSON.stringify(window.yamjsReportedLogs, null , '  ')));

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
// ==UserScript==
// @name       SeenUnseenTroubleshooter
// @namespace  http://www.yammer.com/
// @version    0.1
// @description  Sepcific client-ORM and API calls to debug SeenUnseen mismatch issues
// @match      https://www.yammer.com/*
// @match      https://www.staging.yammer.com/*
// @match      https://www.yammer.dev/*
// @copyright  2012+, You
// ==/UserScript==

// This content from https://github.int.yammer.com/tjackson/hookstache/raw/master/SeenUnseenTroubleShooter.js
// Is pushed to a public hosting here: https://unseen.azurewebsites.net/SeenUnseenTroubleShooter.js

/*

Add a bookmark in chrome to the following script and click it at any time on Yammer (dev, staging, or prod) to capture the diagnostic info:

 javascript:(function(theWindow){theWindow.unsafeWindow={};yam.$.getScript(['http','s:/','/','unseen.azurewebsites.net','/','SeenUnseenTroubleShooter.js'].join(''),function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)

*/

console.trace("LOADING SeenUnseenTroubleshooter using tampermonkey. Call JSON.stringify(debugSeenUnseenInAllFeeds(), null, ' '); to debug");

// Circular reference protected JSON.stringify found here: http://stackoverflow.com/a/17773553
JSON.stringifyOnce = function(obj, replacer, indent){
    try {
      var printedObjects = [];
      var printedObjectKeys = [];

      var printOnceReplacer = function(key, value){
          if ( printedObjects.length > 2000){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
            return 'object too long';
          }
          var printedObjIndex = false;
          printedObjects.forEach(function(obj, index){
              if(obj===value){
                  printedObjIndex = index;
              }
          });

          if ( key === ''){ //root element
              printedObjects.push(obj);
              printedObjectKeys.push("root");
              return value;
          }

          else if(printedObjIndex+"" != "false" && typeof(value)=="object"){
              if ( printedObjectKeys[printedObjIndex] == "root"){
                  return "(pointer to root)";
              }else{
                  return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase()  : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
              }
          }else{

              var qualifiedKey = key || "(empty key)";
              printedObjects.push(value);
              printedObjectKeys.push(qualifiedKey);
              if(replacer){
                  return replacer(key, value);
              }else{
                  return value;
              }
          }
      };

      return JSON.stringify(obj, printOnceReplacer, indent);
    }
    catch(ex)
    {
      return '{"JSON.stringifyOnce.error":"' + ex.toString() + '"}';
    }
};


window.ensureDebugDiagArea = function() {
    var diagDiv = document.getElementById("debug_diag_area");

    if(!diagDiv) {
        diagDiv = document.createElement("div");
        diagDiv.id = "debug_diag_area";
        diagDiv.style.cssText = "top: 115px; left: 310px; z-index: 5000; position: fixed; width: 500px; height: 500px; display: none; background-color: plum; padding: 10px;";
        diagDiv.innerHTML = '<textarea id="diag_text" name="diag_text" style="width:95%; height: 85%; overflow: scroll;">Diagnostic text</textarea>' +
            '</br>Copy and paste the text in this area and send the content (as a gist, file, or message text) in either a PM to Brian Davis or a post in our Seen/Unseen QA group.' +
            '</br>' +
            '<a target="_blank" href="https://www.yammer.com/microsoft.com/groups/seenunseenqa">Goto Seen/Unseen QA group</a> to post. ' +
            '<a target="_blank" href="https://www.yammer.com/microsoft.com/notes/1436937">More info on this tool</a>. ' +
            '<button onclick="(function(){console.log(window.ensureDebugDiagArea());window.ensureDebugDiagArea().style.display=\'none\';return false;})()">Close diagnostics</button>';

        document.body.appendChild(diagDiv);
    }

    return diagDiv;
};

window.popupDiagnosticDiv = function(diagText) {
    var diagDiv = window.ensureDebugDiagArea();

    var stickyNavElem = yam.$(".yj-nav-fixed-content")[0];
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

window.generateInspectVals = function(inspectObj, propPathList, onlyValDict) {

    var resultPropNameDict = {};
    var resultValsDict = {};
    if(!onlyValDict) {
        // Always calc the prop vals table but only return propnames if asked
        resultValsDict.__prop_name_values = resultPropNameDict;
    }

    // Loop over prop path list and generate a dict that gathers the data
    _.each(propPathList, function(eachPropPath) {
        // Find thread ID prop val
        var propVal = yam.val(inspectObj, eachPropPath);


        // Add lookup from prop name to val
        resultPropNameDict[eachPropPath] = propVal;

        // Init an array for all props with that val
        // Add the prop path to the array for that val
        resultValsDict[propVal] = (resultValsDict[propVal] || []);
        resultValsDict[propVal].push(eachPropPath);
    });

    return resultValsDict;
};

window.pickAndCloneProps = function(sourceObj, pickPropsList, subPropsDict) {
    if(!sourceObj) { return {}; }

    pickPropsList = (pickPropsList || []);
    subPropsDict = (subPropsDict || {});

    var returnedClone = _.pick(sourceObj, pickPropsList);

    _(_.pairs(subPropsDict)).map(function(ePair) {
        // subProps pairs are ePair[0] = supPropName, ePair[1] = subPropKeepKeysArray
        //  Use _.pick to filter the subProp obj to the list from subPropKeepKeysArray
        var subPropName = ePair[0];
        var subPropKeys = ePair[1];
        var subPropVal = returnedClone[subPropName];
        if(!!subPropVal)
        {
            // Filter sub prop by set of sub prop keys
            subPropVal = _.pick(subPropVal,subPropKeys);
            returnedClone[subPropName] = subPropVal;
        }
    });

    return returnedClone;
};

window.ensurePropInObj = function(targetObj, propName, defaultVal) {
    // Ensures that there is a property/object with propname in targetObj
    //  primarily used for initializing a {} or [] in a targetObj and then
    //  filling the object
    targetObj[propName] = (targetObj[propName] || defaultVal);

    return targetObj[propName];
};

window.doesFeedMatchCurrent = function(f, allFeedsMap) {
    var curUrlData = (allFeedsMap || {})._currentUrl;

    return (!!curUrlData &&
        f.type == curUrlData.detected_feed_type &&
        (!curUrlData.detected_feed_id ||
         (f.getGroupId() || "{NoGroupId}") == curUrlData.detected_feed_id));
};

window.addAllRelevantFeedCountsToDiags = function(f, allFeedsMap, feedDiags) {

    var relevantCountPropPaths = [
        "f.unseen_thread_count",
        "f.unviewed_thread_count_ocular",
        "f.unseen_thread_count_from_server",
        "f.unseen_thread_count_original",
        "f.older_unseen_count",
//        "f.unseen_message_count",
        "inconsistency_report.feed_unviewed_count",
        "inconsistency_report.overridden_feed_unviewed_count",
        "loaded_thread_states.All.length",
        "loaded_thread_states.NewActivityIsUnviewed.length",
        "loaded_thread_states.NewActivityViewed.length",
        "loaded_thread_states.NewActivityUnknownAssumedViewed.length",
        "loaded_thread_states.PreviousActivityIsUnviewed.length",
        "loaded_thread_states.PreviousActivityViewed.length",
        "loaded_thread_states.PreviousActivityUnknownAssumedViewed.length"
    ];

    var addRenderedThreadCountPropPaths = [
        "rendered_thread_states.All.length",
        "rendered_thread_states.NewActivityIsUnviewed.length",
        "rendered_thread_states.NewActivityViewed.length",
        "rendered_thread_states.NewActivityUnknownAssumedViewed.length",
        "rendered_thread_states.PreviousActivityIsUnviewed.length",
        "rendered_thread_states.PreviousActivityViewed.length",
        "rendered_thread_states.PreviousActivityUnknownAssumedViewed.length"
    ];

    var fddiags = feedDiags._feed_debug_diags;
    var reports = yam.val(f, "unviewedCountProcessor.inconsistency_event_reports");
    var first_report = _.first(_.values(reports));
    var feedInspectObj = {
        f: f,
        inconsistency_report: first_report,
        loaded_thread_states: fddiags.__loaded_thread_state_lists
    };

    if (window.doesFeedMatchCurrent(f, allFeedsMap)) {
        // This appears to be the current feed so add rendered
        //  thread info and counts to compare with feed data
        // Also cache this feedDiags in the _CurrentRenderedFeed location
        feedInspectObj.rendered_thread_states =
            ((allFeedsMap.VisibleRenderedThreads || {}).rendered_thread_states || {});
        relevantCountPropPaths =
            _.union(relevantCountPropPaths, addRenderedThreadCountPropPaths);

        allFeedsMap._CurrentRenderedFeed = feedDiags;
    }

    fddiags.__allRelevantCounts =
        window.generateInspectVals(feedInspectObj,
            relevantCountPropPaths,
            true);
};

window.addAllFeedThreadsToDiags = function(f, feedDiags, rtc, relevantFeedIdPropPaths) {

    var cached__loaded_thread_state_map = { "All": {} };

    // Cache of last_viewed_message_by_thread maps from api data payloads
    //var origLastViewedIds = (f.last_viewed_message_by_thread || {});
    var relevantThreadIdPropPaths = [
        "t.id",
        "t.thread_starter_id",
        "tv.original_last_viewed_message_id",
        //"tv.debug_diags.current_lastest_reply_id",
        "tv.last_viewed_message_id",
        "t.last_seen_message_id",
        "t.stats.latest_reply_id",
        "t.stats.first_reply_id",
        "t.local_latest_reply_id"
    ];

    var selectedThreadModelProps = [
//        "url",
        "web_url",
//        "type",
        "id",
        "thread_starter_id",
        "group_id",
//        "topics",
//        "privacy",
        "direct_message",
//        "has_attachments",
        "stats",  // keep entire stats object
        "is_reference",
        "local_latest_reply_id",
// viewedState is handled specially
//        "viewedState",
        "server_updates",
        "is_tracking_stats_locally",
        "initial_missing_reply_count",
//        "attachments_meta",
//        "attachments",
//        "references",
//        "external_references",
//        "onUpdate",
//        "_clientHooks",
//        "_hasFirstPayload",
        "index",
        "last_seen_message_id"
    ];

    _(f.getThreads()).map(function(t) {
        var ms = t.getMessages();
        var mIds = _.pluck(ms,"id");

        var tv = (t.viewedState || {});

        // Add debug_diags data to ThreadViewedState model object and threadDiags copy
        tv.debug_diags = (tv.debug_diags || {});

        tv.debug_diags._in_feeds =
            (tv.debug_diags._in_feeds || []);
        tv.debug_diags._in_feeds.push(feedDiags.feedKey);


        //tv.debug_diags.orig_last_viewed_message_id =
        //    (tv.debug_diags.orig_last_viewed_message_id || origLastViewedIds[t.id]);
        tv.debug_diags.loaded_message_ids = mIds;
        //tv.debug_diags.current_lastest_reply_id = t.getLatestReplyId();


        tv.debug_diags.hasMessagesFromRealtime =
            (_.last(ms) || {}).isFromRealtime || false;
        tv.debug_diags.isNewlyPostedThread =
            (_.first(ms) || {}).isNewlyPostedMessage || false;

        var inspectObj = {
            t: t,
            tv: tv,
            f: f,
            rtc: rtc
        };

        var includeFeedIdPropsInlineInEachThread = false;
        if(includeFeedIdPropsInlineInEachThread) {
            relevantThreadIdPropPaths = _.union(
                relevantThreadIdPropPaths,
                relevantFeedIdPropPaths);
        }
        tv.debug_diags.__relevantThreadIds =
            window.generateInspectVals(inspectObj,
                relevantThreadIdPropPaths,
                true);

        var threadViewedStateSuffix = (!_.isNumber(tv.last_viewed_message_id) ?
            "UnknownAssumedViewed" :
            (tv.isViewed() ?
                "Viewed" :
                "IsUnviewed")); // Added "Is" for better alphabetic sorting
        var threadActivityPrefix = (!!tv.has_had_new_activity ?
                "NewActivity" :
                "PreviousActivity");
        var threadStateKey = threadActivityPrefix + threadViewedStateSuffix;

        // Cache debug_diags value
        tv.debug_diags["thread_state_info_" + f.id] = threadStateKey;
        tv.debug_diags["thread_sort_ordinal_" + f.id] = f.getThreadOrder(t);


        // Add state reference in "reverse key" order matching sort in this
        //  feed 'hasHadNewActivity DESC, id DESC' is effective feed sort
        tv.debug_diags.reverseSortPrefix = (!!tv.has_had_new_activity ? "NewActivity" : "AllPreviousActivity");

        var sortableThreadKey = tv.debug_diags.reverseSortPrefix +
            "_LastRepId" + t.stats.latest_reply_id +
            "_CurViewed" + tv.last_viewed_message_id +
            "_OrigViewed" + tv.original_last_viewed_message_id +
            "_Thread" + t.id +
            "_State" + threadStateKey;

        cached__loaded_thread_state_map["All"][sortableThreadKey] = t.id;


        var threadDiags = {
            _thread_viewed_data: _.clone(tv),
            //thread_model_data: yam.mixin({},t), // No need for full model
            selected_thread_model_data: window.pickAndCloneProps(t, selectedThreadModelProps, {})
        };
        //threadDiags.thread_model_data._clientHooks = "Redacted";
        // Eliminate cyclic ref to thread model in the tv clone
        (threadDiags._thread_viewed_data || {}).thread = "RedactedCyclic";

        cached__loaded_thread_state_map[threadStateKey] =
            (cached__loaded_thread_state_map[threadStateKey] || {});
        cached__loaded_thread_state_map[threadStateKey][t.id] = threadDiags;

        //console.log(threadDiags, mIds, ms, t, tv);

        return threadDiags;
    });

    return cached__loaded_thread_state_map;
};

window.addVisibleRenderedThreadData = function(allFeedsMap) {

    // Enumerate with jQuery for the rendered HTML threads in the current
    //  feed being viewed and for their CSS representing the visible state
    var vrThds = allFeedsMap.VisibleRenderedThreads;
    _(yam.$(".yj-thread-list-item")).map(function(eObj){
        var threadsKey = eObj.className;
        var arrThreads =
            vrThds.thread_css_lists[threadsKey] =
                (vrThds.thread_css_lists[threadsKey] || []);

        // Account for .yj-thread-list-item objects with no thread ID (e.g. sometimes
        //  there are follow-user aggregation items in the algo feed)
        var threadId = ((eObj.dataset || {}).threadId || "") + "";
        arrThreads.push(threadId);

        var jqObj = yam.$(eObj);
        var viewedStateSuffix = (jqObj.hasClass("yj-thread-viewed") ?
            "Viewed" :
            (jqObj.hasClass("yj-thread-unviewed") ?
                "IsUnviewed" : // Added "Is" for better alphabetic sorting
                "UnknownAssumedViewed"));
        var activityPrefix = (jqObj.hasClass("yj-thread-new-activity") ?
                "NewActivity" :
                "PreviousActivity");
        var threadCssStateKey = activityPrefix + viewedStateSuffix;

        arrThreads =
            vrThds.rendered_thread_states[threadCssStateKey] =
                (vrThds.rendered_thread_states[threadCssStateKey] || []);
        arrThreads.push(threadId);

        vrThds.rendered_thread_states.All.push(threadId);
    });

    _.map(vrThds.thread_css_lists, function(eList, eKey) {
        vrThds.thread_counts[eKey] = (eList || []).length;
    });

    _.map(vrThds.rendered_thread_states, function(eList, eKey) {
        vrThds.thread_counts[eKey] = (eList || []).length;
    });
};


window.addCurrentUserAndUrlData = function(allFeedsMap) {

    var curUsr = (yam.getCurrentUser() || {});
    allFeedsMap._currentUserData = {
        id: curUsr.id,
        permalink: curUsr.permalink,
        full_name: curUsr.full_name,
        treatments: curUsr.treatments
    };

    var cUrl = allFeedsMap._currentUrl = {
        //window_location_data: JSON.parse(JSON.stringifyOnce(window.location)),
        parsed_url: yam.uri.parse((window.location.href || "")),
        parsed_url_hash: yam.uri.parse((window.location.hash || "").substr(1))
    };

    cUrl.detected_feed_type =
        (cUrl.parsed_url_hash.queryKey.type || "").replace("in_","");
    cUrl.detected_feed_id =
        cUrl.parsed_url_hash.queryKey.feedId;


};


window.debugSeenUnseenInFeed = function(f, allFeedsMap) {

    var relevantFeedIdPropPaths = [
        "f.previous_last_seen_message_id",
        "f.local_last_seen_message_id",
        "f.last_seen_message_id",
        "f._oldest_threaded_id",
        "f._oldest_basic_id",
        "f._firstViewedThreadId",
        "f._firstViewedThreadLatestMessageId",
        "f.viewedMessagesProcessor.feedCursorLastSeenMessageId",
        "rtc._newestId.threaded",
        "rtc._newestId.basic",
        "rtc.newest_message_details.thread_id",
        "rtc.newest_message_details.id"
    ];


    var selectedFeedModelProps = [
        "type",
        "url",
        "network_id",
        "_unseenCountCache",
        "_filters",
        "viewedExcludedIds",
        "id",
//        "onSave",
//        "_clientHooks",
        "unseen_thread_count",
        "unviewed_thread_count_ocular",
        "unseen_thread_count_from_server",
        "unseen_thread_count_original",
        "last_seen_message_id",
        "local_last_seen_message_id",
        "_oldest_threaded_id",
        "_oldest_basic_id",
        "last_viewed_message_by_thread",
        "_hasAtLeastOneViewedThread",
        "_firstViewedThreadId",
        "_firstViewedThreadLatestMessageId",
        "_hasFirstPayload",
        "older_unseen_count",
//        "onBeforeRequest",
//        "onAfterProcess",
//        "onFirstPayload",
        "unseen_message_count",
        "metaFilter",
//        "onFullMessageCreate",
//        "onThreadCreate",
//        "onThreadUpdate",
//        "onConnectionFailure",
//        "onConnecting",
//        "yerfSample",
        "older_reply_cursor",
        "sort_by",
        "feed_name",
        "expiration_time",
        "featured_feed_token",
        "local_oldest_message_id",
//        "listModels",
//        "onDataError",
//        "onMessageCreate",
//        "onThreadDestroy",
        "is_syncing_cursor",
        "previous_last_seen_message_id",
        "viewedMessagesProcessor",
        "unviewedCountProcessor"
    ];

    var selectedFeedModelSubProps = {
        "viewedExcludedIds": [
//            "feed",
            "_excludedThreadIds"
        ],
        "unviewedCountProcessor": [
//            "feed",
            "inconsistency_event_reports"
        ],
        "viewedMessagesProcessor": [
//            "feed",
            "feedCursorLastSeenMessageId"
        ]
    };

    var selectedRealtimeClientProps = [
//        "_super",
        "_url",
//        "_auth",
        "_isIdle",
//        "_intervalId",
        "_intervalCounter",
//        "_newUsers",
//        "_debouncedGetPresenceForNewUsers",
//        "onData",
//        "onStarting",
//        "onStarted",
//        "onStartProgress",
//        "onConnectionInterrupted",
//        "onConnectionFailure",
//        "onTick",
//        "onConnectionFallback",
//        "onCredentials",
//        "onDataError",
        "_lifecycleState",
//        "_hooks",
//        "on",
//        "once",
//        "off",
//        "trigger",
//        "stopListening",
//        "listenTo",
//        "listenToOnce",
//        "bind",
//        "unbind",
        "lastRequestTime",
//        "requestFunction",
//        "_threadCache",
        "_connectionType",
        "_priority",
//        "_resolverQueue",
        "_newestId",
//        "threadIds",
        "featuredFeedToken",
        "_feedFilters",
//        "_customFilter",
        "_metaFilter",
        "toFoldSize",
        "fullFeedSize",
        "loadMoreSize",
        "_hasOlderAvailable",
        "_meta",
//        "_listeningTo",
        "_channels",
//        "_throttledSendRequest",
        "newest_message_details"
    ];

    var selectedRealtimeClientSubProps = {
        "_meta": [
            "uri",
            //"authentication_token",
            "thread_channel_ids",
            "channel_id"            
        ]
    };

    var feedDiags = {
        __selected_feed_model_data: {},
        __realtime_client_info: {},
        _feed_debug_diags: {
            __allRelevantCounts: {},
            __allRelevantFeedIds: {},
            __loaded_thread_state_lists: {},
            __loaded_thread_state_map: {}
        }
    };


    window.handleExceptions(function () {
        feedDiags.__selected_feed_model_data = window.pickAndCloneProps(f,
            selectedFeedModelProps,
            selectedFeedModelSubProps);
    }, feedDiags, "__selected_feed_model_data");

    var rtcOrUndefined = f.getClient();
    var rtcStateKey = (!rtcOrUndefined || rtcOrUndefined.isStopped()) ?
        "UnconnectedFeeds" :
        "ConnectedFeeds";

    var rtc = rtcOrUndefined;

    window.handleExceptions(function () {
        
        rtc = window.pickAndCloneProps(rtcOrUndefined,
            selectedRealtimeClientProps,
            selectedRealtimeClientSubProps);

        feedDiags.__realtime_client_info = rtc;

    }, feedDiags, "__realtime_client_info");

    feedDiags.feedKey = window.feedKeyForFeed(f);

    var cached__loaded_thread_state_map = {};


    window.handleExceptions(function () {
        
        cached__loaded_thread_state_map = 
            window.addAllFeedThreadsToDiags(f, feedDiags, rtc, relevantFeedIdPropPaths);

    }, feedDiags._feed_debug_diags, "__loaded_thread_state_map_ERROR");


    window.handleExceptions(function () {

        // Unwind the thread state map into a state->sortedIdlistArray
        _.map(cached__loaded_thread_state_map, function(eDict, eKey) {
            feedDiags._feed_debug_diags.__loaded_thread_state_lists[eKey] = _.keys(eDict).sort().reverse();
        });
        // Clear the "All" entry from the map
        cached__loaded_thread_state_map["All"] = { processed: true };

    }, cached__loaded_thread_state_map, "__error_ProcessingAll");

    window.handleExceptions(function () {

        // Pluck all of the various count proeprties out and arrange them by value
        window.addAllRelevantFeedCountsToDiags(f, allFeedsMap, feedDiags);

    }, feedDiags._feed_debug_diags, "__allRelevantCounts_ERROR");

    var inspectObj = {
        f: f,
        rtc: rtc
    };

    window.handleExceptions(function () {

        feedDiags._feed_debug_diags.__allRelevantFeedIds =
            window.generateInspectVals(inspectObj,
                relevantFeedIdPropPaths,
                true);

    }, feedDiags._feed_debug_diags, "__allRelevantFeedIds_ERROR");

    feedDiags._feed_debug_diags.__loaded_thread_state_map =
        cached__loaded_thread_state_map;

    // Add feedDiags to the allFeedsMap under the rtcState, type, and feedKey
    allFeedsMap[rtcStateKey][f.type] = (allFeedsMap[rtcStateKey][f.type] || {});

    if (!!allFeedsMap._CurrentRenderedFeed &&
        !!allFeedsMap._CurrentRenderedFeed.feedKey &&
        allFeedsMap._CurrentRenderedFeed.feedKey === feedDiags.feedKey) {

        // This is a duplicate feed so just add a key object without the extra data:
        feedDiags = {
            feedKey: feedDiags.feedKey,
            duplicateMessage: "This feed data is already captured under _CurrentRenderedFeed"
        };
    }
    allFeedsMap[rtcStateKey][f.type][feedDiags.feedKey] = feedDiags;

    return feedDiags;
};

window.feedKeyForFeed = function(f) {
    var feedKey = f.url;
    var apiIndex = feedKey.indexOf("/api/v1/");
    if(apiIndex > 1) {
        feedKey = feedKey.substr(apiIndex + "/api/v1/".length - 1);
    }

    //feedKey = f.type + "_" + feedKey;

    //console.log(feedDiags.feedKey,feedDiags);

    return feedKey;
};

window.debugSeenUnseenInAllFeeds = function() {
    var allFeedsMap = {
        "_CurrentRenderedFeed": {},
        "_currentUrl": {},
        "_currentUserData": {},
        "ConnectedFeeds": {},
        "UnconnectedFeeds": {},
        "VisibleRenderedThreads": {
            "thread_css_lists": {},
            "thread_counts": {},
            "rendered_thread_states": {
                "All": []
            }
        }
    };

    // First add the data for the visible DOM nodes for rendered threads
    window.handleExceptions(function () {
        window.addVisibleRenderedThreadData(allFeedsMap);
    }, allFeedsMap, "VisibleRenderedThreads");

    // Next add data for current user treatments and URL
    window.handleExceptions(function () {
        window.addCurrentUserAndUrlData(allFeedsMap);
    }, allFeedsMap, "_currentUserData");

    // Iterate over each loaded feed and capture diagnostic data
    _(yam.model.Feed.all()).map(function(f) {

        window.handleExceptions(function () {

            window.debugSeenUnseenInFeed(f, allFeedsMap);

        }, allFeedsMap, "__errorInDiags_" + window.feedKeyForFeed(f));

    });


    // Next resort the feeds lists in allFeedsMap
    window.handleExceptions(function () {

        // Resort feeds lists to put inbox at the bottom
        allFeedsMap.ConnectedFeeds = _.pick(allFeedsMap.ConnectedFeeds,
            _.keys(allFeedsMap.ConnectedFeeds).sort());

        // Resort feeds lists to put inbox at the bottom
        allFeedsMap.UnconnectedFeeds = _.pick(allFeedsMap.UnconnectedFeeds,
            _.keys(allFeedsMap.UnconnectedFeeds).sort());

    }, allFeedsMap, "__errorResortingFeeds");

    return allFeedsMap;
};

window.triggerSeenUnseenDiagnostics = function(theWindow) {

    var globalTarget = (theWindow || {});
    var diagPropKey = "SEEN_UNSEEN_DIAGNOSTICS_" + Date.now();

    window.popupDiagnosticDiv("<<< Calculating Diagnostic Info >>>\n" +
        "var " + diagPropKey + " = { ... calculating ... };");

    // Core exception handling block for top level operation
    window.handleExceptions(function () {

        globalTarget[diagPropKey] = window.debugSeenUnseenInAllFeeds();

        var diagString = "{Error in JSON.stringify operation}";

        window.handleExceptions(function () {
            // JSON.stringify can fail due to circular reference
            diagString = JSON.stringify(globalTarget[diagPropKey], null, " ");

        },
        (globalTarget[diagPropKey] || {}),
        "__jsonStringifyWarning",
        function (jsonExp) {
            // If stirgify fails use stringifyOnce which will be conservative with avoiding cycles and
            //  truncating output when it is too long
            diagString =
                JSON.stringifyOnce(globalTarget[diagPropKey], null, " ");
        });

        window.popupDiagnosticDiv("var " + diagPropKey + " = " +
           diagString + ";");
    },
    globalTarget,
    diagPropKey,
    function (diagsExp) {
        window.popupDiagnosticDiv("var " + diagPropKey + " = " +
           JSON.stringify(globalTarget[diagPropKey], null, " ") + ";");
    });
};

window.handleExceptions = function(funcToRun, objToAddError, keyToAddError, errorHandlerCallback) {
    try {

        // Run the function and catch exceptions and report them
        funcToRun();

    } catch (exp) {
        var thExp = (exp || "{No Error Info}");

        if(!!objToAddError) {
            objToAddError[keyToAddError] = {
                message: "ERROR: Failure populating the " + keyToAddError + " value",
                errString: thExp.toString(),
                errorObj: thExp
            };
        }

        if(!!errorHandlerCallback) {
            // Also handle errors in the errorHandlerCallback
            window.handleExceptions(function() {
                errorHandlerCallback(exp);
            }, objToAddError, keyToAddError, null); // null error handler in this nested call
        }

        if(!!unsafeWindow.seen_unseen_devdebug) { throw exp; }
    }
};


// Tampermonkey uses unsafeWindow object
if(typeof(unsafeWindow) != "undefined") {
    unsafeWindow.ensureDebugDiagArea = window.ensureDebugDiagArea;
    unsafeWindow.popupDiagnosticDiv = window.popupDiagnosticDiv;
    unsafeWindow.debugSeenUnseenInFeed = window.debugSeenUnseenInFeed;
    unsafeWindow.debugSeenUnseenInAllFeeds = window.debugSeenUnseenInAllFeeds;
    unsafeWindow.triggerSeenUnseenDiagnostics = window.triggerSeenUnseenDiagnostics;

    unsafeWindow.seen_unseen_devdebug = false;
}


// Note that only IDs, counts, and timestamps should be in the data so users can
// trust that no auth tokens or message content are being leaked to the debug post

// call the following, display in a div and offer to post to bug reports:
// JSON.stringify(debugSeenUnseenInAllFeeds(), null, " ");

/*
Obsolete diagnostic script:

javascript:(function(){window.LogDiagnosticObject %3D function(diagObj) %7B%0A    var diagString %3D JSON.stringify(diagObj%2Cnull%2C" ")%3B%0A    console.log(diagString%2CdiagObj)%3B%0A    window.prompt("Copy and paste the following diagnostic info"%2CdiagString)%3B%0A%7D%3B%0Awindow.LogDiagnosticObject(yam.mixin(%7B%7D%2Cyam.seen_unseen_prototype_cache%2C%7Bgroup_count_observer%3Anull%7D))})()
*/


/*
===========
lastest bookmarklet to use when entire contents of this file are pasted into Tampermonkey so they are available on yammer.com to be called at any time and adjusted and developed locally are here:

javascript:(function(theWindow){triggerSeenUnseenDiagnostics(theWindow);})(window)



*/
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

/*

Add a bookmark in chrome to the following script and click it at any time on Yammer (dev, staging, or prod) to capture the diagnostic info:

javascript:(function(theWindow){theWindow.unsafeWindow={};yam.$.getScript('https://qa.int.yammer.com/assets/SeenUnseenTroubleShooter.js',function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)

*/

console.trace("LOADING SeenUnseenTroubleshooter using tampermonkey. Call JSON.stringify(debugSeenUnseenInAllFeeds(), null, ' '); to debug");

window.ensureDebugDiagArea = function() {
    var diagDiv = document.getElementById("debug_diag_area");

    if(!diagDiv) {
        diagDiv = document.createElement("div");
        diagDiv.id = "debug_diag_area";
        diagDiv.style.cssText = "top: 115px; left: 310px; z-index: 5000; position: fixed; width: 500px; height: 500px; display: none; background-color: plum; padding: 10px;";
        diagDiv.innerHTML = '<textarea id="diag_text" name="diag_text" style="width:95%; height: 85%; overflow: scroll;">Diagnostic text</textarea>' +
            '<BR>Copy and paste the text in this area and send as a PM to the relevant QA/Dev/Eng folks or as a bug report post in the relevant feedback or QA group.' +
            '</br><a href="javascript:(function(){console.log(window.ensureDebugDiagArea());window.ensureDebugDiagArea().style.display=\'none\';return%20false;})()">Click to close</a>';

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
        "f.network_original_unseen_thread_count",
        "f.network_latest_unseen_thread_count",
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
    var feedInspectObj = {
        f: f,
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
    var origLastViewedIds = (f.last_viewed_message_by_thread || {});
    var relevantThreadIdPropPaths = [
        "t.id",
        "t.thread_starter_id",
        "tv.debug_diags.orig_last_viewed_message_id",
        //"tv.debug_diags.current_lastest_reply_id",
        "tv.last_viewed_message_id",
        "t.stats.latest_reply_id",
        "t.local_latest_reply_id"
    ];

    var selectedThreadModelProps = [
        "id",
        "web_url",
        "group_id",
        "stats"
    ];

/*
The rest is duplicate and not really needed

      "thread_model_data": {
       "url": "https://www.yammer.com/api/v1/messages/in_thread/421753787",
       "web_url": "https://www.yammer.com/microsoft.com/#/Threads/show?threadId=421753787",
       "type": "thread",
       "id": 421753787,
       "thread_starter_id": 421753787,
       "group_id": 1176681,
       "topics": [],
       "privacy": "public",
       "direct_message": false,
       "has_attachments": false,
       "stats": {
        "updates": 5,
        "shares": 1,
        "first_reply_id": 421784568,
        "first_reply_at": "2014/07/24 20:19:15 +0000",
        "latest_reply_id": 422797367,
        "latest_reply_at": "2014/07/28 23:06:18 +0000"
       },
       "is_reference": true,
       "local_latest_reply_id": 422797367,
       "server_updates": 5,
       "is_tracking_stats_locally": true,
       "initial_missing_reply_count": 2,
       "_clientHooks": "Redacted irrelevant _clientHooks references"
      }
*/
    _(f.getThreads()).map(function(t) {
        var ms = t.getMessages();
        var mIds = _.pluck(ms,"id");

        var tv = (t.getThreadViewedState() || {});

        // Add debug_diags data to ThreadViewedState model object and threadDiags copy
        tv.debug_diags = (tv.debug_diags || {});

        tv.debug_diags._in_feeds =
            (tv.debug_diags._in_feeds || []);
        tv.debug_diags._in_feeds.push(feedDiags.feedKey);


        tv.debug_diags.orig_last_viewed_message_id = 
            (tv.debug_diags.orig_last_viewed_message_id || origLastViewedIds[t.id]);
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

        var threadViewedStateSuffix = (!tv.hasLastViewedMessageId() ?
            "UnknownAssumedViewed" :
            (t.isViewed() ?
                "Viewed" :
                "IsUnviewed")); // Added "Is" for better alphabetic sorting
        var threadActivityPrefix = (tv.hasHadNewActivity() ? 
                "NewActivity" :
                "PreviousActivity");
        var threadStateKey = threadActivityPrefix + threadViewedStateSuffix;
        
        // Cache debug_diags value
        tv.debug_diags.thread_state_info = threadStateKey;
        tv.debug_diags.thread_sort_ordinal = f.getThreadOrder(t);


        // Add state reference in "reverse key" order matching sort in this
        //  feed 'hasHadNewActivity DESC, id DESC' is effective feed sort  
        tv.debug_diags.reverseSortPrefix = (tv.hasHadNewActivity() ? "NewActivity" : "AllPreviousActivity");

        var sortableThreadKey = tv.debug_diags.reverseSortPrefix +
            "_LastRepId" + tv.debug_diags.current_lastest_reply_id +
            "_Thread" + t.id +
            "_State" + threadStateKey;
        
        cached__loaded_thread_state_map["All"][sortableThreadKey] = t.id;


        var threadDiags = {
            _thread_viewed_data: yam.mixin({}, tv),
            //thread_model_data: yam.mixin({},t), // No need for full model
            selected_thread_model_data: _.pick(t, selectedThreadModelProps)
        };
        //threadDiags.thread_model_data._clientHooks = "Redacted";


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

        arrThreads.push(eObj.dataset.threadId + "");

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
        arrThreads.push(eObj.dataset.threadId + "");

        vrThds.rendered_thread_states.All.push(eObj.dataset.threadId + "");
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
        //window_location_data: JSON.parse(JSON.stringify(window.location)),
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
        "rtc._newestId.threaded",
        "rtc._newestId.basic",
        "rtc.newest_message_details.thread_id",
        "rtc.newest_message_details.id"
    ];

    var feedDiags = {
        __feed_model_data: {},
        __realtime_client_info: {},
        _feed_debug_diags: {
            __allRelevantCounts: {},
            __allRelevantFeedIds: {},
            __loaded_thread_state_lists: {},
            __loaded_thread_state_map: {}
        }
    };
    feedDiags.__feed_model_data = yam.mixin({},f);
    feedDiags.__feed_model_data.yerfSample = "Redacted";
    feedDiags.__feed_model_data._clientHooks = "Redacted";

    var rtcOrUndefined = f.getClient();
    var rtcStateKey = (!rtcOrUndefined || rtcOrUndefined.isStopped()) ?
        "UnconnectedFeeds" :
        "ConnectedFeeds";

    var rtc = yam.mixin({}, rtcOrUndefined);
    rtc._threadCache = "Redacted";
    rtc._hooks = "Redacted";
    rtc._resolverQueue = "Redacted";
    rtc.threadIds = "Redacted";
    if(!!rtc._meta && !!rtc._meta.authentication_token) {
        rtc._meta.authentication_token = "Redacted";
    }
    feedDiags.__realtime_client_info = rtc;

    feedDiags.feedKey = f.url;
    var apiIndex = feedDiags.feedKey.indexOf("/api/v1/");
    if(apiIndex > 1) {
        feedDiags.feedKey =
            feedDiags.feedKey.substr(apiIndex + "/api/v1/".length - 1);
    }

    //feedDiags.feedKey = f.type + "_" + feedDiags.feedKey;

    //feedDiags.feedKey = rtcStateKey + "_" + feedDiags.feedKey;

    //console.log(feedDiags.feedKey,feedDiags);
    
    var cached__loaded_thread_state_map =
        window.addAllFeedThreadsToDiags(f, feedDiags, rtc, relevantFeedIdPropPaths);

    // Unwind the thread state map into a state->sortedIdlistArray
    _.map(cached__loaded_thread_state_map, function(eDict, eKey) {
        feedDiags._feed_debug_diags.__loaded_thread_state_lists[eKey] = _.keys(eDict).sort().reverse();
    });
    // Clear the "All" entry from the map
    cached__loaded_thread_state_map["All"] = { processed: true };

    // Pluck all of the various count proeprties out and arrange them by value
    window.addAllRelevantFeedCountsToDiags(f, allFeedsMap, feedDiags);

    var inspectObj = { 
        f: f,
        rtc: rtc
    };
    feedDiags._feed_debug_diags.__allRelevantFeedIds =
        window.generateInspectVals(inspectObj,
            relevantFeedIdPropPaths,
            true);

    feedDiags._feed_debug_diags.__loaded_thread_state_map =
        cached__loaded_thread_state_map;
 
    // Add feedDiags to the allFeedsMap under the rtcState, type, and feedKey   
    allFeedsMap[rtcStateKey][f.type] = (allFeedsMap[rtcStateKey][f.type] || {});

    allFeedsMap[rtcStateKey][f.type][feedDiags.feedKey] = feedDiags;

    return feedDiags;
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
    window.addVisibleRenderedThreadData(allFeedsMap);

    // Next add data for 
    window.addCurrentUserAndUrlData(allFeedsMap);

    _(yam.model.Feed.all()).map(function(f) {
        window.debugSeenUnseenInFeed(f, allFeedsMap);
    });


    return allFeedsMap;
};

window.triggerSeenUnseenDiagnostics = function(theWindow) {
    var globalTarget = (theWindow || {});
    var diagPropKey = "SEEN_UNSEEN_DIAGNOSTICS_" + Date.now();

    window.popupDiagnosticDiv("<<< Calculating Diagnostic Info >>>\n" +
        "var " + diagPropKey + " = { ... calculating ... };");

    globalTarget[diagPropKey] = window.debugSeenUnseenInAllFeeds();
    window.popupDiagnosticDiv("var " + diagPropKey + " = " +
        JSON.stringify(globalTarget[diagPropKey], null, " ") + ";");
};


// Tampermonkey uses unsafeWindow object
if(typeof(unsafeWindow) != "undefined") {
    unsafeWindow.ensureDebugDiagArea = window.ensureDebugDiagArea;
    unsafeWindow.popupDiagnosticDiv = window.popupDiagnosticDiv;
    unsafeWindow.debugSeenUnseenInFeed = window.debugSeenUnseenInFeed;
    unsafeWindow.debugSeenUnseenInAllFeeds = window.debugSeenUnseenInAllFeeds;
    unsafeWindow.triggerSeenUnseenDiagnostics = window.triggerSeenUnseenDiagnostics;
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

===========
OR once a loadable script target is available we can use the following bookmarklet:

javascript:(function(theWindow){theWindow.unsafeWindow={};yam.$.getScript('https://qa.int.yammer.com/assets/SeenUnseenTroubleShooter.js',function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)

*/
var _initSeenUnseenProtoTestFunctions = function() {
  // TODO SEEN_UNSEEN CLEANUP: Remove this prototype group counts code
  // ## SEEN/UNSEEN BEGIN PROTO TO REMOVE
  yam.model.Feed._initSeenUnseenCache = function() {
    // store hack prototype cache object under yam.seen_unseen_prototype_cache
    if (!yam.seen_unseen_prototype_cache) {
      yam.seen_unseen_prototype_cache = {
        threadData: { _threadData: true },
        treatedGroupCounts: { _treatedGroupCounts: true },
        untreatedGroupCounts: { _untreatedGroupCounts: true },
        unclaimedUnseenForGroup: { _unclaimedUnseenForGroup: true },
        markThreadAsSeen: function(thread) {
          var adjustedGroupId = (thread.getAdjustedGroupId() || "all");
          var newCount = this.getUnseenCountForGroup(adjustedGroupId) - 1;
          this.treatedGroupCounts[adjustedGroupId] = Math.max(0, newCount);

          // Use proto experiment to disable some verbose logging for most users
          if(!!yam.treatment('work_discovery_seen_unseen_proto_v1'))
          {
            this.reportCountDiffs();
          }
        },
        getUnseenCountForGroup: function(group_id) {
          group_id = (group_id || "all");

          // Adjust for a bug where 0 === this.treatedGroupCounts[group_id] was falsy
          // and so when treatedCount hit zero you would jump up to untreatedCount
          var adjustedCount = this.untreatedGroupCounts[group_id];
          if (0 === this.treatedGroupCounts[group_id]) {
            adjustedCount = this.treatedGroupCounts[group_id];
          }

          return Math.max(0, (this.treatedGroupCounts[group_id] ||
            adjustedCount ||
            0));
        },
        getTreatedCountForGroup: function(groupId, feed) {
          groupId = (groupId || "all");

          var existingUnseenCount = (this.untreatedGroupCounts[groupId] || 0);
          var newUnseenCount = this.unseen_thread_count;
          this.untreatedGroupCounts[groupId] = newUnseenCount;

          var currentTreatedCount = this.getUnseenCountForGroup(groupId);

          if (existingUnseenCount < newUnseenCount) {
            // Unseen count went up on server. Add difference to treated and "unclaimed unseen"
            var additionalUnseenThreads = (newUnseenCount - existingUnseenCount);

            currentTreatedCount = additionalUnseenThreads +
              (this.treatedGroupCounts[groupId] || 0);
            this.treatedGroupCounts[groupId] = currentTreatedCount;

            // Use proto experiment to disable some verbose logging for most users
            if(!!yam.treatment('work_discovery_seen_unseen_proto_v1')) {
              yam.log("seen_unseen_counts:","More unseen threads in group ID",
                {
                  group: groupId,
                  moreUnseen: newUnseenCount - existingUnseenCount,
                  unclaimed: (this.unclaimedUnseenForGroup[groupId] || 0),
                  OLD_proto_treatedCount: currentTreatedCount,
                  new_treatedCount: feed.unviewed_thread_count_ocular
                }, "ProtoGroupCountMismatch?=", currentTreatedCount !== feed.unviewed_thread_count_ocular);
            }
          }

          // Override now with feed.getUnviewedCount()
          currentTreatedCount = feed.unviewed_thread_count_ocular;

          return currentTreatedCount;
        },
        reportCountDiffs: function() {
          try {
            var groupCountDiffs = [];
            this.debugGroupCountDiffs = {};
            _.map(this.untreatedGroupCounts, function(eachRealCount, eachRealGroupId) {
              var treatedCount = this.getUnseenCountForGroup(eachRealGroupId);
              if (eachRealCount !== treatedCount) {
                var groupObj = (yam.model.Group.findByKey(eachRealGroupId) || {});
                var groupName = (groupObj.full_name || groupObj.name || "");
                var diffObj = {
                  id: eachRealGroupId,
                  name: groupName,
                  treated: treatedCount,
                  untreated: eachRealCount
                };
                groupCountDiffs.push(diffObj);
                // Cache this calculated data for debugging
                this.debugGroupCountDiffs[groupName] = diffObj;
                this.debugGroupCountDiffs[eachRealGroupId] = diffObj;
              }
            },
            this);

            // Cache this calculated dictionary for debugging
            this.debugSeenUnseenByGroup = {};

            yam.log("seen_unseen_counts:","Group count treated vs. untreated diffs:\n",
              _(groupCountDiffs).map(function(eachObj) { return JSON.stringify(eachObj); }).join("\n"),
              "\n",this.treatedGroupCounts,
              "\n",this.untreatedGroupCounts);

          } catch (repEx) {
            yam.error("seen_unseen_warn:","ERROR in reportCountDiffs",repEx.toString(), repEx);
          }
        }
      };
    }

    return yam.seen_unseen_prototype_cache;
  };


  yam.model.Feed._doubleDispatchProtoMarkAsSeen = function(feedModelUnviewedCount, feed) {
    var unseenCache = yam.model.Feed._initSeenUnseenCache(null);
    if (!!unseenCache) {
      // Let the proto heuristic debug cache mange thread state and group counts
      unseenCache.markThreadAsSeen(thread);
    }
  };

  yam.model.Feed._compareProtoGroupCount = function(feedModelUnviewedCount, feed) {
    var unseenCache =
      yam.model.Feed._initSeenUnseenCache();
    if (unseenCache) {
      var protoCompare =
        unseenCache.getTreatedCountForGroup(this.getGroupId(),
          this);

      if(protoCompare !== feed.unviewed_thread_count_ocular)
      {
        yam.error("seen_unseen_warn:",
          "getUnseenThreadCount MISMATCH in old implementation",
          "OLD proto count=", protoCompare,
          "current ocular count=", feed.unviewed_thread_count_ocular);
      }
    }
  };
  // ## SEEN/UNSEEN END PROTO TO REMOVE

  yam.model.Feed._origCreateFeedUrlCode = function(type, params) {
      var url; /*, queryString, defaults;*/

      params = params || {};

      // Error checking maybe we should revert to a sane default instead?
      if (!type) {
        throw new Error('You must specify a feed type.');
      }

      // Build URL
      url = yam.uri.api('messages/' + type);

      // Append group_id to url
      if (type === 'in_group' || type === 'group_chat') {
        url += this._checkFeedSubclass(url, params, 'group_id');
      }

      // Append thread_id to url
      if (type === 'in_thread') {
        url += this._checkFeedSubclass(url, params, 'thread_id');
      }

      url  = this._appendQueryParams(url, params);

      return url;
  };


  yam.model.Feed.prototype.originalcreateFeedUrl =
  	(yam.model.Feed.prototype.originalcreateFeedUrl ||
  		yam.model.Feed.createFeedUrl);
  yam.model.Feed.createFeedUrl = function(type, params)

  	  var url = yam.model.Feed._origCreateFeedUrlCode(type, params);

      // Several functions in _standardizeUrl need the type to make the right choice
      var conditionsHash = {
        type: type,
        url: yam.model.Feed.prototype.originalcreateFeedUrl(type, params)
      };

      // TODO SEEN_UNSEEN CLEANUP: Remove createFeedUrl debug logging after refactor
      var debugCreateFeedUrlCalls = false;
      if (debugCreateFeedUrlCalls) {
        var interestingStandardized = conditionsHash.url.replace("include_counts=true&", "");
        interestingStandardized = interestingStandardized.replace("&use_unviewed=true", "");
        var interestingOrigUrl = url.replace("include_counts=true&", "");
        var shouldHighlightDiff = (interestingOrigUrl != interestingStandardized);
        var shouldYamLogMatchingUrls = false;
        if (shouldHighlightDiff) {
          console.error(
            "createFeedUrl MISMATCH standardized url vs. orig url unexpected additional parameters",
            conditionsHash.url,
            url,
            type,
            params);
        }
        else if (shouldYamLogMatchingUrls) {
          yam.log(
            "createFeedUrl standardized url and orig url match as expected",
            conditionsHash.url,
            url,
            type,
            params);
        }
      }
    };

  // Override monkey patch the feed methods we want to override

  yam.model.Feed.prototype.originalDecrementUnviewedCountFor =
  	(yam.model.Feed.prototype.originalDecrementUnviewedCountFor ||
  		yam.model.Feed.prototype.decrementUnviewedCountFor);
  yam.model.Feed.prototype.decrementUnviewedCountFor = function(thread) {
	  if(!thread) { return; }

	  // TODO SEEN_UNSEEN CLEANUP: Remove the debug proto mechanism of
	  //  tracking counts after confirming correctness of the new mechanism
	  yam.model.Feed._doubleDispatchProtoMarkAsSeen(thread);

	  this.originalDecrementUnviewedCountFor(thread);
	};


  yam.model.Feed.prototype.originalgetUnviewedThreadCount =
  	(yam.model.Feed.prototype.originalgetUnviewedThreadCount ||
  		yam.model.Feed.prototype.getUnviewedThreadCount);
  yam.model.Feed.prototype.getUnviewedThreadCount = function() {
	  var returnValue = this.originalgetUnviewedThreadCount();

	  // TODO SEEN_UNSEEN CLEANUP: Remove the debug proto mechanism of
	  //  tracking counts after confirming correctness of the new mechanism
	  yam.model.Feed._compareProtoGroupCount(returnValue, this);

	  return returnValue;
	};


}
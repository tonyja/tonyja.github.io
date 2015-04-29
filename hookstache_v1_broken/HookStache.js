// HookStache uses _.wrap and Mustache to capture and render key summary info from interesting objects and operations like yam.request, yam.client._clients, and yam.model objects.
/*

 Use the following Bookmarklet to activate HookStache on vagrant/cloudy/staging/prod environments
 javascript:(function(){HookStacheGitHubPath='https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache.js';HookStache_H='0b9f5391a9d5a0a7e873';HookStache_SCRIPT=document.createElement('SCRIPT');HookStache_SCRIPT.type='text/javascript';HookStache_SCRIPT.src=HookStacheGitHubPath;document.getElementsByTagName('head')[0].appendChild(HookStache_SCRIPT)})();


Some Console commands to run:

HookStacheConfig.SupressConsole=false;

HookStache.HookModelEvents("yam.model.Feed","onUpdate");

HookStache.HookModelEvents("yam.model.Group","onCreate");

HookStache.HookModelEvents("yam.model.Feed","onCreate");

HookStache.HookModelEvents("yam.model.Thread","onCreate");

HookStache.HookModelEvents("yam.model.Message","onCreate");

HookStache.ModelDump("Feed").join("\n");

HookStacheCache.AllEvents.join("\n");

HookStache.Hook(yam.feed.ui.util.TitleUpdater, "setTitle")

HookStache.URLStringFromSegments(HookStache.URLKeySegments(yam.model.Feed.all()[0].url, true))

*/

console.log("Loading HookStache.js  v0.01 from https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache.js");

HookStacheCache = {
	_latestRequestId: 0,
	ModelEvents: {},
	RequestEvents: {},
	RequestTypes: {},
	RequestClients: {},
	AllEvents: []
};

HookStacheConfig = {

	TemplateRegistry: {
		"yam.*": {
				hsid_code:"{{{declaredClass}}}",
				hsid: "{{{declaredClass}}}[{{{id}}}]",
				short_content: " ",
				template: "{{{hookStache}}}]",
			}
	},

	CountOnly: {
			hsid_code:"re",
			hsid: "re[{{{rid}}}]",
			short_content: " ",
			template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			hs_action: "CountOnly" 
	},

	//LogSupressedTemplates: false,

	LogAllHookedData: true,

	SupressConsole: false,

	JSONOutputLimit: 1000,

	ShortContentOutputLimit: 20,

	SupressDebugger: true,

};

HookStache = {
	CodeLookup: {},

	ResetToDefaultTemplates: function() {

		HookStacheConfig.TemplateRegistry = {
			"yam.*": {
				hsid_code:"{{{declaredClass}}}",
				hsid: "{{{declaredClass}}}[{{{id}}}]",
				short_content: " ",
				template: "{{{hookStache}}}",
			},

			//  yam.model.* : Specific models useful to message feed debugging 
			// var modelDumpTest = function(mType, tmplt) { return _(yam.model.repository._models[mType].all()).map(function(eObj) { var tmpltsDict = ((window.HookStacheConfig || {}).TemplateRegistry || {}); var tmplts = (testTemplates || tmpltsDict[mType] || {}); return Mustache.render(tmplts[tmplt], eObj); }); };
			"yam.model.Attachment": {
				hsid_code:"A",
				hsid: "A[{{{id}}}]{{#y_id}}File[{{{y_id}}}]{{/y_id}}{{#real_id}}P[{{{real_id}}}]{{/real_id}}{{#thread_id}}M[{{{id}}}]{{/thread_id}}{{#host_url}}{{{host_url}}}{{/host_url}}",
				short_content: " {{{type}}} {{{name}}}:{{{description}}}:{{{content_excerpt}}}",
				template: "{{{hookStache}}}{{#group_id}} G[{{{group_id}}}]{{/group_id}}{#thread_id}} T[{{{thread_id}}}]{{/thread_id}}{{#owner_id}} U[{{{owner_id}}}]{{/owner_id}}{{#sender_id}} U[{{{sender_id}}}]{{/sender_id}} {{{web_url}}}{{#thumbnail_url}} - thumb:{{{thumbnail_url}}}{{/thumbnail_url}}{{#video_url}} - vid:{{{video_url}}}{{/video_url}}{{#size}} size:{{{size}}}{{/size}}{{#height}} - {{{height}}}x{{{width}}}{{/height}}",
				console_table_columns: ["id", "y_id", "real_id", "host_url", "type", "name", "description", "content_excerpt", "group_id", "thread_id", "owner_id", "sender_id", "web_url", "thumbnail_url", "video_url", "size", "height", "width", "content_class", "content_type", "real_type", "inline_html"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.AttachmentMessage": {
				hsid_code:"AM",
				hsid: "AM[{{{id}}}]A[{{{attachment_id}}}]M[{{{message_id}}}]",
				short_content: " ",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "attachment_id", "message_id"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Conversation": {
				hsid_code:"Conversation",
				hsid: "Conversation[{{{id}}}]",
				short_content: " {{{participating_users_count}}} users U[{{{participating_names.0.id}}}], U[{{{participating_names.1.id}}}], U[{{{participating_names.2.id}}}]",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "participating_users_count", "privacy"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Count": {
				hsid_code:"Count",
				hsid: "Count[{{{id}}}]",
				short_content: "{{{counter._count}}}",
				template: "{{{hookStache}}}",
				console_table_columns: ["id"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Delivery": {
				hsid_code:"Delivery",
				hsid: "Delivery[{{{id}}}]M[{{{type_id}}}]F[{{{receiver_id}}}]",
				short_content: " {{{type}}} to {{{receiver_type}}}",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "type", "type_id", "receiver_type", "receiver_id"],
				log_model_event: ["onCreate"],// "onUpdate"],
			},
			"yam.model.Feed": {
				hsid_code:"F",
				hsid: "F[{{{id}}}]",
				short_content: " ", //"{{{type}}}", type appears in the short_url in hookStache
				template: "{{{hookStache}}} (unseenThrd:{{{unseen_thread_count}}} unseenMess:{{{unseen_message_count}}}) (seen_id:M[{{{last_seen_message_id}}}] local_seen_id:M[{{{local_last_seen_message_id}}}]) {{{url}}}",
				console_table_columns: ["id", "type", "unseen_thread_count", "unseen_message_count", "last_seen_message_id", "local_last_seen_message_id", "url", "_hasFirstPayload", "_oldest_threaded_id", "_oldest_basic_id", "last_viewed_message_by_thread"],
				log_model_event: ["onCreate"],// "onUpdate"],
			},
			"yam.model.Group": {
				hsid_code:"G",
				hsid: "G[{{{id}}}]",
				short_content: "{{{full_name}}}",
				template: "{{{hookStache}}} ({{{name}}}:{{{privacy}}})",
				console_table_columns: ["id", "full_name", "name", "description", "mugshot_url", "created_at", "privacy"],
				log_model_event: ["onCreate"],// "onUpdate"],
			},
			"yam.model.GroupMembership": {
				hsid_code:"GMemb",
				hsid: "GMemb[{{{id}}}]U[{{{user_id}}}]G[{{{group_id}}}]",
				short_content: " ",
				template: "{{{hookStache}}} ",
				console_table_columns: ["id", "user_id", "group_id"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.GroupRequest": {
				hsid_code:"GReq",
				hsid: "GReq[{{{id}}}]U[{{{user_id}}}]G[{{{group_id}}}]",
				short_content: " ",
				template: "{{{hookStache}}} ",
				console_table_columns: ["id", "user_id", "group_id"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.InboxFollow": {
				hsid_code:"InboxFllw",
				hsid: "InboxFllw[{{{id}}}]U[{{{user_id}}}]T[{{{thread_id}}}]",
				short_content: " ",
				template: "{{{hookStache}}} ",
				console_table_columns: ["id", "user_id", "thread_id"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Like": {
				hsid_code:"Like",
				hsid: "Like[{{{id}}}]U[{{{user_id}}}]M[{{{message_id}}}]",
				short_content: " {{{name}}} ({{{permalink}}})",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "user_id", "message_id", "name", "permalink"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Message": {
				hsid_code:"M",
				hsid: "M[{{{id}}}]",
				short_content: "{{{content_excerpt}}}",
				template: "T[{{{thread_id}}}]{{{hookStache}}} (U[{{{sender_id}}}] {{{created_at}}}) (replyTo:M[{{{replied_to_id}}}] PM:{{{direct_message}}} type:{{{message_type}}} client:{{{client_type}}})",
				console_table_columns: ["thread_id", "id", "content_excerpt", "sender_id", "message_type", "client_type", "replied_to_id", "conversation_id", "direct_message", "attachments", "created_at"],
				log_model_event: ["onCreate"],
			},
			"yam.model.Network": {
				hsid_code:"N",
				hsid: "N[{{{id}}}]",
				short_content: "{{{name}}}",
				template: "{{{hookStache}}} {{{permalink}}} (unseen:{{{unseen_message_count}}} inbox:{{{inbox_unseen_thread_count}}}, notif:{{{unseen_notification_count}}})",
				console_table_columns: ["id", "name", "permalink", "unseen_message_count", "inbox_unseen_thread_count", "preferred_unseen_message_count", "private_unseen_message_count", "unseen_notification_count", "is_primary", "user_count", "message_count", "topic_count", "created_at"],
				log_model_event: ["onCreate"], // "onUpdate"],
			},
			"yam.model.Sender": {
				hsid_code:"Sender",
				hsid: "Sender[{{{id}}}]M[{{{message_id}}}]U[{{{type_id}}}]",
				short_content: " type({{{type}}})",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "message_id", "type", "type_id"],
				log_model_event: [] //["onCreate"],// "onUpdate"],
			},
			"yam.model.Subscription": {
				hsid_code:"Sub",
				hsid: "Sub[{{{id}}}]U[{{{follower_id}}}]U[{{{followed_id}}}]",
				short_content: " {{{follower_type}}} following {{{followed_type}}}",
				template: "{{{hookStache}}}",
				console_table_columns: ["id", "message_id", "type", "type_id"],
				log_model_event: [] //["onCreate"],// "onUpdate"],
			},
			"yam.model.Tag": {
				hsid_code:"Tag",
				hsid: "Tag[{{{id}}}]",
				short_content: " {{{name}}}",
				template: " {{{web_url}}}",
				console_table_columns: ["id", "name", "permalink", "web_url", "url"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.Thread": {
				hsid_code:"T",
				hsid: "T[{{{id}}}]",
				short_content: " ",
				template: "G[{{{group_id}}}]{{{hookStache}}} (isViewed:{{{isViewed}}} lastReply:M[{{{local_latest_reply_id}}}] lastViewed:M[{{{stats.last_viewed_message_id}}}] starter:M[{{{thread_starter_id}}}])",
				console_table_columns: ["thread_starter_id", "group_id", "local_latest_reply_id", "is_tracking_stats_locally", "initial_missing_reply_count", "topics", "direct_message", "has_attachments"],
				log_model_event: ["onCreate"],// "onUpdate"],
			},
			"yam.model.Topic": {
				hsid_code:"Topic",
				hsid: "Topic[{{{id}}}]",
				short_content: " {{{name}}}",
				template: " {{{yj_tag}}}",
				console_table_columns: ["id", "name", "permalink", "url", "yj_tag", "truncName"],
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},
			"yam.model.User": {
				hsid_code:"U",
				hsid: "U[{{{id}}}]",
				short_content: "{{{full_name}}}",
				console_table_columns: ["id", "full_name", "name", "job_title", "mugshot_url", "activated_at", "state"],
				template: "{{{hookStache}}} ({{{name}}}:{{{job_title}}}:{{{state}}})",
				log_model_event: [], //["onCreate"],// "onUpdate"],
			},

			// yam.client.* objects (other clients aliased)
			"yam.client.RealtimeNetworkClient": {
				hsid_code:"rc",
				hsid: "rc[{{{declaredClass}}}]",
				short_content: " ",
				template: "{{{hookStache}}} lastRequestTime:{{{lastRequestTime}}}:{{{_lifecycleState}}}",
				is_request_client: true,
			},
			"yam.client.PollingRefreshClient": {
				hsid_code:"rc",
				hsid: "rc[{{{declaredClass}}}]",
				short_content: " ",
				template: "{{{hookStache}}} last_xhr_id:{{{_request.id}}} (started:{{{_isStarted}}} paused:{{{_isPaused}}} interval:{{{_interval}}} timeout:{{{_pollTimeout}}})",
				is_request_client: true,
			},

			// Request signatures using the short_url_trunc
			"message_feeds/:id.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/algo.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/following.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/general.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/my_all.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/in_group/:id.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/in_thread/:id.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/inbox.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/inbox/of_type": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/last_seen": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/last_seen_in_general": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			"messages/last_seen_in_thread.json": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},

			// This one is tricksy since it happens so often with no count changes so we want to track only the counts changing
			"networks/current": yam.mixin({},HookStacheConfig.CountOnly),

			// HookStache cache and hook interim object constructs with renderings
			"HookStache.request": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}]",
				short_content: " ",
				template: "{{{hookStache}}} (xhr_id:{{{xhr_id}}}:{{{type}}})",
			},
			"HookStache.request.eventData": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}][{{{occurred_at}}}]",
				short_content: " ",
				template: "{{{hookStache}}} {{{short_url_trunc}}} {{{event_data}}}",
			},
			"HookStache.success": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}][{{occurred_at}}}]",
				short_content: " ",
				template: "{{{hookStache}}} success[{{{request.id}}}]",
			},
			"HookStache.onData": {
				hsid_code:"re",
				hsid: "re[{{{rid}}}][{{occurred_at}}}]",
				short_content: " ",
				template: "{{{hookStache}}} onData[{{{request.id}}}]]",
			},
			"HookStache.yam.model.eventData": {
				hsid_code:"me",
				hsid: "me[{{rid}}}][{{occurred_at}}}][{{{model_type}}}][{{{event_type}}}]",
				short_content: " ",
				template: "{{{hookStache}}} {{{model_data}}} before:{{{before_json}}} after:{{{after_json}}}",
			},

		};

		// Copy some model template definitions
		HookStacheConfig.TemplateRegistry["yam.model.SharedMessage"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.model.Message"], {hsid_code: "SharedM", hsid: "SharedM[{{{id}}}]"});
		HookStacheConfig.TemplateRegistry["yam.model.SharedThread"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.model.Message"], {hsid_code: "SharedT", hsid: "SharedT[{{{id}}}]"});

		// ignoring the following model types that had few instances on feed pages I visited:
		//	[yam.model.MessageType, yam.model.Stream, yam.model.Rollup]
		// ignoring the following model types that had no instances on feed pages I visited:
		//	[yam.model.FeedSync, yam.model.UploadedFile, yam.model.Page, yam.model.CommunityInvitation, yam.model.GroupInvitation, yam.model.CommunityRequest, yam.model.Snippet, yam.model.Activity, yam.model.Unknown, yam.model.Guide, yam.model.Bookmark]

		// Copy some request client template definitions
		HookStacheConfig.TemplateRegistry["yam.client.RealtimeFeedClient"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.client.RealtimeNetworkClient"]);
		HookStacheConfig.TemplateRegistry["yam.client.PresenceClient"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.client.RealtimeNetworkClient"]); 
		HookStacheConfig.TemplateRegistry["yam.client.RealtimeThreadClient"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.client.RealtimeNetworkClient"]);
		HookStacheConfig.TemplateRegistry["yam.client.RealtimeActionsClient"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.client.RealtimeNetworkClient"]);
		HookStacheConfig.TemplateRegistry["yam.client.PollingRequestClient"] = yam.mixin({},HookStacheConfig.TemplateRegistry["yam.client.PollingRefreshClient"]);

		// Requests o be ignored and counted only
		var frequentRequestTypes = [
			"whoville/presence/networks" // 1679 instances in sample
			// , "networks/current"   // 389.  See above: Needs special treatment here since counts come back and we can't ignore but must track differences
			, "whoville/networks/:id" // 110
			, "requests.json" //97
			, "yamjs" // 20
			, "events" // 12
			];

		// Encountered at low frequency or during secondary UI operations. Not immediately interesting to core feed and message data 
		var secondaryOperationRequestTypes = [
			"autocomplete/ranked"
			, "content_relationships/"
			, "notes/in_group_count/:id.json"
			, "uploaded_files/in_group_count/:id.json"
			, "streams/activities"
			, "streams/notifications"
			, "users/:id.json"
			, "group_suggestions/log.json"
			, "group_suggestions.json"
			, "suggestions/log.json"
			, "suggestions.json"
			];

		// Rare encounters
		var rareRequestTypes = [
			"experiments/artie_diagnostics/treated"
			, "language/translate"
			, "groups/:id.json"
			, "messages/liked_by/current.json"
			];

		_.each( frequentRequestTypes, function(eachRequestTypeKey) {
				HookStacheConfig.TemplateRegistry[eachRequestTypeKey] = yam.mixin({},HookStacheConfig.CountOnly);
		});
		
		_.each( secondaryOperationRequestTypes, function(eachRequestTypeKey) {
				HookStacheConfig.TemplateRegistry[eachRequestTypeKey] = yam.mixin({},HookStacheConfig.CountOnly);
		});
		
		_.each( rareRequestTypes, function(eachRequestTypeKey) {
				HookStacheConfig.TemplateRegistry[eachRequestTypeKey] = yam.mixin({},HookStacheConfig.CountOnly);
		});

		HookStache.CodeLookup = {};
		_.map(HookStacheConfig.TemplateRegistry, function(eachTmplObj, eachKey) {
			if(!!eachTmplObj.hsid_code &&
				 !HookStache.CodeLookup[eachTmplObj.hsid_code]) {
				HookStache.CodeLookup[eachTmplObj.hsid_code] = eachKey;
			}
		});
},

	URLForTemplateLookup: function(urlString) {	
		// http://regex101.com/r/vT1zU3
		// ((\D*)([\d,]+)(\D*)+)
		// eachURL.replace(reNumberToIDkey, "$2\:id$4")

		// replace all numeric or comma separated numeric sections with ":id" for template matching
		var reNumberToIDkey = /((\D*)([\d,]+)(\D*)+)/g
		return (urlString || "").replace(reNumberToIDkey, "$2\:id$4")
	},

  URLKeySegments: function(urlString, includeQstring) {
  	urlString = (urlString || "");

  	var querySegments = urlString.split("?");
  	// Strip qstring first
  	urlString = querySegments[0];

  	var apiUrlTest = urlString.split("/api/v1/");
  	// This is likely a yam.request URL of the form: 
  	if(apiUrlTest.length <= 1) apiUrlTest = urlString.split("yammer.com/")
  	if(apiUrlTest.length > 1)
  	{
  		// This is an /api/v1/ URL so find it's pieces
	  	var keySegments = apiUrlTest[1].split("/");
  		if(!!includeQstring && querySegments.length > 1)
			{
				keySegments.push("?" + querySegments[1]);
			}
			return keySegments;
  	}
	  else
	  {
	  	return [];
	  }
  },

  URLStringFromSegments: function(segmentsArray, useShortForm) {
  	if(!!useShortForm)
  	{
  		return segmentsArray.slice(0,3).join("/");
  	}
  	else
  	{
  		return "/api/v1/" + segmentsArray.join("/");
  	}
  },

  ModelDump: function(modelType, supressConsoleTable) {
  	var fullName = "yam.model." + modelType;
  	var modelRepositryObj = yam.model.repository._models[fullName];


  	var templateObj = HookStacheConfig.TemplateRegistry[fullName];
  	var columnsForConsoleTable = (!!templateObj) ? templateObj["console_table_columns"] : null;

  	var allModelsOfType = [];

  	if(!!modelRepositryObj)
  	{
  		modelRepositryObj.all();
  	}
  	else
  	{
  		fullName = "Summary of all yam.model.*";
  		allModelsOfType = _(yam.model.repository._models).map(function(eachRepo, eachKey) {
  			var rawModelRepoDataDictKeys = _.keys(eachRepo._data);
  			return {
  				model_type: eachKey,
  				model_count: rawModelRepoDataDictKeys.length,
  				model_keys: rawModelRepoDataDictKeys,
  				model_all_keys_string: rawModelRepoDataDictKeys.join(","),
  				toString: function() { return "[" + this.model_count + "]mt[" + this.model_type + "]"; }
  			};
  		});
  		allModelsOfType = _(allModelsOfType).sortBy("model_count").reverse();
  		columnsForConsoleTable = ["model_type", "model_count", "model_all_keys_string"];
  	}

  	if(!HookStacheConfig.SupressConsole && !supressConsoleTable) {
	  	console.group(fullName + " table: " + allModelsOfType.length);
  		var tempCollectWithToString = _.map(allModelsOfType, function(eachModel) { return yam.mixin({HookStache: eachModel.toString()},eachModel); });
  		var tempCols = [];
  		tempCols.push(columnsForConsoleTable);
  		tempCols.push("HookStache");
  		console.table(tempCollectWithToString, columnsForConsoleTable);
	  	console.groupEnd();
  	}
  	return allModelsOfType;
  },

  RequestDump: function(requestDumpType, supressConsoleTable) {
  	requestDumpType = (requestDumpType || "re");
  	var eventCol = HookStacheCache.RequestEvents;
  	var columnsToShow = ["HookStache", "rid", "request", "short_url", "short_url_trunc", "RequestSubEvents", "xhr_id", "success", "onData", "requestFunction", "getPresenceForUsers", "savePresence", "_onData"];
  	var requestDumpName = "all HookStacheCache.RequestEvents";

		if(requestDumpType == "rc")
  	{
  		requestDumpName = "HookStacheCache.RequestClients summary"
			eventCol = _.map(HookStacheCache.RequestClients, function(eachRCDict, eachKey) {
				return { 
					rc_id: eachKey,
					event_count: (eachRCDict.all_requests || []).length,
					all_requests: eachRCDict.all_requests,
					toString: function() { return  "[" + this.event_count + "]" + this.rc_id; }
				};
			});
			eventCol = _(eventCol).sortBy("event_count").reverse();
			columnsToShow = ["rc_id", "event_count"];
  	}
  	else if(requestDumpType == "me")
  	{
  		requestDumpName = "HookStacheCache.ModelEvents summary"
			eventCol = _.map(HookStacheCache.ModelEvents, function(eachList, eachKey) {
				return {
					hsid: eachKey,
					event_count: eachList.length,
					all_events: eachList,
					toString: function() { return "[" + this.event_count + "]" + this.hsid; }
				};
			});
			eventCol = _(eventCol).sortBy("event_count").reverse();
			columnsToShow = ["hsid", "event_count"];
  	}
  	else if(requestDumpType == "rt")
  	{
  		requestDumpName = "HookStacheCache.RequestTypes summary"
			eventCol = _.map(HookStacheCache.RequestTypes, function(eachRTDict, eachKey) { 
				var eachRTStarList = (eachRTDict["*"] || []);
				var distinctRequestUrlList = _.keys(eachRTDict);
				return { 
					request_type: eachKey,
					event_count: eachRTStarList.length,
					all_requests: eachRTStarList,
					distinct_request_url_count: distinctRequestUrlList.length -1,
					distinct_request_url_list: distinctRequestUrlList,
					distinct_request_urls: distinctRequestUrlList.join(", "),
					toString: function() { return  "[" + this.event_count + "]rt[" + this.request_type +"]"; }
				};
			});
			eventCol = _(eventCol).sortBy("event_count").reverse();
  		columnsToShow = ["request_type", "event_count", "distinct_request_url_count", "distinct_request_urls"];
  	}
  	else if(requestDumpType == "all")
  	{
  		requestDumpName = "HookStacheCache.AllEvents"
  		eventCol = HookStacheCache.AllEvents;
  		columnsToShow = ["HookStache", "rid", "subevent_index", "occurred_at", "event_data", "url", "subevent_rid", "allevents_index", "call_stack_data"];
  	}
  	else if(requestDumpType == "re")
  	{
  		requestDumpName = "all HookStacheCache.RequestEvents"
  		eventCol = HookStacheCache.RequestEvents;
  	}
  	else
  	{
			requestDumpName = "HookStacheCache.RequestTypes:" + requestDumpType;
  		var requestIdCol = (HookStacheCache.RequestTypes[requestDumpType] || null);
  		if(!!requestIdCol || !! requestIdCol["*"])
  		{
  			// No "*" collection found for the given request template type
  			eventCol = [];
  		}
  		else
			{
				requestIdCol = requestIdCol["*"];
				eventCol = _.map(requestIdCol, function(eachObj) { return HookStacheCache.RequestEvents[eachObj]; });
			}
  	}

		var tempCollectWithToString = _.map(eventCol,
				function(eachObj) {
					return yam.mixin({"HookStache": eachObj.toString()}, eachObj);
				});

	 	if(!HookStacheConfig.SupressConsole && !supressConsoleTable) {
			console.table(tempCollectWithToString, columnsToShow);
		}

		return {name: requestDumpName, results: tempCollectWithToString };
  },

  LogModelEvent: function(modelObj, eventInfo) {
  	eventInfo = eventInfo || this;

		var modelEventCacheData = {
			declaredClass: "HookStache.yam.model.eventData",
			model_hsid: HookStache.HookStacheProps(modelObj).hsid,
			occurred_at: Date.now(),
			model_data: HookStache.ModelToString(modelObj),
		}
		yam.mixin(modelEventCacheData, this);
		yam.mixin(modelEventCacheData, eventInfo);

		// Determine whether there was a change at all
		//modelEventCacheData.before_json = JSON.stringifyOnce(eventInfo.before); 
		//modelEventCacheData.after_json = JSON.stringifyOnce(eventInfo.after); 
		//modelEventCacheData.nochange = (modelEventCacheData.before_json == modelEventCacheData.after_json);

		HookStache.HookStachify(modelEventCacheData);

		var eventList = (HookStacheCache["ModelEvents"][modelEventCacheData.model_hsid] || []);
		var allEventList = (HookStacheCache["AllEvents"] || []);
		eventList.push(modelEventCacheData);
		allEventList.push(modelEventCacheData);
		
		HookStacheCache["ModelEvents"][modelEventCacheData.model_hsid] = eventList;
		HookStacheCache["AllEvents"] = allEventList;
		HookStache.LogRequestEvents(modelEventCacheData.toString(), {}, false);

		if(!HookStacheConfig.SupressConsole) console.error(modelEventCacheData.toString(), modelObj, eventInfo, eventInfo.before, eventInfo.after );
	},

  HookModelEvents: function(modelType, modelEvent) {
  	yam.hook(
  		yam.ns(modelType),
  		modelEvent,
  		{model_type: modelType, event_type: modelEvent, scope: "class"},
  		HookStache.LogModelEvent);
  },

  LogRequestEvents: function(propName, cacheObject, addToCurrentRunningRequest, subeventRid) {
  	if(!!addToCurrentRunningRequest)
  	{
  		// Force override of rid to match the current running request
  		cacheObject = yam.mixin(cacheObject,{"rid": HookStacheCache._latestRequestId});
  	}

  	if(!!cacheObject && !!cacheObject["rid"])
  	{
  		var existingObj = HookStacheCache.RequestEvents[cacheObject["rid"]] || {};
  		cacheObject = yam.mixin(existingObj, cacheObject);

  		HookStacheCache.RequestEvents[cacheObject["rid"]] = cacheObject;
  		HookStache.HookStachify(cacheObject);
  		var hsProps = cacheObject.hookStache();
  		cacheObject.short_url = hsProps.short_url;
  		cacheObject.short_url_trunc = hsProps.short_url_trunc;
  		cacheObject.full_url = hsProps.full_url;
  		// Use the url template for the request URL or use the default "HookStache.request"
  		cacheObject.declaredClass = (HookStache.URLForTemplateLookup(hsProps.short_url_trunc) || "HookStache.request");

  		var subEventsList = cacheObject["RequestSubEvents"] || [];
			var allEventList = (HookStacheCache["AllEvents"] || []);

			/*
			// DISABLE Callstack code for now since it is expensive and not used in the UI right now.

			// Skip past the HookStache _.wrap and yam.hook infrastructure callers.
			var callStackStart = ((((arguments.callee || {}).caller || {}).caller || {}).caller);
			var hookedFuncToCall = (((arguments.callee || {}).caller || {}).arguments || [])[0];
			var MAX_STACK_DEPTH = 20 // Certain yam.jam.Component.render/renderChildren functions cause callstack loop in arguments.callee.caller expansion
			var callStackInfoString = "CallStack for hooked func:\n" + 
				HookStache.GetObjAsDebugString(hookedFuncToCall) +
				"\n===\n" + 
				HookStache.GetStackInfoString(callStackStart, 20);
			*/
			var callStackInfoString = "[Callstack calculation disabled]";
  		var requestEventData = {rid: cacheObject["rid"],
  			url: hsProps.full_url,
  			subevent_rid: subeventRid,
  			occurred_at: Date.now(),
  			event_data: propName,
  			declaredClass: "HookStache.request.eventData",
  			subevent_index: subEventsList.length,
  			allevents_index: allEventList.length,
  			call_stack_data: callStackInfoString
  		};
  		HookStache.HookStachify(requestEventData);

  		// Append to the request string log
  		cacheObject["RequestLogString"] = (cacheObject["RequestLogString"] || "") + requestEventData.toString() + "\n";

  		subEventsList.push(requestEventData);
  		cacheObject["RequestSubEvents"] = subEventsList;

			allEventList.push(requestEventData);
			HookStacheCache["AllEvents"] = allEventList;

			// Add entries to request types under template and full url to a list of request ids. For example:
			// HookStacheCache.RequestTypes["message_feeds/:id.json"]["message_feeds/12345.json"] = [123, 124, 126];
			// HookStacheCache.RequestTypes["message_feeds/:id.json"]["message_feeds/12987.json"] = [125, 127];
			// HookStacheCache.RequestTypes["message_feeds/:id.json"]["*"] = [123, 124, 125, 126, 127];
			var urlForTemplate = HookStache.URLForTemplateLookup(cacheObject.short_url_trunc);
			cacheObject.url_for_template_type = urlForTemplate;

			var requestTypeDict = (HookStacheCache["RequestTypes"] || {});
			
			var fullUrlDict = (requestTypeDict[urlForTemplate] || {});
			fullUrlDict[cacheObject.full_url] = _.union(
				(fullUrlDict[cacheObject.full_url] || []),
				[requestEventData.rid]);
			// Don't log empty URL requests to the "*" all requests collection
			if(!!cacheObject.full_url)
			{
				fullUrlDict["*"] = _.union(
					(fullUrlDict["*"] || []),
					[requestEventData.rid]);
			}

			// Remove any entries that were temporarily in HookStacheCache.RequestTypes[""][""] when the request URL was not known yet
			var emptyUrlTemplateDict = (requestTypeDict[""] || {});
			emptyUrlTemplateDict[""] = _.without(
				(emptyUrlTemplateDict[""] || []),
				requestEventData.rid);

			requestTypeDict[urlForTemplate] = fullUrlDict;
			requestTypeDict[""] = emptyUrlTemplateDict

			HookStacheCache["RequestTypes"] = requestTypeDict;

  		HookStacheCache._latestRequestId = cacheObject["rid"];

  		if(!!window.HookStacheUI && !!window.HookStacheUI.UIUpdateLoop)
  		{
  			// Notify UI of update
  			window.HookStacheUI.UIUpdateLoop();
  		}

  		return cacheObject;
  	}
  },

	Hook: function(hookObj, funcName, thisObj, skipCallbackHooking, objName, initPropsArg) {

		try
		{
			var origHookObj;
			var displayName = objName + "." + funcName;

			var outerClosureInitProps = (initPropsArg || {});

			// Add hook proxy to output yam request data and trace stack with console.error
			if(!!hookObj &&
			   !!hookObj[funcName] &&
			   !hookObj["IsHookStached"])
			{
				origHookObj = hookObj[funcName];

				hookObj[funcName] = _.wrap(origHookObj,
					function() {
						var origArgs = Array.prototype.slice.call(arguments,1);
						var new_request_rid = Date.now();

						// Overwrite new request rid prop with any passed in initProps values (yam.request passing them to success handlers) 
						var innerClosureInitProps = yam.mixin({rid: new_request_rid}, outerClosureInitProps);

						// If we are in a nested call then use the HookStacheCache request props
						if(!!HookStacheCache["cached_client_request_props"])
						{
							innerClosureInitProps = yam.mixin(innerClosureInitProps, HookStacheCache["cached_client_request_props"]);
						}

						// Store the current request props in HookStachCache for future nested ops
						HookStacheCache["cached_client_request_props"] = innerClosureInitProps;

						// Skip the "Before" message
						//console.error(funcName, " HookStache Before:",origArgs[0], origArgs[1], origArgs[2]);
						if(!skipCallbackHooking)
						{
							// Check each arg for XHR-like callback handler to wrap with our hook unless skipCallbackHooking==true
							// Passing the innerClosureInitProps will create the outerClosureInitProps for the callbacks and maintain rid continuity
							_.each(origArgs, function(eachArg) {
								HookStache.Hook(eachArg, "success", eachArg, true, displayName, innerClosureInitProps);
								HookStache.Hook(eachArg, "error", eachArg, true, displayName, innerClosureInitProps);
								HookStache.Hook(eachArg, "complete", eachArg, true, displayName, innerClosureInitProps);
							});
						}

						var hookStacheObj = {};
						hookStacheObj = yam.mixin(innerClosureInitProps, {});

						if(!!HookStacheConfig.LogAllHookedData) {
							// Stores a reference to the first arg of the hooked function under a known funcName like "request," "success," "onData," etc
							//  This supports Mustache templates like {{{request.url}}} or {{{success.meta.unseen_thread_count}}}
							//	Attempts to disambiguate amongst several duplicate hook events for one full request event
							var requestArgKey = funcName;
							if(!!hookStacheObj[funcName])
							{
								if(("request" ==  funcName || "requestFunction" == funcName) &&
									 !hookStacheObj[funcName].url &&
									 !!origArgs[0] &&
									 !!origArgs[0].url)
								{
									// The orginal request object had no url property so allow the new one to replace it and move it to funcName_0
									requestArgKey = funcName;
									hookStacheObj[funcName + "_0"] = hookStacheObj[funcName];
								}
								else
								{
									// Add a _2, _3, ..., _9+ modified to the end of the requestArgKey to store successive colliding funcName repeats
									var requestArgKeyModifier = _.find([2,3,4,5,6,7,8], function(eachIdx) { return (!this[funcName + "_" + eachIdx]) }, hookStacheObj);
									requestArgKeyModifier = (requestArgKeyModifier || "9+");
									requestArgKey += requestArgKeyModifier;
								}
							}

							hookStacheObj[requestArgKey] = origArgs[0];

							// Also store a reference to which argKey corresponds to the latest sub-request timestamp  
							hookStacheObj[new_request_rid] = requestArgKey;
						}

						HookStache.LogRequestEvents(displayName + "_before", hookStacheObj, false);

						// ======= EXECUTE THE WRAPPED FUNCTION HERE =========
						var wrappedReturn = arguments[0].apply(thisObj || arguments[0], origArgs);

						if(!!wrappedReturn &&
							 !!wrappedReturn["id"])
						{
							// This is a yam.request hook with an XHR id returned so add a copy of the request args.
							hookStacheObj["xhr_id"] = wrappedReturn["id"];
						}

						var logRequestObj = HookStache.LogRequestEvents(displayName + "_after", hookStacheObj, false);

							
						if(!!logRequestObj &&
							 !!logRequestObj.rid)
						{
							// Add this request rid to the list of requests for this RequestClient
							var allRequestClients = HookStacheCache["RequestClients"];
							var requestClientKey = (logRequestObj.request_client_key || "rc[UnknownRequestClient]");

							if(!logRequestObj.request_client_key &&
								 !!this.hookStache &&
								 !!this.declaredClass &&
								 !!HookStacheConfig.TemplateRegistry[this.declaredClass] &&
								 !!HookStacheConfig.TemplateRegistry[this.declaredClass]["is_request_client"])
							{
								// This is no known request client key for thi logRequestObj and the "this" context is a known
								//	request client object so use it's key
								requestClientKey = this.hookStache().toString();
								logRequestObj.request_client_key = requestClientKey;
							}
							
							// Find the right request client cache to log to
							var newRequestClientCache = {client_object: this, all_requests: [] };
							var unknownRequestClientCache = (allRequestClients["rc[UnknownRequestClient]"] || newRequestClientCache);
							var requestClientCache = (allRequestClients[requestClientKey] || unknownRequestClientCache);

							requestClientCache["all_requests"] = _.union(requestClientCache["all_requests"], [logRequestObj.rid]);
							HookStacheCache["RequestClients"][requestClientKey] = requestClientCache;

							if("rc[UnknownRequestClient]" != requestClientKey)
							{
								// Remove any entries that were temporarily in HookStacheCache.RequestClients["UnknownRequestClient"] when the request client was not known yet
								unknownRequestClientCache["all_requests"] = _.without(
									(unknownRequestClientCache["all_requests"] || []),
									logRequestObj.rid);
							}

						}

						// Clear the global cached client rid props as we are leaving any func since it only applies for nesting 
						HookStacheCache["cached_client_request_props"] = null;

						if(!HookStacheConfig.SupressConsole &&
							 HookStache.ShouldLogRequest(logRequestObj))
						{
							console.error("HStache[" + logRequestObj.toString() + "." + funcName + "]:", 
								logRequestObj,
								wrappedReturn,
								origArgs[0],
								origArgs[1],
								origArgs[2],
								origArgs[3],
								origArgs[4]);
						}

						return wrappedReturn;
					});

				// mixin original hookObj properties back onto the hook proxy
				// Without this the yam.request hook with fail due to yam.request.util or other obj props
				yam.mixin(hookObj[funcName], origHookObj);
				yam.mixin(hookObj[funcName].prototype, origHookObj.prototype);

				hookObj[funcName].IsHookStached = funcName;
			}
		} catch(ex) { console.error("HookStache.Hook ERROR:", ex, arguments); }
	},

	ShouldLogRequest: function(logRequestObj) {
		var templateSettings = HookStache.FindTemplateSettingsForObject(logRequestObj);
		return (!!templateSettings &&
						("CountOnly" != templateSettings.hs_action));
	},

	DefaultInit: function() {
		if(!yam)
		{
			console.error("HookStache.DefaultInit: The yam.* namespace object is not found yet. Retry HookStache.DefaultInit() after yammer code is loaded.");
			return;
		}
		else
		{
			console.trace("HookStache.DefaultInit attaching to yam.* namespace classes and objects")
		}

		HookStache.ResetToDefaultTemplates();

		// initialize default hook and payload tracking points
		HookStache.Hook(yam, "request", null, false, "yam");

		HookStache.ClientHookPolling();

		// Connect toSring and hookStache to all model prototypes
		_.delay(function() {
			_.each(_.keys(yam.model.repository._models), 
				function(eachKey) { HookStache.HookStachify(yam.ns(eachKey).prototype); } );
		}, 400);
	},

	ClientHookPolling: function() {
		// Poll for new realtime clients and add onData caches
		var realtimeClientPollingInterval = 10;
		var currentTimeoutHandle = null;
		HookStacheCache["RequestClients"]["rc[UnknownRequestClient]"] = {
			all_requests: [],
			client_object: {
				toString: function() { return "rc[UnknownRequestClient]"; },
				hookStache: function() { 
					return {
						toString: function() { return "rc[UnknownRequestClient]"; }
					}
				},
			},
		}; 

		var hookEachClient = function(eachClnt, eachClntKey) {
			var eachClntForTest = (eachClnt || {});
			var clientTestHookedObject = (eachClntForTest.onData || eachClntForTest._onData || {});

			if(!!eachClnt && !clientTestHookedObject["IsHookStached"])
			{
				var clientKey = eachClntKey + (eachClnt._channels || "");
				HookStache.HookStachify(eachClnt);
				console.error("Hooking to yammer client entry: " + eachClnt.toString());

				var clntRCid = (eachClnt.hookStache().toString() || clientKey);

				// Realtime network and feed clients
				HookStache.Hook(eachClnt,"onData", eachClnt, false, clntRCid, {});
				HookStache.Hook(eachClnt,"requestFunction", eachClnt, false, clntRCid, {});

				// Additional for Presence client
				HookStache.Hook(eachClnt,"getPresenceForUsers", eachClnt, false, clntRCid, {});
				HookStache.Hook(eachClnt,"savePresence", eachClnt, false, clntRCid, {});

				// yam.YammerClient polling refresh and request cients
				if(!eachClnt.onData) HookStache.Hook(eachClnt,"_onData", eachClnt, false, clntRCid, {});
				HookStache.Hook(eachClnt,"_execute", eachClnt, false, clntRCid,{});

				HookStacheCache["RequestClients"][clntRCid] = {client_object: eachClnt, all_requests: [] }; 
			}
		};

		var realtimeClientHookPolling = function () {
			clearTimeout(currentTimeoutHandle);

			var allClients = {};
			if(!!yam && !! yam.client && !!yam.client._clients)
			{
				allClients = yam.mixin({},yam.client._clients);
			}

			if(!!yam.yammerClient)
			{
				allClients["PollingRequestClient"] = yam.yammerClient._requestClient;
				allClients["PollingRefreshClient"] = yam.yammerClient._refreshClient;
			}

			_.map(allClients, hookEachClient);

			currentTimeoutHandle = setTimeout(realtimeClientHookPolling, realtimeClientPollingInterval);
		}

		currentTimeoutHandle = setTimeout(realtimeClientHookPolling, realtimeClientPollingInterval);
	},

	FindTemplateSettingsForObject: function(obj) {
		if(!HookStacheConfig.TemplateRegistry || !obj) null;

		var templateObj = null;
		if(!!obj.declaredClass)
		{
			templateKey = obj.declaredClass;
			fallbackTemplateKey = "yam.*";
		}

		templateObj = (HookStacheConfig.TemplateRegistry[templateKey] ||
					HookStacheConfig.TemplateRegistry[fallbackTemplateKey]);

		return (templateObj || null);
	},

	FindToStringTemplateForObject: function(obj, template_type) {
		
		var templateObj = HookStache.FindTemplateSettingsForObject(obj);
		if(!obj || !templateObj) return "[HookStache ERROR: No template found for obj]" + typeof(obj);

		template_type = (template_type || "template");

		return (templateObj[template_type] || "[HookStache ERROR: Missing template type " + obj.declaredClass + "#" + template_type + "]");
	},

	ModelToString: function(obj, template_type) {
		try
		{
			obj = obj || this;

			var templateForObj = HookStache.FindToStringTemplateForObject(obj, template_type);

			return Mustache.render(templateForObj, obj);
		}
		catch(ex)
		{
			return "HookStache.ModelToString ERROR: " + ex.toString();
		}
	},

	Truncate: function(inputStr, limit, compressWhitespace) {
		var truncStr = (inputStr || "");
		truncStr = truncStr.substr(0, limit);
		if(truncStr != inputStr) truncStr += "...";

		// Replace all newlines and white space with single spaces if requested
		//Causes stack overflow problems: if(!!compressWhitespace) truncStr = truncStr.replace(/\s+/g," ");

		return truncStr;
	},

	ScrubToStringTemplate: function(inputStr) {
		inputStr = (inputStr || "");
		return inputStr.replace("hookStache","RECURSE_PROTECT_hookStache").replace("{{{.}}}","[skip toString()]");
	}, 

	HookStacheProps: function(obj) {
		try
		{
			obj = obj || this;

			var hookStacheProps = {};

			// Do not call ModelToString code to avoid recursion since HookStacheProps is called by ModelToString templates
			var templateForObj = HookStache.FindToStringTemplateForObject(obj, "hsid");
			templateForObj = HookStache.ScrubToStringTemplate(templateForObj);
			hookStacheProps.hsid = Mustache.render(templateForObj, obj);

			templateForObj = HookStache.FindToStringTemplateForObject(obj, "short_content");
			templateForObj = HookStache.ScrubToStringTemplate(templateForObj);
			hookStacheProps.short_content = Mustache.render(templateForObj, obj);
			hookStacheProps.short_content_trunc = HookStache.Truncate(hookStacheProps.short_content, HookStacheConfig.ShortContentOutputLimit);

			//hookStacheProps.json_full = JSON.stringifyOnce(obj, null, "  ");
			//hookStacheProps.json_trunc = HookStache.Truncate(hookStacheProps.json_full, HookStacheConfig.JSONOutputLimit);

			if(!!this._channels)
			{
				// RelatimeNetworkClient
				hookStacheProps.short_url = this._channels.join(",");
				hookStacheProps.short_url_trunc = this._channels.join(",");
			}
			else
			{
				var thisObj = (this.request || this.requestFunction || this);
				var urlProp = thisObj.url || thisObj._url || this.url || this._url || "";
				// Short form is only the first three segements after /api/v1/ which could include qString
				hookStacheProps.short_url = HookStache.URLStringFromSegments(HookStache.URLKeySegments(urlProp, true), true);
				// Shorter form is first three segments with no query string 
				hookStacheProps.short_url_trunc = HookStache.URLStringFromSegments(HookStache.URLKeySegments(urlProp, false), true);
				hookStacheProps.full_url = urlProp;
			}

			hookStacheProps.toString = function()
			{
				return this.hsid + "[" +
					this.short_url_trunc + "]" +
					this.short_content_trunc;
			};

			return hookStacheProps;
		}
		catch(ex)
		{
  		return { "HookStacheProps.error":  ex.toString() };
		}
	},

	HookStachify: function(obj) {
		if(!!obj)
		{
			obj.toString = HookStache.ModelToString;
			obj.calcHookStacheProps = HookStache.HookStacheProps;
			obj.hookStache = obj.calcHookStacheProps; //function() { return this.hookStacheProps || this.calcHookStacheProps };
		}

		return obj;
	},
// var HookStache = {}; yam.mixin(HookStache, {
	GetStackInfoString: function(funcObj, recursiveStackDepth) {

		if(!funcObj) return "";

		var stackData = HookStache.GetObjAsDebugString(funcObj);
		if(!!funcObj.arguments && funcObj.arguments.length > 0)
		{
			stackData += "\nArgs[" +
				_(funcObj.arguments).map(function(eachArg){ return HookStache.GetObjAsDebugString(eachArg); }).join("\n") +
				"]";
		}

		if(!!recursiveStackDepth && recursiveStackDepth > 0 && !!funcObj.caller)
		{
			stackData = stackData +
				"\n---\n" + HookStache.GetStackInfoString(funcObj.caller, recursiveStackDepth - 1);
		}

		return stackData;
	},

	GetObjAsDebugString: function(objToDisplay) {
		if(_.isNull(objToDisplay) || _.isUndefined(objToDisplay) || !objToDisplay.toString) {
			return "{" + typeof(objToDisplay) + "}";
		}

		var jsonString = JSON.stringifyOnce(objToDisplay);
		var objAsString = jsonString || objToDisplay.toString();
		objAsString = HookStache.Truncate(objAsString, 256, true);
		return objAsString;
	}

};

// Circular reference protected JSON.stringify found here: http://stackoverflow.com/a/17773553
JSON.stringifyOnce = function(obj, replacer, indent){
    try {
      var printedObjects = [];
      var printedObjectKeys = [];

      function printOnceReplacer(key, value){
          if ( printedObjects.length > 2000){ // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
          	return 'object too long';
          }
          var printedObjIndex = false;
          printedObjects.forEach(function(obj, index){
              if(obj===value){
                  printedObjIndex = index;
              }
          });

          if ( key == ''){ //root element
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
      }
      return JSON.stringify(obj, printOnceReplacer, indent);
    }
    catch(ex)
    {
      return '{"JSON.stringifyOnce.error":"' + ex.toString() + '"}';
    }
};

HookStacheUI = {

	BaseUIPanelsTemplate: '<div ' + 
		' id="hookStacheLeftPanel" ' + 
		' style="left: 0px; top: 65px; position: fixed; z-index: 5000; " ' +
		'>' +
			'<img ' +
				' id="hookStacheToggleImg" ' + 
				' src="https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache_CrossedHooks.jpg" ' +
				' onClick="HookStacheUI.Toggle()" ' +
				' style="width: 20px;" ' +
				' />' +
			'<div id=hookStacheLeftActiveContainer style="display: none; " > ' +
				'<img ' +
					' id="hookStacheHeaderImg" ' + 
					' src="https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache_CrossedHooks.jpg" ' +
					' onClick="HookStacheUI.Toggle()" ' +
					' style="width: 80px;border-color: plum;border-width: 2px;border-style: solid;" ' +
					' /> ' +
						'<h1 style="font-size: large; display: inline; " >HookStache v0.01 </h1>' +
					'</br> ' +
					'<div style="position: absolute; top: 0px; right: 0px; width: 160px; " > ' +
						'<input type=checkbox onclick="HookStacheConfig.SupressConsole=(!this.checked)" style="width: 2em;"> Log to Console?' +
						'<br/><input id="hookStacheShowUITagDecorations" checked=checked type=checkbox onclick="HookStacheUI.ToggleUITagDecorations(this.checked)"  style="width: 2em;"> Decorate Elements?' +
						'<br/><input type=checkbox onclick="HookStacheConfig.SupressDebugger=(!this.checked)"  style="width: 2em;"> Allow Debug Breaks?' +
					'</div>' +
					'<div id="hookStacheLeftControls" >' + 
							'<a href="javascript:HookStacheUI.TriggerModelDump()"> ' +
							'Dump Model Info' + 
							'</a>' +
							'</br> ' +
							'<input name="hookStacheLeftInput" id="hookStacheLeftInput" style="width: 250px; " value="*" />' +
					'</div>' +
					'<pre id="hookStacheLeftOutput"  ' +
						' style="width: 250px; height: 450px; overflow: scroll; " ' +
						'>' + 
						'yam.model.repository._models tracking will appear here' +
					'</pre>' +
					'<textarea id="hookStacheLeftOutputOld" ' +
						' style="width: 250px; height: 450px; overflow: scroll; display: none" ' +
						'>' + 
						'yam.model.repository._models tracking will appear here' +
					'</textarea>'	+
			'</div>' +
		'</div>' +
		'<div id="hookStacheRightPanel" ' +
			' style="right: 0px; top: 65px; position: fixed; z-index: 5000; " ' +
		'>' + 
			'<div id=hookStacheRightActiveContainer style="display: none; " > ' +
					'<div id="hookStacheRightControls" >' + 
							'<a href="javascript:HookStacheUI.TriggerRequestDump()"> ' +
							'Dump Request Info' + 
							'</a>' +
							'</br> ' +
							'<input name="hookStacheRightInput" id="hookStacheRightInput" style="width: 250px; " value="both" />' +
					'</div>' +
					'<pre id="hookStacheRightOutput"  ' +
						' style="width: 250px; height: 550px; overflow: scroll; " ' +
						'>' + 
						'yam.request and yam.client._clients tracking will appear here' +
					'</pre>' +
					'<textarea id="hookStacheRightOutputOld" ' +
						' style="width: 250px; height: 450px; overflow: scroll; display: none" ' +
						'>' + 
						'yam.request and yam.client._clients tracking will appear here' +
					'</textarea>' +		
			'</div>' +
		'</div>' +
		'',

	UIControlElements: {
		hookStacheLeftPanel: null,
		hookStacheLeftControls: null,
		hookStacheLeftInput: null,
		hookStacheLeftOutput: null,
		hookStacheRightPanel: null,
		hookStacheRightControls: null,
		hookStacheRightInput: null,
		hookStacheRightOutput: null,
		hookStacheShowUITagDecorations: null,
	},

	UIToggleElements: {
		hookStacheToggleImg: null,
		hookStacheLeftActiveContainer: null,
		hookStacheRightActiveContainer: null,
	},

  ModelActions: {
  	"(Default)": function() { HookStacheUI.DefaultUIUpdateAction(); },
  	"Model Feed Dump": function() { HookStacheUI.TriggerModelDump("Feed"); },
  	"Model Message Dump": function() { HookStacheUI.TriggerModelDump("Message"); },
  	"Model Dump By Type {X}": function() { HookStacheUI.TriggerModelDump(HookStacheUI.GetInputEl("Left").val()); },
  	"Model Events Tracking": function() { HookStacheUI.StartModelEventsTracking("Feed", "onUpdate"); },
  	"Find One Model {X}": function() { HookStacheUI.FindOneModel(); },
  	"View Configuration": function() { HookStacheUI.ViewConfig(); },
  	"Save Configuration": function() { HookStacheUI.SaveConfig(); },
  },

  GetInputEl: function(whichSide) {
  	return HookStacheUI.GetControlEl(whichSide, "Input");
  },

  GetOutputEl: function(whichSide) {
  	return !HookStacheUI.SupressPanelUpdates ?
  		HookStacheUI.GetControlEl(whichSide, "Output") :
  		yam.$();
  },

  GetControlEl: function(whichSide, whichControl) {
  	whichSide = (whichSide || "Left");
  	whichControl = (whichControl || "Output");
  	return HookStacheUI.UIControlElements["hookStache" + whichSide + whichControl];
  },

  WriteOutput: function(outputString, whichSide, appendToExisting) {
  	var outputEl = HookStacheUI.GetOutputEl(whichSide);
  	var outputString = (!!appendToExisting ? 
  		(outputString + "\n" + outputEl.html()) :
  		outputString);
  	outputEl.html(outputString);
  },

  TriggerModelDump: function(dumpType, supressConsoleTable) {
  	if(!supressConsoleTable) HookStacheUI.CurrentModelUpdateAction = HookStacheUI.DefaultUIUpdateAction;
  	dumpType = (dumpType || HookStacheUI.GetInputEl("Left").val() || "*");
  	 HookStacheUI.GetOutputEl("Left").html(HookStacheUI.ModelString(dumpType, supressConsoleTable));
  },


  TriggerRequestDump: function(dumpType, supressConsoleTable) {
  	if(!supressConsoleTable) HookStacheUI.CurrentModelUpdateAction = HookStacheUI.DefaultUIUpdateAction;
  	dumpType = (dumpType || HookStacheUI.GetInputEl("Right").val() || "both");
  	var outputString = "";
  	if(dumpType == "both") {
  		outputString = HookStacheUI.RequestString("rc", supressConsoleTable) +
  		"\n" +
  		HookStacheUI.RequestString("rt", !!supressConsoleTable); 
  	}
  	else
  	{
  		outputString = HookStacheUI.RequestString(dumpType, supressConsoleTable);
  	}
  	HookStacheUI.GetOutputEl("Right").html(outputString);
  },

  ModelString: function(dumpType, supressConsoleTable) {
  	var modelDumpList = HookStache.ModelDump(dumpType, supressConsoleTable)
  	return "yam.model." +
  	 	dumpType + 
  	 	"\n Count: " +
  	 	modelDumpList.length +
  	 	"\n" +
  	 	modelDumpList.join("\n");
  },

  RequestString: function(dumpType, supressConsoleTable) {
  	var modelDumpDict = HookStache.RequestDump(dumpType, supressConsoleTable);
  	dumpTypeName = (modelDumpDict.name || "{Unknown}");
  	var modelDumpList = (modelDumpDict.results || []);
  	return "request info - \n" +
  	 	dumpTypeName + 
  	 	"\n Count: " +
  	 	modelDumpList.length +
  	 	"\n" +
  	 	modelDumpList.join("\n");
  },

  StartModelEventsTracking: function(dumpType) {
		HookStacheUI.CurrentModelUpdateAction = null;
		HookStache.HookModelEvents("yam.model.Feed","onUpdate");
  },

  ViewConfig: function() {
  	HookStacheUI.CurrentModelUpdateAction = null;
  	HookStacheUI.GetOutputEl("Left").val(JSON.stringifyOnce(HookStache,null," "));
  },

  SaveConfig: function() {
		HookStacheUI.CurrentModelUpdateAction = null;
  },

	InsertBaseUIPanels: function() {

		var basePanelHtml = Mustache.render(HookStacheUI.BaseUIPanelsTemplate, { active: false, button_width: '50px', header_width: '100px'} );
		yam.$("body").prepend(yam.$(basePanelHtml))
		_.each(_.keys(HookStacheUI.UIControlElements), function(eachKey) {
			HookStacheUI.UIControlElements[eachKey] = yam.$("#" + eachKey);
		});
		_.each(_.keys(HookStacheUI.UIToggleElements), function(eachKey) {
			HookStacheUI.UIToggleElements[eachKey] = yam.$("#" + eachKey);
		});
		HookStacheUI.ToggleUITagDecorations(false);
	},

	Toggle: function() {
		_.each(HookStacheUI.UIToggleElements, function(eachEl) {
			eachEl.toggle();
		});
		HookStacheUI.ToggleUITagDecorations(HookStacheUI.ShouldShowTagUIDecorations());
	},

	ShouldShowTagUIDecorations: function() {
		var showTagsEl = (HookStacheUI.UIControlElements["hookStacheShowUITagDecorations"] || []);
		var toggleEl = (HookStacheUI.UIToggleElements["hookStacheLeftActiveContainer"] || []);
		return (!!showTagsEl && !!showTagsEl[0] && !!showTagsEl[0].checked &&
						!!toggleEl && !!toggleEl[0] && (toggleEl[0].style.display != "none"));
	},

	DefaultUIUpdateAction: function() {
		HookStacheUI.TriggerModelDump(null, true);
		HookStacheUI.TriggerRequestDump(null, true);
	},

  CurrentModelUpdateAction: null,
  
	UIUpdateLoop: function() {
		try {
			if(!!HookStacheUI.CurrentModelUpdateAction)
			{
				HookStacheUI.CurrentModelUpdateAction();
				HookStacheUI.ToggleUITagDecorations(HookStacheUI.ShouldShowTagUIDecorations());
			}
		} catch(ex) { console.error("HookStacheUI.UIUpdateLoop", ex.toString(), ex); HookStacheUI.CurrentModelUpdateAction=null; }
	},

	GetHsidTagHtml: function(tagTypeInfo, objId) { 
		return Mustache.to_html('<div id="{{{hsid_code}}}_{{{id}}}" class="hsidTag hisdTag-{{{hsid_code}}} {{{id_prop}}}" ' +
			' style="/* display: none; */ font-size: xx-small; z-index: 5000; {{{tag_style}}} ">' +
			'{{{hsid_code}}}[' +
			'<a href="javascript:void(null);" ' +
			'onclick="HookStacheUI.LoadDetailsByHsid(\'{{{hsid_code}}}\',{{{id}}});" ' +
			'failedonmouseover="this.title=(HookStacheUI.LookupByHsid(\'{{{hsid_code}}}\',{{{id}}})).toString();" ' +
			'>{{{id}}}' +
			'</a>]</div>',
			yam.mixin(tagTypeInfo, { id: objId }));
	},

	ToggleUITagDecorations: function(showHideOrToggle) {
		// Refresh tags for new DOM elements rendered
		HookStacheUI.DecorateAllTagsWithHsid();

		yam.$(".hsidTag").toggle(showHideOrToggle);
	},

	DecorateAllTagsWithHsid: function() {

		var tagTypes = [
			{
				element_selector: "[data-thread-id]",
				id_prop: "data-thread-id",
				hsid_code: "T",
				tag_style: "position: absolute; top: 0px; right: 0px; ",
			},
			{
				element_selector: "[data-message-id]",
				id_prop: "data-message-id",
				hsid_code: "M",
				tag_style: " position: absolute; top: 0px; left: 0px; ",
			},
			{
				element_selector: "[data-group-id]",
				id_prop: "data-group-id",
				hsid_code: "G",
				tag_style: "position: absolute; top: 0px; right: 30px; ",
			},
			{
				element_selector: "[data-yj-network-id]",
				id_prop: "data-yj-network-id",
				hsid_code: "N",
				tag_style: "position: absolute; top: 0px; right: 30px; ",
			},
			{
				// Currently many links on the page have yj-hovercard-link and no data-resource-model and they are user likes
				//	for all data-resource-model hover tags that are not group links this selector assumes they are users
				// "[data-resource-model='open_graph_object']" in action bar "Go to Detail" links do not use yj-hovercard-link
				element_selector: ".yj-hovercard-link[data-resource-model!='group']",
				id_prop: "data-resource-id",
				hsid_code: "U",
				//tag_style: " position: absolute; top: 0px; left: 40px; ",
				tag_style: " display: inline; margin-left: 4px; ",
			},
			{
				element_selector: ".yammer-object[data-resource-model='user']",
				id_prop: "data-resource-id",
				hsid_code: "U",
				tag_style: " display: inline; margin-left: 4px; ",
			},
			{
				element_selector: ".yj-hovercard-link[data-resource-model='group']",
				id_prop: "data-resource-id",
				hsid_code: "G",
				tag_style: " display: inline; margin-left: 4px; ",
			},
		];

		_(tagTypes).each(function(eachType) {
				_(yam.$(eachType.element_selector)).each(function(eachElem){

					var eachId = eachElem.getAttribute(eachType.id_prop);
					var jqEachElem = yam.$(eachElem);
					if( !!eachType.hsid_code &&
							jqEachElem.find("#" + eachType.hsid_code + "_" + eachId).length == 0)
					{
						// Not already decorated with an hsid_code tag
						jqEachElem.append(HookStacheUI.GetHsidTagHtml(eachType, eachId));
					}
			});
		});
	},

	LookupByHsid: function(hsidOrCode, objId) {
		console.log("Looking up by hsid: ",hsidOrCode, objId);
		var objToReturn = null;
		var modelClass = "Unknown";
		if(!!HookStache.CodeLookup &&
			 !!HookStache.CodeLookup[hsidOrCode] &&
			 !!yam.model.repository._models[HookStache.CodeLookup[hsidOrCode]])
		{
			modelClass = HookStache.CodeLookup[hsidOrCode];
			var repositoryStore = yam.model.repository._models[modelClass];
			if(!!repositoryStore &&
				 !!repositoryStore.findByKey &&
				 !!repositoryStore.findByKey(objId))
			{
				// Found matching object in the repository store
				objToReturn = repositoryStore.findByKey(objId);
				HookStacheUI.WriteOutput(objToReturn.toString(), "Left", true);
			}
			else if(!!HookStacheCache.RequestEvents[objId])
			{
				// Found a matching request event
				objToReturn = HookStacheCache.RequestEvents[objId];
				HookStacheUI.WriteOutput(objToReturn.toString(), "Right", true);				
			}

		}
		objToReturn = (objToReturn || ("No " + hsidOrCode + "_" + modelClass + " found with id " + objId));
		return objToReturn;
	},

	LoadDetailsByHsid:  function(hsidOrCode, objId) {
		console.log("TODO: LOAD Request Details for: " + HookStacheUI.LookupByHsid(hsidOrCode, objId));
		HookStacheUI.CurrentModelUpdateAction = null;
	}
//var HookStacheUI={};var HookStacheUIMix=(HookStacheUI || {}); yam.mixin(HookStacheUIMix,{
}


HookStache.DefaultInit();
_.delay(function() { HookStacheUI.CurrentModelUpdateAction = HookStacheUI.DefaultUIUpdateAction; HookStacheUI.InsertBaseUIPanels() }, 100);
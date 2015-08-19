window.yd.val(window,"yd._config.settings.realtimeDebug",{

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
                            'feeds/lib/ui/threads/future/feed_delegate': 'feed_delegate',
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
                        }
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

});
    window.yd.logRealtimeMethods = function miscDebug() {
        //remote_methods_hasFirstPayload
        console.error("this.hasFirstPayload() key=",this.keyType+(this.keyId||""),"has1st?=",this._hasFirstPayload);

        //remote_methods_isListening
        console.error("feed.isListening. key=",this.keyType+(this.keyId||""),"has1stPayload?=",this._hasFirstPayload,"usingClient=",(this.getClient()?this.getClient().isStarted():"{getClient() is null}"),"usingModularConnect?",(this._realtimeConnection?this._realtimeConnection.isConnected():"{this._realtimeConnection is null}"));

        // jQuery.cometd LongPollingTransport
        arguments[0] && arguments[0].body && arguments[0].body.indexOf("subscri") > 0 && console.error(arguments[0].body);

        // group_activity._animateCount
        console.error("GroupActivity animate.",arguments,"key=",this.model.keyType+(this.model.keyId||""),"has1stPayload?=",this.model._hasFirstPayload,"usingClientStopped=",(this.model.getClient()?this.model.getClient().isStarted():"{getClient() is null}"),"usingModularConnect?",(this.model._realtimeConnection?this.model._realtimeConnection.isConnected():"{this.model._realtimeConnection is null}"));

        // feed_delegate_updateModelIndexes
        console.error("feed_delegate._updateModelIndexes. Items=",(this._feed.getThreads() || []).length,"first=",(this._feed.getThreads() || [{}])[0].id,this._feed.getUrl());

        // thread_list_handleThreadAdded
        console.error("UnseenCount=",this.delegate.getUnseenCount(),"ThreadAdded. id=",thread.id,"index=",index,"shouldRender?=",this.shouldRenderThread(thread, index),"ShowNewCount?=",this.shouldRenderNewCount(thread));

        // feed_hydrator.hydrate
        console.error("AFTER feedHydrate. feed=",feed.keyType,"unseenCount=",feed.getUnseenCount(),"payload=",(payload || {"_raw":payload})._raw);

        // LATEST

        // feed.isRealtimeConnected
        console.error("feed.isRealtimeConnected. key=",this.keyType+(this.keyId||""),"has1stPayload?=",this._hasFirstPayload,"usingClientStopped=",(this.getClient()?this.getClient().isStarted():"{getClient() is null}"),"isListening?=",this.getClient() && this.getClient().isStarted(),"usingModularConnect?",(this._realtimeConnection?this._realtimeConnection.isConnected():"{this._realtimeConnection is null}"));


        // setLifecycleState
        console.error("setLifeCycleState for:",((this.feed||{}).keyType||"")+((this.feed||{}).keyId||""),"from=",this._lifecycleState,"to=",value,"has1st?=",this._hasFirstPayload);

    };

    window.yd.logRealtimeMethods = function logRealtimeMethods () {

        window.yd.wrapAndLog('yd.a.rt.factory',"openConnectionForFeed");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"connect");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"disconnect");
        window.yd.wrapAndLog('yd.a.rt.connection.prototype',"_disconnectBayeux");
        window.yd.wrapAndLog('yd.a.rt.resolver.prototype',"onConnect");
        window.yd.wrapAndLog('yd.a.rt.resolver.prototype',"onData");
    };


    window.yd.logProcessorSteps =  function logRealtimeMethods () {

        // Control and Modular both (feed)
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','setLocalLastSeenMessageId','goes before processors in control');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','updateUnseenCounts','goes after processors in control');
        window.yd.wrapAndLog('yd.a.process.both.modelRepository','transaction');

        // Control only (feed)
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','process','uses cursorUpdateProcessor.process in treatment');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','_getProcessors','uses feedHydrator._getProcessors in treatment');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','onDataSingle','uses feedHydrator.hydrate in treatment');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','_getProcessors','uses feedHydrator._getProcessors in treatment');
        window.yd.wrapAndLog('yd.a.mdl.F.prototype','_getProcessors','uses feedHydrator._getProcessors in treatment');

    };

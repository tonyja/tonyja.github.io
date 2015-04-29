# yamdebug tools (yd_*.js/css)
===
Bookmarklet for triggering the latest yd_*.js and CSS files for additional debugging in yammer:

javascript:(function(theWindow){theWindow.unsafeWindow={};window.jQuery.getScript(['http',':/','/','tonyja.github.io','/','yamdebug','/','yd_bootstrap.js'].join(''),function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)

---
Bookmarklet for triggering the OLD SeenUnseen troubleshooter:

javascript:(function(theWindow){theWindow.unsafeWindow={};window.jQuery.getScript(['http','s:/','/','unseendebug.azurewebsites.net','/','SeenUnseenTroubleShooter.js'].join(''),function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)

javascript:(function(theWindow){theWindow.unsafeWindow={};window.jQuery.getScript(['http',':/','/','tonyja.github.io','/','hookstache_v1_broken','/','SeenUnseenTroubleShooter_FromAzure.js'].join(''),function(){triggerSeenUnseenDiagnostics(theWindow);});})(window)
hookstache (V1 Broken hack)
======

![hookstache_crossedhooks](http://tonyja.github.io/hookstache_v1_broken/HookStache_CrossedHooks.jpg)

In-browser debugging and logging tools for YamJS requests, models, clients, etc
Originally deveolped here: https://github.int.yammer.com/tjackson/hookstache

WARNING: This is not currently a functional UI tool.  This is mostly a library of tools, hooks, logging and helpers I wrote while exploring YamJS requests, clients and models and with their help I learned a huge amount about how things work on the Frontend.  If this interests you at all then come talk to me and I'll tell you what I was thinking.  I'm on SFMap under "kilt" if you want to drop by: https://sfmap.int.yammer.com/#search/kilt

Bookmarklet and TamperMonkey script
======

Add this bookmarklet to your favourites and click on any www.yammer.com, www.staging.yammer.com or www.yammer.dev location to activate HookStache:

javascript:(function(){HookStache_H='0b9f5391a9d5a0a7e873';HookStache_SCRIPT=document.createElement('SCRIPT');HookStache_SCRIPT.type='text/javascript';HookStache_SCRIPT.src='http://tonyja.github.io/hookstache_v1_broken/HookStache.js';document.getElementsByTagName('head')[0].appendChild(HookStache_SCRIPT)})();


Alternatively add it to TamperMonkey (or an equivalent tool) to load it automatically on yammer pages:
1. Install the Chrome pluggin Tamper Monkey. https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en

2. Open the Tamper Monkey dashboard.

3. Click the create new script button.

4. Replace the contents of the script area with the content from: https://github.int.yammer.com/tjackson/hookstache/raw/master/HookStache.js

5. Click save.

6. Use the enable/disable UI gestures to turn HookStache on or off and then reload any yammer page to enable it.

Sample Console Commands of Interest
======

HookStache.SupressConsole=false;

HookStache.HookModelEvents("yam.model.Feed","onUpdate");
HookStache.HookModelEvents("yam.model.Group","onCreate");
HookStache.HookModelEvents("yam.model.Feed","onCreate");
HookStache.HookModelEvents("yam.model.Thread","onCreate");
HookStache.HookModelEvents("yam.model.Message","onCreate");

HookStache.ModelDump("Feed").join("\n");

HookStacheCache.AllEvents.join("\n");


Hack Day
======
Building this for Yammer HackDay 10

http://hackday.int.yammer.com/hacks/205

"HookStachify any prod, staging, cloudy, or vagrant instance on the Front End with one bookmarklet and then watch each yam.request, yam.client, and yam.model do it's thing before your very eyes. Chrome's debugger, console, network, and timeline tabs have an entire flood of info for you to dig through, but HookStache lets you spy on key yammer operations and objects and use saved filters, object rendering templates, and breakpoints that are tailored to the exact areas you are working on right now."


Background threads in Yammer
======
Yammer Hack Day group:
https://www.yammer.com/microsoft.com/#/Threads/show?threadId=376194555

Yammer Frontend Team group:
https://www.yammer.com/microsoft.com/#/Threads/show?threadId=370942849


TL;DR Version: All software development activity leads inexorably to the desire to build more tools for software development. Has someone already found/built a great tool for easy viewing of YamJS API requests in real time.

I have found myself wanting a good way to see a high level view of some of the yam.api requests that happen on the page and sepcific values in their payloads. I have been wanting to use a "hook stache" approach sometimes, where I use the console to call something like yam.hook on a specific method so that it will output a Moustache.render of the relevant parts of the API payload returned or sent. Is this a debugging technique other people have tried?

I find myself wanting to build up a "HookStache" tool with some kind of "Yammer Developer Dashboard" showing tabs for routing, api requests, models, events, etc. (Similar to the one in SharePoint shown in this deck)
https://microsoft.sharepoint.com/teams/Christas_Site/working/_layouts/15/WopiFrame.aspx?sourcedoc=%7B6342F9EA-602A-4A7F-8A1F-B8F2CD3D1B7A%7D&file=Ig15_SP_IT_M10V3_devdash.pptx&action=default&DefaultItemOpen=1
https://www.yammer.com/api/v1/uploaded_files/16826869/preview/SPDeveloperDashboard.png


Context: I am currently doing some code spelunking for my Seen/Unseen project using grep-the-code, web traffic sniffing (a la Fiddler/Charles), and browser debuggers to get some kind of grasp of the API traffic and model representation of unseen counts and feed and thread level last seen message ID cursors. Watching, debugging, and logging the production traffic has been one solid way to get a real sense of how this all flows. « collapse

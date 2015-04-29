# tonyja.github.io
Publicly hosted debug files, tools, and pages for tonyja (Tony Jackson O' the Kilt)

Baseline: old hookstache and new yamdebug
- Public hosting yamdebug JS and CSS files at tonyja.github.io so that bookmarklet and style overrides can be made more easily and changes to them tracked in git.  Files do not currently function for debugging.
- Copied hookstache_v1_broken files as a baseline for new dev from:
https://github.int.yammer.com/tjackson/hookstache

NOTE: This project will contain:
- JS files that can be loaded either via a bookmarklet downloading them or adding their entire content into a Tampermonkey (or similar GreaseMonkey style) JS script file to load on every relevant page.
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- CSS files that can be added via bookmarklet including them or adding their entire content into a Stylish (or comparable) CSS override extension.
- https://chrome.google.com/webstore/detail/stylish/fjnbnpbmkenffdnngjfgmeleoegfcffe
- Other misc debug enabling files like readme or icon JPG, etc

The URLs to files like http://tonyja.github.io/yamdebug/yd_bootstrap.js should be public and accessible to all, and therefore usable in bookmarklets
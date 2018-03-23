// ==UserScript== for Tampermonkey
// @name       OneNoteYammerHack
// @namespace  http://www.yammer.com/
// @version    0.1
// @description  Adds onenote embed into
// @match      https://www.yammer.com/*
// @match      https://www.staging.yammer.com/*
// @match      https://www.yammer.dev/*
// @copyright  2012+, You
// ==/UserScript==

// This content from https://tonyja.github.io/yamdebug/one_note_embed_hack.js

var getNotebookTabHtml = function (groupId) {
    return `<li class="yj-filter-tab">
    <a href="https://www.yammer.com/microsoft.com/#/groups/${groupId}/info"
        class="yj-notebook-tab-link yj-group-notebook-link">
      Notebook
      <span class="yj-acc-hidden"> tab</span>
      <span class="yj-acc-selectedstate"> selected</span>
    </a>
    </li> `;
};

var getNotebookEmbedHtml = function () {
  var ttl = Date.now() + (10 * 60 * 60 * 1000); // Ten hours from now
  console.warn('getNotebookEmbedHtml',new Date(),new Date(ttl));
  return `<form
  name="OneNoteInputsForm"
  target="OneNoteEmbedWebApplicationFrame"
  action="https://ffc-onenote.officeapps.live.com/o/onenoteframe.aspx?edit=1&new=1&ui=en-US&rs=en-US&WOPISrc=https://microsoft.sharepoint-df.com/teams/hackdayyammeronenote/_vti_bin/wopi.ashx/folders/0a026751425047a2b36508c43ab8598d&wdEnableRoaming=1&wdFR=1&mscc=1&wdorigin=yammer&removeshareui=1&embed=1&embedded=1&hideheader=1&disablefile=1"
  id="OneNoteInputsForm"
  method="post">

  <div id="OneNoteInputsVisibility" style="display: none;">
    <br>Copy access_token and user_id values from here <a target="_blank" href="https://microsoft.sharepoint-df.com/:o:/r/teams/hackdayyammeronenote/_layouts/15/WopiFrame.aspx?sourcedoc=%7B0a026751-4250-47a2-b365-08c43ab8598d%7D&action=editnew">WOPIFrame.aspx for a sample OneNote</a>
    <br> - After you visit that link open the dev tools (Command+Option+I in Chrome) and find the body.form inputs to copy
    <br> - The values should work for ten hours on any one note you have access to
    <br><input name="access_token" value="paste_access_token" type="hidden">
    <br>paste in access_token for sharepoint.com = <input name="access_token_nondf" value="paste_access_token" type="text">
    <br>paste in access_token for sharepoint-df.com = <input name="access_token_df" value="paste_access_token" type="text">
    <br>paste in user_id = <input name="user_id" value="10033fff8006c8ce" type="text">
    <br>(Set this to connect this group's note for loading later)
    <br>note url for this group = <input name="group_note_url" value="past_one_note_url" type="text">
    <br>Format should be:
    <br>https://microsoft.sharepoint{optional -df}.com/:o:/r/teams/{name_of_team}/_layouts/15/WopiFrame.aspx?sourcedoc=%7B{id_of_note}%7D&action=editnew
    <br>(leave these alone)
    <br>access_token_ttl = <input name="access_token_ttl" value="${ttl}" type="text"> Expiry = ${new Date(ttl)}
    <br>wdCorrelationId = <input name="wdCorrelationId" value="{71C2559E-F00E-0000-7474-BBBDB8D59151}" type="text">
    <br>memo on values = <input name="memo" value="Default values" type="text">
    <br><input name="LoadButton" value="SaveValues+LoadOneNote" type="submit" onsubmit=beforeFormSubmit onload=noteFormLoaded >

  </div>
  </form>
  <iframe src="about:blank" name="OneNoteEmbedWebApplicationFrame" id="OneNoteEmbedWebApplicationFrame" style="width: 1024px;height: 700px;overflow: scroll;"></iframe>`;
};

var beforeFormSubmit = console.warn;
var noteFormLoaded = console.warn;

// Hide group info editor
var css = document.createElement("style");
css.type = "text/css";
css.innerHTML = ".group-info-editor { display: none; }";
document.body.appendChild(css);

var getGroupIdFromUrl = (url) => {
    var matches = /groups\/(\d+)\//.exec(url);
    return matches ? matches[1] : null;
};

var addNoteTab = function (elem) {
    var groupId = getGroupIdFromUrl(elem.href) || '14200680';
    var notebookTabHTML = getNotebookTabHtml(groupId);
    console.warn('addNoteTab',elem,groupId,notebookTabHTML);
    elem.insertAdjacentHTML('afterend',
    notebookTabHTML);
    elem.addEventListener('DOMNodeRemoved', console.warn, false);
};

const localStorePrefix = 'onenotehack_';
var loadFormFromLocalStorage = () => {
  var fm = document.querySelector('#OneNoteInputsForm');
  var groupId = getGroupIdFromUrl(window.location);
  var storeVal;
  var storeItemName;
  if (!!fm) {
    Object.values(fm.elements).forEach((el) => {
      storeItemName = localStorePrefix + el.name;
      storeVal = localStorage.getItem(storeItemName);
      if (storeVal) {
        el.value = storeVal;
      } else if (el.name === 'access_token') {
        // No access token to make form visible
        makeFormVisible();
      }
    });
    storeItemName = localStorePrefix + groupId;
    storeVal = localStorage.getItem(storeItemName);
    if (groupId && storeVal) {
      fm.action = storeVal;
    }
  }
  setCorrectToken(fm, localStorage.getItem(storeItemName + '_access_token'));
  fm.submit();
};

var setLocalStorageFromForm = () => {
  var fm = document.querySelector('#OneNoteInputsForm');
  var groupId = getGroupIdFromUrl(window.location);
  var storeVal;
  var storeItemName;
  if (!!fm) {
    Object.values(fm.elements).forEach((el) => {
      storeItemName = localStorePrefix + el.name;
      localStorage.setItem(storeItemName, el.value);
    });
    storeItemName = localStorePrefix + groupId;
    if (groupId) {
      localStorage.setItem(storeItemName, fm.action);
      localStorage.setItem(storeItemName + '_access_token', fm.elements['access_token'].value)
    }
  }
  setCorrectToken(fm);
};

var setCorrectToken = (fm, access_token_override) => {
  if (access_token_override) {
    fm.elements['access_token'].value = access_token_override;
  } else if (isDogfoodNoteUrl(fm.action)) {
    // use dogfood access token for dogfood notes
    fm.elements['access_token'].value = fm.elements['access_token_df'].value;
  } else {
    fm.elements['access_token'].value = fm.elements['access_token_nondf'].value;
  }
};

var isDogfoodNoteUrl = (url) => {
  return url.indexOf('sharepoint-df') > 0;
};

var urlRegEx = /([^_]*)_layouts([^%]*)%7B([^%]*)/;
var generateNoteEmbedUrl = (noteUrlPrefix, noteId, qparams) => {
  var defaultQparams = '&removeshareui=1&embed=1&embedded=1&hideheader=1&disablefile=1';
  var hostPrefix = isDogfoodNoteUrl(noteUrlPrefix) ? 'ffc' : 'ppc';
  return `https://${hostPrefix}-onenote.officeapps.live.com/o/onenoteframe.aspx?ui=en-US&rs=en-US&WOPISrc=${noteUrlPrefix}_vti_bin/wopi.ashx/folders/${noteId}&wdEnableRoaming=1&wdFR=1&mscc=1&wdorigin=yammer${defaultQparams}`;
};

var parseOneNoteFrameUrlFromOneNoteUrlFormField = () => {
  var fm = document.querySelector('#OneNoteInputsForm') || { elements: {} };
  var group_note_url_field = fm.elements['group_note_url'];
  if (group_note_url_field && urlRegEx.exec(group_note_url_field.value)) {
    var matches = urlRegEx.exec(group_note_url_field.value);
    var noteUrlPrefix = matches[1].replace(':o:/r/','');
    var noteId = matches[3];
    fm.action = generateNoteEmbedUrl(noteUrlPrefix, noteId);
    group_note_url_field.value = 'past_one_note_url';
  }
};

var formOnSubmit = (evt) => {
  var inputsShown = document.querySelector('#OneNoteInputsVisibility');
  if (inputsShown && inputsShown.style.display === 'block') {
    parseOneNoteFrameUrlFromOneNoteUrlFormField();
    setLocalStorageFromForm();
  }

  return true;
};

var addNoteEmbed = function (elem) {
    var notebookHTML = getNotebookEmbedHtml();
    console.warn('addNoteEmbed',elem,notebookHTML);
    elem.insertAdjacentHTML('beforebegin',
    notebookHTML);
    loadFormFromLocalStorage();
};

var setNotebookTabsSelectionState = function () {
    var selectionClass = 'yj-filter-tab';
    if (window.location.href.indexOf('/info') >= 0) {
        selectionClass = 'yj-filter-tab yj-selected';
    }
    findGroupNotebookTabs().forEach(eo => {
      console.warn('setNotebookTabsSelectionState',selectionClass,window.location.href,eo);
      eo.parentNode.className = selectionClass;
    });
};

var findGroupInfoEditor = function () {
    return document.querySelector('.group-info-editor');
};

var findGroupFilesTabs = function () {
    return document.querySelectorAll(".yj-group-files-link");
};

var findNotebookEmbed = function () {
    return document.querySelector('#OneNoteEmbedWebApplicationFrame');
};

var findGroupNotebookTabs = function () {
    return document.querySelectorAll('.yj-group-notebook-link');
};

var coreHackEngine = () => {
    var elems = {
        groupInfo: findGroupInfoEditor(),
        notebookEmbed: findNotebookEmbed(),
        fileTabs: findGroupFilesTabs(),
        notebookTabs: findGroupNotebookTabs(),
    };
    console.warn('coreHackEngine',elems,onenoteTimeoutId);
    if (elems.notebookTabs.length === 0 && elems.fileTabs.length > 0) {
        elems.fileTabs.forEach(addNoteTab);
    }
    setNotebookTabsSelectionState();
    if (!elems.notebookEmbed && elems.groupInfo) {
        addNoteEmbed(elems.groupInfo);
    }
};
var coreHackEngineDone = () => {
    coreHackEngine();
    onenoteTimeoutId = null;
};

var onenoteTimeoutId;
var runHackEngine = (evt) => {
  console.warn('calling runHackEngine.  supress timeouts?=',!!onenoteTimeoutId,onenoteTimeoutId );
  if (onenoteTimeoutId) return;

  coreHackEngine();
  onenoteTimeoutId = setTimeout(coreHackEngine, 200);
  setTimeout(coreHackEngine, 500);
  setTimeout(coreHackEngine, 1000);
  setTimeout(coreHackEngine, 1500);
  setTimeout(coreHackEngine, 2000);
  setTimeout(coreHackEngine, 2500);
  setTimeout(coreHackEngineDone, 3000);
  setTimeout(coreHackEngineDone, 10000);
  setTimeout(coreHackEngineDone, 15000);
};
var makeFormVisible = () => {
    document.querySelectorAll('#OneNoteInputsVisibility').forEach(eo => {
        eo.style.display = 'block';
    });
};

window.onhashchange = runHackEngine;
if(typeof(unsafeWindow) != "undefined") unsafeWindow.onhashchange = window.onhashchange;

document.body.ondblclick = () => {
    runHackEngine();
    makeFormVisible();
    var fm = document.querySelector('#OneNoteInputsForm') || {};
    fm.onsubmit = formOnSubmit;
};
runHackEngine();
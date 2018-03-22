
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

  <div id="OneNoteInputsVisibility" style="display: block;">
    <br>(copy these from WopiFrame.aspx)
    <br>access_token = <input name="access_token" value="paste_access_token" type="text">
    <br>user_id = <input name="user_id" value="10033fff8006c8ce" type="text">
    <br>(leve these alone)
    <br>access_token_ttl = <input name="access_token_ttl" value="${ttl}" type="text">
    <br>wdCorrelationId = <input name="wdCorrelationId" value="{71C2559E-F00E-0000-7474-BBBDB8D59151}" type="text">
    <br><input name="LoadButton" value="Load OneNote" type="submit" onsubmit=beforeFormSubmit onload=noteFormLoaded >
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

var addNoteTab = function (elem) {
    var matches = /groups\/(\d+)\//.exec(elem.href)
    var groupId = matches ? matches[1] : '14200680';
    var notebookTabHTML = getNotebookTabHtml(groupId);
    console.warn('addNoteTab',elem,matches,notebookTabHTML)
    elem.insertAdjacentHTML('afterend',
    notebookTabHTML);
    elem.addEventListener('DOMNodeRemoved', console.warn, false);
}

var addNoteEmbed = function (elem) {
    var notebookHTML = getNotebookEmbedHtml();
    console.warn('addNoteEmbed',elem,notebookHTML)
    elem.insertAdjacentHTML('beforebegin',
    notebookHTML);
    elem.addEventListener('DOMNodeRemoved', console.warn, false);
}

var setNotebookTabsSelectionState = function () {
    var selectionClass = 'yj-filter-tab';
    if (window.location.href.indexOf('/info') >= 0) {
        selectionClass = 'yj-filter-tab yj-selected'
    }
    findGroupNotebookTabs().forEach(eo => {
      console.warn('setNotebookTabsSelectionState',selectionClass,window.location.href,eo)
      eo.parentNode.className = selectionClass;
    })
}

var findGroupInfoEditor = function () {
    return document.querySelector('.group-info-editor');
}

var findGroupFilesTabs = function () {
    return document.querySelectorAll(".yj-group-files-link");
}

var findNotebookEmbed = function () {
    return document.querySelector('#OneNoteEmbedWebApplicationFrame');
}

var findGroupNotebookTabs = function () {
    return document.querySelectorAll('.yj-group-notebook-link');
}

var onenoteTimeoutId;
var onhashchanged_handler = function (evt) {
  if (onenoteTimeoutId) return;

  onenoteTimeoutId = setTimeout(() => {
      var elems = {
        groupInfo: findGroupInfoEditor(),
        notebookEmbed: findNotebookEmbed(),
        fileTabs: findGroupFilesTabs(),
        notebookTabs: findGroupNotebookTabs(),
      };
      console.warn('onhashchanged_handler',elems,evt);
      if (elems.notebookTabs.length === 0 && elems.fileTabs.length > 0) {
          elems.fileTabs.forEach(addNoteTab);
      }
      setNotebookTabsSelectionState();
      if (!elems.notebookEmbed && elems.groupInfo) {
          addNoteEmbed(elems.groupInfo);
      }
      onenoteTimeoutId = null;
  }, 1500);
}

window.onhashchange = onhashchanged_handler;
document.body.ondblclick = () => {
    onhashchanged_handler();
    document.querySelectorAll('#OneNoteInputsVisibility').forEach(eo => { 
        eo.style.display = 'block';
    });
};
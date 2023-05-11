jQuery.fn.highlight = function (wordsList, locales, ignoreList) {
  function replaceText(wordItem, node, skip) {
    let stripItem = removeSpeCharaceters(wordItem);

    if (!stripItem || stripItem.length < 2) {
      return skip;
    }
    let periodItem = removePeriod(stripItem);
    if (!periodItem || periodItem.length < 2) {
      return skip;
    }
  
    if (wordItem.includes("-")) {
      wordItem.split("-").map((el) => {
        skip = replaceText(el, node, skip);
      });
    } else {
      // Check if worditem exist in the wordlist
      var l_wordItem, l_stripItem, l_periodItem
      var pat = wordsList.includes(wordItem);

      if (!pat && wordItem !== stripItem) pat = wordsList.includes(stripItem);
      if (!pat && stripItem !== periodItem) pat = wordsList.includes(periodItem);
      if (!pat && l_wordItem !== wordItem) {
        var l_wordItem = wordItem.toLowerCase();
        var l_stripItem = stripItem.toLowerCase();
        var l_periodItem = periodItem.toLowerCase();

        pat = wordsList.includes(l_wordItem);
        if (!pat && l_stripItem !== l_wordItem) pat = wordsList.includes(l_stripItem);
        if (!pat && l_stripItem !== l_periodItem) pat = wordsList.includes(l_periodItem);
      }

      // Check if worditem exist in the ignorelist
      var ignorepat = false;
      if (!pat) {
        var ignorepat = ignoreList.includes(wordItem);
        if (!ignorepat && wordItem !== stripItem) ignorepat = ignoreList.includes(stripItem);
        if (!ignorepat && stripItem !== periodItem) ignorepat = ignoreList.includes(periodItem);
        if (!ignorepat && l_wordItem !== wordItem) {
          ignorepat = ignoreList.includes(l_wordItem);
          if (!ignorepat && l_stripItem !== l_wordItem) ignorepat = ignoreList.includes(l_stripItem);
          if (!ignorepat && l_stripItem !== l_periodItem) ignorepat = ignoreList.includes(l_periodItem);
        }
      }

      if (wordItem && !pat && !ignorepat) {
        var pos = replaceTypoQuotes(node.data).toUpperCase().indexOf(replaceTypoQuotes(wordItem).toUpperCase());
        if (pos >= 0) {
          // var word  = getWordAt(node.data, pos);
          // if (word === wordItem) {
            skip = 1;
            var txt = $(node).text();
            var spanEl = `<span class="sepllchecker-highlight">${wordItem}</span>`;
            targetTxt = txt.substr(0, pos) + spanEl + txt.substr(pos + wordItem.length);
            $(node).replaceWith(targetTxt)
            return skip; 
          // }
        }
      }
    }

    return skip;
  }

  function innerHighlight(node) {
    var skip = 0;
    if (node.nodeType == 3) {
      var parent = $(node).closest("[lang]");
      if (parent) {
        var parentLang = parent.attr("lang");
      }
      if (parentLang && locales.includes(parentLang.toLowerCase())) {
        var nodeData = decodeHTMLEntities(node.data);
        var words = nodeData.split(/[\s/+—–-]+/);
        for (const el of words) {
          let wordItem = el.trim();
          if (wordItem) {
            skip = replaceText(wordItem, node, skip);
            if (skip === 1) return 0;
          } 
        }
      }
    } else if (
      node.nodeType == 1 &&
      node.childNodes &&
      !/(script|style)/i.test(node.tagName) && 
      !["TEXTAREA", "SELECT", "INPUT"].includes(node.tagName) && 
      !(node.tagName === 'SPAN' && node.className === 'sepllchecker-highlight')
    ) {
      for (var i = 0; i < node.childNodes.length; ++i) {
        i += innerHighlight(node.childNodes[i]);
      }
    }
    return skip;
  }
  return this.each(function () {
    innerHighlight(this);
  });
};

jQuery.fn.removeHighlight = function () {
  function newNormalize(node) {
    for (
      var i = 0, children = node.childNodes, nodeCount = children.length;
      i < nodeCount;
      i++
    ) {
      var child = children[i];
      if (child.nodeType == 1) {
        newNormalize(child);
        continue;
      }
      if (child.nodeType != 3) {
        continue;
      }
      var next = child.nextSibling;
      if (next == null || next.nodeType != 3) {
        continue;
      }
      var combined_text = child.nodeValue + next.nodeValue;
      let new_node = node.ownerDocument.createTextNode(combined_text);
      node.insertBefore(new_node, child);
      node.removeChild(child);
      node.removeChild(next);
      i--;
      nodeCount--;
    }
  }

  return this.find("span.highlight")
    .each(function () {
      var thisParent = this.parentNode;
      thisParent.replaceChild(this.firstChild, this);
      newNormalize(thisParent);
    })
    .end();
};

async function initFileInfo() {
  console.log("loading start");
  var xhr = new XMLHttpRequest();
  var xhr1 = new XMLHttpRequest();

  // Read wordlist.txt
  xhr.open("GET", chrome.runtime.getURL("wordlist.txt"), true);
  xhr.onreadystatechange = function () {
    var status = xhr.status;
    if (xhr.readyState == XMLHttpRequest.DONE && status == 200) {
      var allText = xhr.responseText.split("\r\n");
      console.log("highlight start");
    
      var lang = allText[0].toLowerCase().split(",");
      allText.splice(0, 1);

      // Read ignorewords.txt file
      xhr1.open("GET", chrome.runtime.getURL("ignorewords.txt"), true);
      xhr1.onreadystatechange = function () {
        var status = xhr1.status;
        if (xhr1.readyState == XMLHttpRequest.DONE && status == 200) {
          var ignoreList = xhr1.responseText.split("\r\n");
          
          var startTime = new Date().getTime();
          $("body").highlight(allText, lang, ignoreList);
          var endTime = new Date().getTime();
          
          console.log("highlight end");
          console.log(`timeDiff`, endTime - startTime)
          
          initContextMenu();
          chrome.storage.local.set(
            {
              wordsList: allText,
              ignoreWords: ignoreList,
              locales: lang,
            },
            function () {
              console.log("storage sync success");
            }
          );
        }
      };
      xhr1.send();
    }
  };
  xhr.send();
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log("Message from service worker:", request.message);
  if (request.message === "init-highlight") {
    initFileInfo();
  }

  if (request.message === "reload-page") {
    // window.location.reload();
  }
});

function getSelectedText() {
  if (window.getSelection) {
    return window.getSelection().toString();
  } else if (document.selection) {
    return document.selection.createRange().text;
  }
  return "";
}

function initContextMenu() {
  $(function () {
    // register regular menu
    $.contextMenu({
      selector: ".sepllchecker-highlight",
      build: function ($trigger, e) {
        // this callback is executed every time the menu is to be shown
        // its results are destroyed every time the menu is hidden
        var el = e.target;
        var optionText = replaceTypoQuotes(decodeHTMLEntities(($(el).text())));

        var items = {};
        var optionText = removeSpeCharaceters(optionText);
        var removedText = "";
        var optionList, periodOptionList;
        if (endsWithPeriod(optionText)) {
          removedText = removePeriod(optionText);
        }
        
        var optionList = getWordVariations(optionText);
        optionList.forEach(el => {
          items["add_" + el] = { name: 'Add "' + el + '"' };  
        });

        if (removedText) {
          items["sep1"] = "---------";
          periodOptionList = getWordVariations(removedText);
          periodOptionList.forEach(el => {
            items["add_" + el] = { name: 'Add "' + el + '"' };  
          });
        }

        items["sep2"] = "---------";
        
        optionList.forEach(el => {
          items["ignore_" + el] = { name: 'Ignore "' + el + '"' };  
        });

        if (periodOptionList) {
          items["sep3"] = "---------";
          periodOptionList.forEach(el => {
            items["ignore_" + el] = { name: 'Ignore "' + el + '"' };  
          });
        }

        return {
          callback: function (key, options) {
            if (key.startsWith("add_")) {
              var str = key.substring("add_".length);
              chrome.runtime.sendMessage(
                {
                  type: "ACTIVITY_ADD_TEXT",
                  data: str,
                },
                function () {
                  $(el)[0].parentNode.replaceChild(document.createTextNode($(el).text()), $(el)[0]);
                }
              );
            } else if (key.startsWith("ignore_")) {
              var str = key.substring("ignore_".length);
              chrome.runtime.sendMessage(
                {
                  type: "ACTIVITY_IGNORE_TEXT",
                  data: str,
                },
                function () {
                  $(el)[0].parentNode.replaceChild(document.createTextNode($(el).text()), $(el)[0]);
                }
              );
            }
          },
          items,
        };
      },
    });
  });
}

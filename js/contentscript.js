jQuery.fn.highlight = function (wordsList, locales, ignoreList) {
  function replaceText(wordItem, node, skip) {
    let stripItem = removeSpeCharaceters(wordItem);

    if (!stripItem || stripItem.length < 2) {
      return skip;
    }
    stripItem = removePeriod(stripItem);
    if (!stripItem || stripItem.length < 2) {
      return skip;
    }
  
    if (stripItem.includes("-")) {
      stripItem.split("-").map((el) => {
        skip = replaceText(el, node, skip);
      });
    } else {
      // Check if worditem exist in the wordlist
      var pat = wordsList.includes(stripItem) || wordsList.includes(wordItem);
      if (!pat) {
        pat = wordsList.includes(stripItem.toLowerCase()) || wordsList.includes(wordItem.toLowerCase());
      }

      // Check if worditem exist in the ignorelist
      var ignorepat = ignoreList.includes(stripItem) || ignoreList.includes(wordItem);
      if (!ignorepat) {
        ignorepat = ignoreList.includes(stripItem.toLowerCase()) || ignoreList.includes(wordItem.toLowerCase());
      }

      if (wordItem && !pat && !ignorepat) {
        var pos = replaceTypoQuotes(node.data).toUpperCase().indexOf(replaceTypoQuotes(wordItem).toUpperCase());

        if (pos >= 0) {
          var spannode = document.createElement("span");
          spannode.className = "sepllchecker-highlight";
          var middlebit = node.splitText(pos);
          var endbit = middlebit.splitText(wordItem.length);
          var middleclone = middlebit.cloneNode(true);
          spannode.appendChild(middleclone);
          middlebit.parentNode.replaceChild(spannode, middlebit);
          skip = 1;
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
        nodeData.split(/[\s-—]+/).map((el) => {
          let wordItem = el.trim();
          if (wordItem) {
            skip = replaceText(wordItem, node, skip);
          }
          return el;
        });
      }
    } else if (
      node.nodeType == 1 &&
      node.childNodes &&
      !/(script|style)/i.test(node.tagName) && 
      !["TEXTAREA", "SELECT", "INPUT"].includes(node.tagName)
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

function initFileInfo() {
  console.log("loading start");
  var xhr = new XMLHttpRequest();
  var xhr1 = new XMLHttpRequest();

  // Read wordlist.txt
  xhr.open("GET", chrome.runtime.getURL("wordlist.txt"), true);
  xhr.onreadystatechange = function () {
    var status = xhr.status;
    if (xhr.readyState == XMLHttpRequest.DONE && status == 200) {
      var allText = xhr.responseText.split("\r\n");
      console.log("highlit start");
      var lang = allText[0].toLowerCase().split(",");
      allText.splice(0, 1);

      // Read ignorewords.txt file
      xhr1.open("GET", chrome.runtime.getURL("ignorewords.txt"), true);
      xhr1.onreadystatechange = function () {
        var status = xhr1.status;
        if (xhr1.readyState == XMLHttpRequest.DONE && status == 200) {
          var ignoreList = xhr1.responseText.split("\r\n");
          $("body").highlight(allText, lang, ignoreList);
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

      console.log("highlit end");
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
        if (endsWithPeriod(optionText)) {
          removedText = removePeriod(optionText);
        }
        
        items["add_" + optionText] = { name: 'Add "' + optionText + '"' };
        if (removedText) {
          items["add_" + removedText] = { name: 'Add "' + removedText + '"' };
        }
        items["sep1"] = "---------";
        items["ignore_" + optionText] = { name: 'Ignore "' + optionText + '"' };
        if (removedText) {
          items["ignore_" + removedText] = {
            name: 'Ignore "' + removedText + '"',
          };
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

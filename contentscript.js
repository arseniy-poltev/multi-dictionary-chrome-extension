jQuery.fn.highlight = function (wordsList, locales) {
  function innerHighlight(node) {
    var skip = 0;
    if (node.nodeType == 3) {
      var parent = $(node).closest("[lang]");
      if (parent) {
        var parentLang = parent.attr('lang');
      }
      if (parentLang && locales.includes(parentLang)) {
        node.data.split(" ").map((el) => {
          let wordItem = el.trim();
          if (wordItem) {
            if (endsWithSpeCharacters(wordItem)) {
              wordItem = wordItem.slice(0, -1);
            }
  
            var pat = wordsList.indexOf(wordItem);
  
            if (pat === -1) {
              pat = wordsList.indexOf(wordItem.toLowerCase());
            }
  
            if (wordItem && pat === -1) {
              var pos = node.data.toUpperCase().indexOf(wordItem.toUpperCase());
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
          return el;
        });
      }
    } else if (
      node.nodeType == 1 &&
      node.childNodes &&
      !/(script|style)/i.test(node.tagName)
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
  xhr.open("GET", chrome.runtime.getURL("wordlist.txt"), true);
  xhr.onreadystatechange = function () {
    var status = xhr.status;
    if (xhr.readyState == XMLHttpRequest.DONE && status == 200) {
      allText = xhr.responseText.split("\r\n");
      console.log("highlit start");
      var lang = allText[0].split(",")
      allText.splice(0, 1);
      $("body").highlight(allText, lang);
      console.log("highlit end");
      chrome.storage.local.set(
        {
          wordsList: allText,
          locales: lang
        },
        function () {
          console.log("storage sync success");
        }
      );
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
    window.location.reload();
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

document.addEventListener("mouseup", (event) => {
  var selectionText = getSelectedText();
  chrome.runtime.sendMessage(
    {
      type: "ACTIVITY_SELECT_TEXT",
      data: selectionText
    },
    function () {}
  );
});

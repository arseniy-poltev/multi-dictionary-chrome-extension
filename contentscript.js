jQuery.fn.highlight = function (wordsList) {
  function innerHighlight(node) {
    var skip = 0;
    if (node.nodeType == 3) {
      node.data.split(" ").map((el) => {
        let wordItem = el.trim();
        if (wordItem) {
          var pat = wordsList.find(
            (el) => wordItem.toUpperCase() === el.toUpperCase()
          );
          if (wordItem && !pat) {
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
  var xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.runtime.getURL("wordslist.txt"), true);
  xhr.onreadystatechange = function () {
    var status = xhr.status;
    if (xhr.readyState == XMLHttpRequest.DONE && status == 200) {
      allText = xhr.responseText.split("\r\n");
      $("body").highlight(allText);
      chrome.storage.sync.set({
        wordsList: allText
      }, function() {
        console.log("storage sync success")
      })
    }
  };
  xhr.send();
}

async function addWord(wItem) {
  if (wItem && wItem.trim()) {
    var xhr = new XMLHttpRequest();
    var url = chrome.runtime.getURL("wordslist.txt");
    console.log(`url`, url)
    xhr.open("GET", chrome.runtime.getURL("wordslist.txt"), true);
    xhr.onreadystatechange = function () {
      var status = xhr.status;
      if (xhr.readyState == XMLHttpRequest.DONE && status == 200) {
        allText = xhr.responseText.split("\r\n");
        let findItem = allText.find(el => el.toUpperCase() === wItem.trim().toUpperCase());
        console.log(`findItem`, findItem)
        // const newFileHandle = await newDirectoryHandle.getFileHandle('My Notes.txt', { create: true });

        if (findItem) {
          allText = allText.filter(el => el.toUpperCase() !== wItem.trim().toUpperCase());
          // var findNode = $('span.sepllchecker-highlight:contains("' + findItem + '")');
          $("body").highlight(allText);
        } else {
          console.log("wwwwwwwwwwwwwwwwwwwwwwwwww")
          allText.push(wItem.trim());
          console.log(`allText`, allText)
          $("body").highlight(allText);
        }
      }
    };
    xhr.send();
  }
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log("Message from service worker:", request.message);
  // addWord(request.message);

  if (request.message === "init-highlight") {
    initFileInfo();
  }

  if (request.message === "reload-page") {
    window.location.reload();
  }
});

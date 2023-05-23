jQuery.fn.highlight = function (data, locales) {
  var localeArr = [];
  locales.forEach((el) => {
    if (data[`${el}_locales`]) {
      localeArr = [...localeArr, ...data[`${el}_locales`]] 
    }
  });

  function searchWord(wordsList, wordItem, stripItem, periodItem, locale, lowPriority) {
    if (lowPriority) {
      wordItem = `~${wordItem}`;
      stripItem = `~${stripItem}`;
      periodItem = `~${periodItem}`;
    }

    var pat = binarySearch(wordsList, wordItem, locale);
    if (!pat && wordItem !== stripItem) pat = binarySearch(wordsList, stripItem, locale);
    if (!pat && stripItem !== periodItem) pat = binarySearch(wordsList, periodItem, locale);
    if (!pat) {
      var l_wordItem = wordItem.toLowerCase();
      var l_stripItem = stripItem.toLowerCase();
      var l_periodItem = periodItem.toLowerCase();

      pat = binarySearch(wordsList, l_wordItem, locale)
      if (!pat && l_stripItem !== l_wordItem) pat = binarySearch(wordsList, l_stripItem, locale);
      if (!pat && l_stripItem !== l_periodItem) pat = binarySearch(wordsList, l_periodItem, locale);
    }

    return pat;
  }

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
      var parentEl = $(node).closest("[lang]").attr("lang");
      var locale = parentEl.toLowerCase().split(/[\s/_—–-]+/)[0].toLowerCase();
      var wordsList = data[`${locale}_words`];

      var pat = searchWord(wordsList, wordItem, stripItem, periodItem, locale, false);

      // Check if worditem exist in the ignorelist
      var ignorepat = false;
      if (!pat) {
        var ignoreList = data[`${locale}_ignore`];
        ignorepat = searchWord(ignoreList, wordItem, stripItem, periodItem, locale, false);
      }

      var lowPriority = false;
      if (!pat && !ignorepat) {
        lowPriority = searchWord(wordsList, wordItem, stripItem, periodItem, locale, true);
      }

      if (wordItem && !pat && !ignorepat) {
        var nodeData = node.data;

        // Find the word inside the text
        var escapeItem = escapeRegExp(wordItem);
        var regex = '\\b(' + escapeItem + ')\\b';
        var pos = nodeData.search(regex);
        if (pos === -1) {
          pos = nodeData.indexOf(wordItem);
        }
        if (pos > -1) {
          skip = 1;
          var txt = $(node).text();
          var spanEl = "";
          if (lowPriority) {
            spanEl = `<span class="sepllchecker-highlight spellchecker_priority-low" data-locale="${locale}">${wordItem}</span>`;
          } else {
            spanEl = `<span class="sepllchecker-highlight" data-locale="${locale}">${wordItem}</span>`;
          }
          targetTxt = txt.substr(0, pos) + spanEl + txt.substr(pos + wordItem.length);
          $(node).replaceWith(targetTxt)
          return skip;
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
      if (parentLang) {
        var p_lang = parentLang.toLowerCase();
        if (localeArr.includes(p_lang)) {
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
      }
    } else if (
      node.nodeType == 1 &&
      node.childNodes &&
      !/(script|style)/i.test(node.tagName) && 
      !["TEXTAREA", "SELECT", "INPUT"].includes(node.tagName) && 
      !(node.tagName === 'SPAN' && node.className === 'sepllchecker-highlight' || node.className === 'sepllchecker-highlight spellchecker_priority-low')
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

async function getFileInfo(name) {
  const response = await fetch(chrome.runtime.getURL("dictionary/" + name));
  const body = await response.text();
  return body;
}

async function initFileInfo() {
    var langEls = $('*[lang]');
    var locales = [];
    langEls.each((index, el) => {
      var langAttr = $(el).attr('lang');
      if (langAttr) {
        var locale = $(el).attr('lang').split(/[\s/_—–-]+/)[0];
        locales.push(locale.toLowerCase());
      } 
    });

    locales = [...new Set(locales)];

    var resMap = {};
    await Promise.all(locales.map(async (lc) => {
      try {
        var wordsTxt = await getFileInfo(`${lc}-words.txt`);
        if (wordsTxt) {
          var wordsInfo = parseFile(wordsTxt, true);
          // var wordsItems = wordsInfo.words
          // wordsItems.sort(function(a, b) {
          //     return a.localeCompare(b, 'en');
          //   })
          // resMap[`${lc}_words`] = wordsItems;
          resMap[`${lc}_words`] = wordsInfo.words;
          resMap[`${lc}_locales`] = wordsInfo.locales;
        }
        
        var ignoreTxt = await getFileInfo(`${lc}-ignore.txt`);
        if (ignoreTxt) {
          var ignoreInfo = parseFile(ignoreTxt);
          resMap[`${lc}_ignore`] = ignoreInfo.words;
        } else {
          resMap[`${lc}_ignore`] = [];
        }
      } catch (error) {
        // console.log(error)
      }
    }));

    $("body").highlight(resMap, locales);
    initContextMenu();
    chrome.storage.local.set({
        dictionary: resMap
      },
      function () {
        console.log("storage sync success");
      }
    );
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
        var locale = $(el).data('locale');
        var lowPriority = $(el).hasClass('spellchecker_priority-low')
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
          items["add_" + el] = { name: `Add "${el}" (${locale.toUpperCase()})` };  
        });

        if (removedText) {
          items["sep1"] = "---------";
          periodOptionList = getWordVariations(removedText);
          periodOptionList.forEach(el => {
            items["add_" + el] = { name: `Add "${el}" (${locale.toUpperCase()})` };  
          });
        }

        items["sep2"] = "---------";
        
        optionList.forEach(el => {
          items["ignore_" + el] = { name: `Ignore "${el}" (${locale.toUpperCase()})`};  
        });

        if (periodOptionList) {
          items["sep3"] = "---------";
          periodOptionList.forEach(el => {
            items["ignore_" + el] = { name: `Ignore "${el}" (${locale.toUpperCase()})`};  
          });
        }

        items["sep4"] = "---------";
        items[`sort_${locale.toLowerCase()}`] = { name: `Sort (${locale.toUpperCase()})`}

        return {
          callback: function (key, options) {
            if (key.startsWith("add_")) {
              var str = key.substring("add_".length);
              chrome.runtime.sendMessage(
                {
                  type: "ACTIVITY_ADD_TEXT",
                  data: str,
                  locale,
                  lowPriority
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
                  locale,
                  lowPriority
                },
                function () {
                  console.log("Ignore text success")
                  $(el)[0].parentNode.replaceChild(document.createTextNode($(el).text()), $(el)[0]);
                }
              );
            } else if (key.startsWith("sort_")) {
              var str = key.substring("sort_".length);
              chrome.runtime.sendMessage(
                {
                  type: "ACTIVITY_SORT_WORDS",
                  data: str,
                  locale
                },
                function () {}
              );
            }
          },
          items,
        };
      },
    });
  });
}

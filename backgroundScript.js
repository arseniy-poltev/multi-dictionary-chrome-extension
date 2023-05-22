importScripts("js/helper.js");
("use strict");

const HOST_APPLICATION_NAME = "savetexttofile";
const TEST_CONNECTIVITY_ACTION = "TEST_CONNECTIVITY";
const SAVE_TEXT_ACTION = "SAVE";
const NOTIFICATION_ID = "save-text-to-file-notification";
const EXTENSION_TITLE = "Spell Checker";
const TEXT_FILE_NAME = "words.txt";
const IGNORE_FILE_NAME = "ignore.txt";

var directory;
var notifications;
var conflictAction;
var testConnectivityPayload = {
  action: TEST_CONNECTIVITY_ACTION,
};

function saveTextViaApp(directory, mode, fileContents, wordsList, locale) {
  var fileName = "";
  if(mode === "ADD" || mode === "SORT") {
    fileName = locale + '-' + TEXT_FILE_NAME;
  } else {
    fileName = locale + '-' + IGNORE_FILE_NAME;
  }
  var payload = {
    action: SAVE_TEXT_ACTION,
    filename: fileName,
    directory: directory,
    fileContent: fileContents,
    conflictAction: conflictAction,
  };

  chrome.runtime.sendNativeMessage(
    HOST_APPLICATION_NAME,
    payload,
    function (response) {
      if (chrome.runtime.lastError) {
        notify("Error occured communicating with host application. Check browser console.");
        console.log(chrome.runtime.lastError);
      } else {
        var json = JSON.parse(response);
        if (json.status === "Success") {
          chrome.storage.local.get(
            {
              directory: "",
              notifications: true,
              conflictAction: "uniquify",
              dictionary: {}
            },
            function (items) {
              var dictionary = items.dictionary;
              if (mode === "ADD") {
                notify("Text added to the wordlist.");
                dictionary = { ...dictionary, [`${locale}_words`]: wordsList }
              } else if (mode === "IGNORE"){
                notify("Text added to the ignorelist.");
                dictionary = { ...dictionary, [`${locale}_ignore`]: wordsList }
              } else if(mode === "SORT") {
                notify("Wordlist sorted successfully.");
                dictionary = { ...dictionary, [`${locale}_words`]: wordsList }
              }
              chrome.storage.local.set({ dictionary },function () {});
            }
          );
        } else {
          notify("Error occured saving text via host application. Check browser console.");
          console.log("SaveTextToFile: Native application response: " + response);
        }
      }
    }
  );
}

async function saveTextToFile(selectionText, locale, mode) {
  chrome.storage.local.get(
    {
      directory: "",
      notifications: true,
      conflictAction: "uniquify",
      ignoreWords: [],
      dictionary: {}
    },
    function (items) {

      let wordsList, locales = items.dictionary[`${locale}_locales`];
      if (mode === 'ADD') {
        wordsList = items.dictionary[`${locale}_words`];
      } else if (mode === "IGNORE"){
        wordsList = items.dictionary[`${locale}_ignore`];
      } else if (mode === "SORT") {
        wordsList = items.dictionary[`${locale}_words`];
        wordsList.sort(function(a, b) {
          return a.localeCompare(b, locale,  {sensitivity:'variant'});
        })
      }
      
      if (mode === "ADD" || mode === "IGNORE") {
        let findItem = wordsList.find(
          (el) => el === selectionText.trim().toLowerCase() || el === selectionText.trim()
        );
      
        if (findItem) {
        } else {
          wordsList = insertSorted(wordsList, selectionText.trim(), locale);
        }
      }

      createFileContents(
        wordsList,
        locales,
        mode,
        function (fileContents) {
          chrome.runtime.sendNativeMessage(
            HOST_APPLICATION_NAME,
            testConnectivityPayload,
            function (response) {
              if (chrome.runtime.lastError) {
                console.log("SaveTextToFile: Error communicating between the native application and web extension.");
                console.log(chrome.runtime.lastError.message);
              } else {
                var responseObject = JSON.parse(response);
                if (responseObject.status === "Success") {
                  saveTextViaApp(directory, mode, fileContents, wordsList, locale);
                }
              }
            }
          );
        }
      );
    }
  );
}

function createFileContents(wordsList, locales, mode, callback) {

  var text = "\ufeff";

  if (mode === "ADD" || mode === "SORT") {
    locales.forEach(function (el) {
      text += el + ",";
    });
    text = text.slice(0, -1);
    text += "\n";
  }

  wordsList.forEach(function (item) {
    if (item) {
      text = text + item + "\n";
    }
  });

  callback(text);
}

function notify(message) {
  if (notifications) {
    chrome.notifications.clear(NOTIFICATION_ID, function () {
      chrome.notifications.create(NOTIFICATION_ID, {
        title: EXTENSION_TITLE,
        type: "basic",
        message: message,
        iconUrl: chrome.runtime.getURL("images/ico.png"),
      });
    });
  }
}

chrome.storage.local.get(
  {
    directory: "",
    notifications: true,
    conflictAction: "uniquify",
  },
  function (items) {
    directory = items.directory;
    notifications = items.notifications;
    conflictAction = items.conflictAction;
  }
);

chrome.storage.onChanged.addListener(function (changes) {
  _updateDirectoryOnChange();
  _updateNotificationsOnChange();

  function _updateDirectoryOnChange() {
    if (changes.directory) {
      if (changes.directory.newValue !== changes.directory.oldValue) {
        directory = changes.directory.newValue;
      }
    }
  }

  function _updateNotificationsOnChange() {
    if (changes.notifications) {
      if (changes.notifications.newValue !== changes.notifications.oldValue) {
        notifications = changes.notifications.newValue;
      }
    }
  }
});

chrome.runtime.sendNativeMessage(
  HOST_APPLICATION_NAME,
  testConnectivityPayload,
  function (response) {
    if (chrome.runtime.lastError) {
      console.log("ERROR: " + chrome.runtime.lastError.message);
    } else {
      var responseObject = JSON.parse(response);
      if (responseObject.status === "Success") {
        console.log(
          "SaveTextToFile: Successfully tested communication between native application and webextension."
        );
      }
    }
  }
);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.tabs.sendMessage(tabId, { message: "init-highlight" });
  }
});

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html"),
    });
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let selectionText = request.data;
  let locale = request.locale;
  if (request.type === "ACTIVITY_ADD_TEXT") {
    saveTextToFile(selectionText, locale, "ADD");
  }
  
  if (request.type === "ACTIVITY_IGNORE_TEXT") {
    saveTextToFile(selectionText, locale, "IGNORE");
  }

  if (request.type === "ACTIVITY_SORT_WORDS") {
    saveTextToFile("", locale, "SORT");
  }
  sendResponse();
});

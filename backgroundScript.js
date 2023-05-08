importScripts("js/helper.js");
("use strict");

const HOST_APPLICATION_NAME = "savetexttofile";
const TEST_CONNECTIVITY_ACTION = "TEST_CONNECTIVITY";
const SAVE_TEXT_ACTION = "SAVE";
const NOTIFICATION_ID = "save-text-to-file-notification";
const EXTENSION_TITLE = "Spell Checker";
const TEXT_FILE_NAME = "wordlist.txt";
const IGNORE_FILE_NAME = "ignorewords.txt";

var directory;
var notifications;
var conflictAction;
var testConnectivityPayload = {
  action: TEST_CONNECTIVITY_ACTION,
};

function saveTextViaApp(directory, mode, fileContents, wordsList) {
  var fileName = "";
  if(mode === "ADD") {
    fileName = TEXT_FILE_NAME;
  } else {
    fileName = IGNORE_FILE_NAME;
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
          if (mode === "ADD") {
            notify("Text added to the wordlist.");
            chrome.storage.local.set({ wordsList: wordsList },function () {});
          } else {
            notify("Text added to the ignorelist.");
            chrome.storage.local.set({ ignoreWords: wordsList },function () {});
          }
          // chrome.tabs.sendMessage(tabId, { message: "reload-page" });
        } else {
          notify("Error occured saving text via host application. Check browser console.");
          console.log("SaveTextToFile: Native application response: " + response);
        }
      }
    }
  );
}

async function saveTextToFile(selectionText, mode) {
  chrome.storage.local.get(
    {
      directory: "",
      notifications: true,
      conflictAction: "uniquify",
      wordsList: [],
      locales: [],
      ignoreWords: [],
    },
    function (items) {

      let wordsList = mode === "ADD" ? items.wordsList : items.ignoreWords;
      let findItem = wordsList.find(
        (el) => el === selectionText.trim().toLowerCase() || el === selectionText.trim()
      );
    
      if (findItem) {
        // wordsList = wordsList.filter((el) => el.toUpperCase() !== selectionText.trim().toUpperCase());
      } else {
        wordsList.push(selectionText.trim());
      }
      
      createFileContents(
        selectionText,
        wordsList,
        items.locales,
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
                  saveTextViaApp(directory, mode, fileContents, wordsList);
                }
              }
            }
          );
        }
      );
    }
  );
}

function createFileContents(selectionText, wordsList, locales, mode, callback) {

  var text = "";

  if (mode === "ADD") {
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
    wordsList: [],
    ignoreWords: [],
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
      url: chrome.extension.getURL("options.html"),
    });
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  let selectionText = request.data;
  if (request.type === "ACTIVITY_ADD_TEXT") {
    saveTextToFile(selectionText, "ADD");
  }
  
  if (request.type === "ACTIVITY_IGNORE_TEXT") {
    saveTextToFile(selectionText, "IGNORE");
  }
  sendResponse();
});

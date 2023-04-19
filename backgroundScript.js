importScripts("helper.js");
'use strict';

const HOST_APPLICATION_NAME = 'savetexttofile';
const TEST_CONNECTIVITY_ACTION = 'TEST_CONNECTIVITY';
const SAVE_TEXT_ACTION = 'SAVE';
const MENU_ITEM_ID = 'save-text-to-file-menu-item';
const MENU_ITEM_ID_1 = 'save-text-to-file-menu-item_1';
const NOTIFICATION_ID = 'save-text-to-file-notification';
const EXTENSION_TITLE = 'Spell Checker';
const TEXT_FILE_NAME = "wordlist.txt";

var directory;
var notifications;
var conflictAction;
var testConnectivityPayload = {
  action: TEST_CONNECTIVITY_ACTION
};

function saveTextViaApp(directory, sanitizedFileName, fileContents, tabId) {
  var payload = {
    action: SAVE_TEXT_ACTION,
    filename: sanitizedFileName,
    directory: directory,
    fileContent: fileContents,
    conflictAction: conflictAction
  };

  chrome.runtime.sendNativeMessage(
    HOST_APPLICATION_NAME,
    payload, function(response) {
      if (chrome.runtime.lastError) {
        notify('Error occured communicating with host application. Check browser console.');
        console.log(chrome.runtime.lastError);
      } else {
        var json = JSON.parse(response);
        if (json.status === 'Success') {
            notify('Text saved.');
            chrome.tabs.sendMessage(tabId, { message: "reload-page" });
        } else {
          notify('Error occured saving text via host application. Check browser console.');
          console.log("SaveTextToFile: Native application response: " + response);
        }
      }
  });
}

async function saveTextToFile(selectionText, tabId) {
  chrome.storage.local.get({
    directory: '',
    notifications: true,
    conflictAction: 'uniquify',
    wordsList: [],
    locales: []
  }, function(items) {
    createFileContents(selectionText, items.wordsList, items.locales, function(fileContents) {
      chrome.runtime.sendNativeMessage(HOST_APPLICATION_NAME, testConnectivityPayload, function(response) {
        if (chrome.runtime.lastError) {
          console.log('SaveTextToFile: Error communicating between the native application and web extension.');
          console.log(chrome.runtime.lastError.message);
        } else {
          var responseObject = JSON.parse(response);
          if (responseObject.status === 'Success') {
            saveTextViaApp(directory, TEXT_FILE_NAME, fileContents, tabId);
          }
        }
      });
    });
  });
}

function createFileContents(selectionText, wordsList, locales, callback) {
  let findItem = wordsList.find(el => el.toUpperCase() === selectionText.trim().toUpperCase());

  if (findItem) {
    wordsList = wordsList.filter(el => el.toUpperCase() !== selectionText.trim().toUpperCase());
  } else {
    wordsList.push(selectionText.trim());
  }

  var text = "";

  locales.forEach(function(el) {
    text += el + ","
  })
  text = text.slice(0, -1);
  text += "\n";

  wordsList.forEach(function(item) {
    if (item) {
      text = text + item + "\n";
    }
  })
  
  callback(text);
}

function notify(message) {
  chrome.notifications.clear(NOTIFICATION_ID, function() {
    chrome.notifications.create(NOTIFICATION_ID, {
      title: EXTENSION_TITLE,
      type: 'basic',
      message: message,
      iconUrl: chrome.runtime.getURL('images/ico.png')
    });
  });
}

chrome.storage.local.get({
  directory: '',
  notifications: true,
  conflictAction: 'uniquify',
  wordsList: [],
}, function(items) {
  directory = items.directory;
  notifications = items.notifications;
  conflictAction = items.conflictAction;
});

chrome.storage.onChanged.addListener(function(changes) {
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

chrome.runtime.sendNativeMessage(HOST_APPLICATION_NAME, testConnectivityPayload, function(response) {
  if (chrome.runtime.lastError) {
    console.log('ERROR: ' + chrome.runtime.lastError.message);
  } else {
    var responseObject = JSON.parse(response);
    if (responseObject.status === 'Success') {
      console.log('SaveTextToFile: Successfully tested communication between native application and webextension.');
    }
  }
});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    chrome.tabs.sendMessage(tabId, { message: "init-highlight" });
  }
})

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.extension.getURL('options.html')
    });
  }
});

chrome.contextMenus.create({
  id: MENU_ITEM_ID,
  title: "Add/Remove \"%s\"",
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === MENU_ITEM_ID) {
    saveTextToFile(info.selectionText, tab.id);
  } else if(info.menuItemId === MENU_ITEM_ID_1) {
    var selectionText = info.selectionText.slice(0, -1);
    saveTextToFile(selectionText, tab.id);
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.type === 'ACTIVITY_SELECT_TEXT') {
    chrome.contextMenus.remove(MENU_ITEM_ID_1, function() {})

    var selectionText = request.data;
    selectionText = selectionText.trim();
    if(endsWithSpeCharacters(selectionText)) {
      selectionText = selectionText.slice(0, -1);
      chrome.contextMenus.create({
        id: MENU_ITEM_ID_1,
        title: "Add/Remove \"" + selectionText + "\"",
        contexts: ['selection']
      });
    }
  }
  sendResponse();
})
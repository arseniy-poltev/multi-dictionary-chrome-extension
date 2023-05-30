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
var testConnectPayload = {
  action: TEST_CONNECTIVITY_ACTION,
};

async function saveTextViaApp(directory, word, mode, locale, lowPriority) {
  var payload = {
    action: SAVE_TEXT_ACTION,
    word,
    mode, 
    locale, 
    lowPriority,
    directory
  };

  let response = await chrome.runtime.sendNativeMessage(
    HOST_APPLICATION_NAME,
    payload
  );

  if (chrome.runtime.lastError) {
    notify("Error occured communicating with host application. Check browser console.");
    console.log(chrome.runtime.lastError);
  } else {
    var json = JSON.parse(response);
    if (json.status === "Success") {
     return true;
    } else {
      notify("Error occured saving text via host application. Check browser console.");
      console.log("SaveTextToFile: Native application response: " + response);
      return false;
    }
  }
}

async function updateStorage(wordsList, locale, mode) {
  var items = await chrome.storage.local.get({ dictionary: {} });
  var dictionary = items.dictionary;
  if (mode === "ADD") {
    dictionary = { ...dictionary, [`${locale}_words`]: wordsList };
  } else if (mode === "IGNORE") {
    dictionary = { ...dictionary, [`${locale}_ignore`]: wordsList };
  } else if (mode === "SORT") {
    dictionary = { ...dictionary, [`${locale}_words`]: wordsList };
  }
  await chrome.storage.local.set({ dictionary });
  return true;
}

async function saveTextToFile(selectionText, locale, mode, lowPriority = false) {
  selectionText = selectionText.trim();
    // Test connectivity
    var response = await chrome.runtime.sendNativeMessage(HOST_APPLICATION_NAME, testConnectPayload);
    var responseObject = JSON.parse(response);
    if (responseObject.status === "Success") {
      var fileName = "";
      if (mode === "ADD" || mode === "SORT") {
        fileName = locale + "-" + TEXT_FILE_NAME;
      } else {
        fileName = locale + "-" + IGNORE_FILE_NAME;
      }

      // await updateStorage(wordsList, locale, mode);
      await saveTextViaApp(directory, selectionText, mode, locale, lowPriority);

      if (mode === "SORT") {
        notify("Wordlist sorted successfully.");
        return;
      }

      if (mode === "ADD") {
        notify("Text added to the wordlist.");
        return;
      }


      if (mode === "IGNORE") {
        notify("Text added to the ignorelist.");
        return;
      }
      return;
    }
}

function createFileContents(wordsList, locales, mode) {

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

  return text;
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
  },
  function (items) {
    directory = items.directory;
    notifications = items.notifications;
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
  testConnectPayload,
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


chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  let selectionText = request.data;
  let lowPriority = request.lowPriority
  let locale = request.locale;
  if (request.type === "ACTIVITY_ADD_TEXT") {
    await saveTextToFile(selectionText, locale, "ADD", lowPriority);
  }
  
  if (request.type === "ACTIVITY_IGNORE_TEXT") {
    await saveTextToFile(selectionText, locale, "IGNORE", lowPriority);
  }

  if (request.type === "ACTIVITY_SORT_WORDS") {
    await saveTextToFile("", locale, "SORT");
  }
  sendResponse();
});

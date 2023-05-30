'use strict';

const DEFAULT_FILE_NAME_PREFIX = 'save-text-to-file--';
const HOST_APPLICATION_NAME = 'savetexttofile';
const TEST_CONNECTIVITY_ACTION = 'TEST_CONNECTIVITY';

function saveOptions() {
  chrome.storage.local.set({
    directory: document.getElementById('directory').value,
    notifications: document.getElementById('notifications').checked,
  }, function() {
    var status = document.getElementById('status');
    status.style.visibility = 'visible';
    setTimeout(function() {
      status.style.visibility = 'hidden';
    }, 5000);
  });
}

function restoreOptions() {
  chrome.storage.local.get({
    directory: '',
    notifications: true,
  }, function(items) {
    document.getElementById('directory').value = items.directory;
    document.getElementById('notifications').checked = items.notifications;
  });
}

function appConnectionTest() {
  var testConnectivityPayload = {
    action: TEST_CONNECTIVITY_ACTION
  };
  chrome.runtime.sendNativeMessage(HOST_APPLICATION_NAME, testConnectivityPayload, function(response) {
    if (chrome.runtime.lastError) {

      document.getElementById('nativeAppMessage').innerHTML =
        '<p id="nativeAppNotInstalledMessage" class="hide">' +
          'The \'Save Text to File\' host application was not found on this device.<br/>' +
        '</p>';
      document.getElementById('nativeAppInstalled').checked = false;
      document.getElementById('directory').disabled = true;
      document.getElementById('directory').classList.remove('invalid_field');
      console.log('SaveTextToFile: Error communicating between the native application and web extension.');
      console.log(chrome.runtime.lastError.message);
    } else {
      var responseObject = JSON.parse(response);
      if (responseObject.status === 'Success') {

        while(document.getElementById('nativeAppMessage').firstChild) {
          document.getElementById('nativeAppMessage').removeChild(document.getElementById('nativeAppMessage').firstChild);
        }

        var para = document.createElement('p');
        para.appendChild(document.createTextNode('All features enabled! Application version: ' + responseObject.version));
        document.getElementById('nativeAppMessage').appendChild(para);

        if (responseObject.scriptpath) {
          para = document.createElement('p');
          para.appendChild(document.createTextNode('Script path: ' + responseObject.scriptpath + 'savetexttofile.py'));
          document.getElementById('nativeAppMessage').appendChild(para);
        }

        para = document.createElement('p');
        para.appendChild(document.createTextNode(''));
        while(document.getElementById('directoryMessage').firstChild) {
          document.getElementById('directoryMessage').removeChild(document.getElementById('directoryMessage').firstChild);
        }
        document.getElementById('directoryMessage').appendChild(para);
        document.getElementById('nativeAppInstalled').checked = true;

        document.getElementById('directory').disabled = false;
        if (document.getElementById('directory').value === '') {
          document.getElementById('directory').classList.add('invalid_field');
          document.getElementById('save').disabled = true;
        } else {
          document.getElementById('directory').classList.remove('invalid_field');
          document.getElementById('save').disabled = false;
        }

        console.log('SaveTextToFile: Successfully tested communication between native application and webextension.');
      }
    }
  });
}

function directoryChanged() {
  if (document.getElementById('directory').value === '') {
    document.getElementById('directory').classList.add('invalid_field');
    document.getElementById('save').disabled = true;
  } else {
    document.getElementById('directory').classList.remove('invalid_field');
    document.getElementById('save').disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('appTest').addEventListener('click', appConnectionTest);
document.getElementById('directory').addEventListener('input', directoryChanged);

appConnectionTest();

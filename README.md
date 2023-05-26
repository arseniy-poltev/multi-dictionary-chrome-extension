# Prerequisites

- Have Python 3 installed and have it in your PATH
- Simply type "python" in cmd.exe and check that the Python interpreter is found

# Installation

- Create the folder c:\savetexttofile
- Unpack the project into it
- Replace the wordlists in the folder `dictionary` with the real files
- Right-click on install_host.bat, "Run as administrator"
- In Chrome, click on "Manage extensions"
- Choose "Load unpacked extension", browse to c:\savetexttofile, choose "Select folder"
- In the Extensions page, copy the extension's ID to the clipboard
- Edit app\savetexttofile_win.json and replace the extension ID with the one from the clipboard.
- On the Chrome Extensions page, click on the Details button of the new Extensions
- Click on the Options link
- In the modal, ensure that "Application found" has a checkmark
- Enter c:\savetexttofile\dictionary as the local save directory, then click Save and close the modal.
- Browse to a web page and check if some words are highlighted.
- Add a word and see if a popup appears about the word being added, and see if the word is added to wordlist.txt

# Sorting the wordlist

Since the extension does a binary search to find words, the wordlist must be alphabetically sorted, in exactly the way that the JavaScript string comparisons want it:

- Start with a wordlist that is sorted in any way.
- Add the ISO language codes in the first line, save as UTF-8 with BOM, CR+LF
- Copy it to c:\savetexttofile\dictionary
- Close all browser windows except one.
- Visit a web page of a matching language.
- Many words will be highlighted.
- Right-click on any highlighted word and choose "Sort".
- Open the Windows Task Manager and wait until CPU usage goes back to normal.
- Then you have a sorted wordlist. Press Ctrl+R and many fewer words will be higlighted.
- Now you can start adding to the wordlist.

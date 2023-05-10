# Installation

- Create the folder c:\savetexttofile
- Unpack the project into it
- Replace wordlist.txt with the real file
- Right-click on install_host.bat, "Run as administrator"
- Edit app\savetexttofile.bat
```
- python -u "c:\\savetexttofile\\app\\savetexttofile.py"
+ c:\python39\python -u "c:\\savetexttofile\\app\\savetexttofile.py"
```
- In Chrome, click on "Manage extensions"
- Choose "Load unpacked extension", browse to c:\savetexttofile, choose "Select folder"
- In the Extensions page, copy the extension's ID to the clipboard
- Edit app\savetexttofile_win.json and replace the extension ID with the one from the clipboard.
- On the Chrome Extensions page, click on the Details button of the new Extensions
- Click on the Options link
- In the modal, ensure that "Application found" has a checkmark
- Enter c:\savetexttofile as the local save directory, then click Save and close the modal.
- Browse to a web page and check if some words are highlighted.
- Add a word and see if a popup appears about the word being added, and see if the word is added to wordlist.txt

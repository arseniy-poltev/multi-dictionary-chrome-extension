:: HKCU to install for user.
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\savetexttofile" /ve /t REG_SZ /d "C:\savetexttofile\app\savetexttofile_win.json" /f

:: HKLM if you want to install globally.
REG ADD "HKLM\Software\Google\Chrome\NativeMessagingHosts\savetexttofile" /ve /t REG_SZ /d "C:\savetexttofile\app\savetexttofile_win.json" /f

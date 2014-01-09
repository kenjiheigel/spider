Spider
======
Web crawler for Liferay portal written in javascript with CasperJS.

Installation
------------
1. Download and install [CasperJS](http://casperjs.org/)
2. Build and run Liferay Portal
3. Run the spider with the following command:
    - $ casperjs main.js

The results will be displayed in the console, a folder "screenshots" and a file with name "url_list.json" will be created.

screenshots folder contains the screenshots captured.

Command Line Options
---------------------
--log-level: set the logging level

--verbose: prints debugging message to console; used in combination with --log-level

--depth: set the depth limit for the crawler

For example,

$ casperjs --verbose --log-level=debug --depth=3 main.js

Colored Output in Windows Consoles
-----------------------------------
Use ANSICON to support escape sequence in Windows

- Download [ANSICON](https://github.com/adoxa/ansicon)

- Extract the files in x64 or x86 from the zip archive to C:\ansicon
	- The folder should have the following files: ANSI32.dll, ANSI64.dll, ansicon.exe

- Add C:\ansicon to PATH environment variable

- Install ANSICON (didn't work!)
	- Type ansicon -i in console

- Wrap Git Bash with ANSICON
	- Type the following command in Git Bash console or add it to .bash_profile
      - $ ansicon.exe "C:\Program Files (x86)\Git\bin\sh.exe" --login -i

Spider
======
Web crawler for Liferay portal written in javascript with CasperJS.

Installation
------------
1. Download and install [CasperJS](http://casperjs.org/)
2. Install node packages
	- [async](https://www.npmjs.org/package/async)
	- [es6-promise](https://www.npmjs.org/package/es6-promise)
	- [tree-model](https://www.npmjs.org/package/tree-model)
3. Run the spider ```$ casperjs main.js```

The folder "./screenshots" contains the screenshots captured. 

Command-line Options
---------------------
- ```depth```: set the crawl depth for the crawler
	- Type: Number
	- Default: 3
- ```log-level```: set the logging level
	- Type: String [debug | info | warning | error]
	- Default: error
- ```threshold```: set the comparison threshold for the image-comparator
	- Type: Number [0-1]
	- Default: 0.95

Example:

```
$ casperjs --log-level=debug --depth=3 --threshold=0.85 main.js
```

Configuration Options
---------------------
Configuration options can be set in **config.json**

- ```casper```: construct casper instance
	- Type: Object
- ```depth```: set the crawl depth for the crawler
	- Type: Number
- ```homepage```: set the starting page
	- Type: Object
- ```login```: set the login credential
	- Type: Object
- ```threshold```: set the comparison threshold for the image-comparator
	- Type: Number [0-1]
- ```viewport```: define viewport(s) for screenshots
	- Type: Array of objects

Colored Output in Windows Consoles
-----------------------------------
Use *ANSICON* to support escape sequence in Windows

- Download [ANSICON](https://github.com/adoxa/ansicon)
- Extract the files in x64 or x86 from the zip archive to C:\ansicon
	- The folder should have the following files: ANSI32.dll, ANSI64.dll, ansicon.exe
- Add C:\ansicon to PATH environment variable
- Install ANSICON (Note: this might not work!)
	- Type ansicon -i in console
- Wrap Git Bash with ANSICON
	- Type the following command in Git Bash console or add it to .bash_profile
      - $ ansicon.exe "C:\Program Files (x86)\Git\bin\sh.exe" --login -i

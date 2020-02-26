NodeJS Data Server

What is it?
A simple HTTP web server built with NodeJS (server-side Javascript).  It can read and display data from multiple sources
and allows for easy retrieval of data from multiple instruments in real time without needing to open multiple different export files.

To start all servers at once....
•   Navigate to the directory where the script file is located `P:\Operations\Lab\TiamoData\NodeJS Server`
•   Right click in the folder and select `Git Bash Here` to open a terminal window.
•   In the terminal window you will need to enter the command `node startAll.js`  This will start all server processes at once.

  OR

To start the server(s) individually...

•   Navigate to the directory where the script file is located `P:\Operations\Lab\TiamoData\NodeJS Server`
•   Right click in the folder and select `Git Bash Here` to open a terminal window.
•   In the terminal window you will need to enter a command to start each server module.  
        For Tiamo...
        Type the command `node tiamo-server.js` and press Enter.  This tells the NodeJS Runtime to read the node-server.js script file.
        For TJ...
        Type the command `node tj-server.js` and press Enter.  
        For Pentra...
        Type the command `node pentra-server.js` and press Enter. 
	For DMA 5000 M....
	Type the command `node dma-server.js` and press Enter.
	For ChemWell.....
        Type the command `node chemWell-server.js` and press Enter.
•   The server(s) will start running.  To see the data, open any web browser and navigate to the URL displayed in the terminal window.
•   To stop the server(s) select the terminal window of running server and  hold `Ctrl` + `c` or close the terminal window(s).
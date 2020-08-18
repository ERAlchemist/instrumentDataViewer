NodeJS Data Server

What is it?
A simple HTTP web server built with NodeJS (server-side Javascript).  It can read and display data from multiple sources
and allows for easy retrieval of data from multiple instruments in real time without needing to open multiple different export files.

To start the server for all instruments
-----Using Git Bash-------------------------------------------------------------------------------------------
•   Navigate to the directory where the script file is located `P:\Operations\Lab\TiamoData\NodeJS Server`
•   Right click in the folder and select `Git Bash Here` to open a terminal window.
•   In the terminal window you will need to enter the command:
         node startAll.js  
 This will start all server processes at once.

----Using CMD------------------------------------------------------------------------------------------------
•   On the keyboard press:
        Windows + R 
•   In the dialog box type:
        CMD
    Press Enter
•   Enter the following commands into the CMD terminal window (press enter after each of the following commands):
        p:
        cd Operations\Lab\TiamoData\NodeJS Server
        node startAll.js

----Using batch file----------------------------------------------------------------------------------------------
The CMD commands above can be put into a .bat file and executed in Windows by double clicking the file.  
A .bat file named startServer.bat was created 8/10/2020 and placed in the NodeJS Server directory.  
If you doubleclick on the file it should run.  
A copy of the file was also placed in the startup directory which should launch automatically at startup.
To check startup directory:
        • On the keyboard press:
                Windows + R 
        • In the dialog box type:
                shell:startup
Note: this is by far the easiest method to start the server (requiring no work from the user if .bat file is placed in the startup directory) however, if an error occurs that prevents 
the process from starting, it will just fail to launch and not indicated why.  Using the CMD or Bash start-up methods above will provide more detail on why the process is failing to start. 

  
•   The server(s) will start running.  To see the data, open any web browser and navigate to the URL displayed in the terminal window.
•   To stop the server(s) select the terminal window of running server and  hold `Ctrl` + `c` or close the terminal window(s).


To start the server(s) individually (only necessary for testing and debugging purposes)...

•   Using any of the 3 methods listed above but change the node command to commands listed below
•   The commands for each server module are as follows
        For Tiamo use command
                node tiamo-server.js 
        press Enter.  This tells the NodeJS Runtime to read the tiamo-server.js script file.
        For TJ use command
                node tj-server.js 
        For Pentra use command 
                node pentra.js
	For DMA 5000 M use command
	         node dma-server.js 
	For ChemWell use command
                node chemWell-server.js 

const currentVersion = "1.6.2";

const updateInfo = {
    "1.6.2" : {
        "changes": ["Refactored code for reading and parsing PDF files for DMA data stream.", "Removing 'Data' words from instrument titles on navigation bar"], 
        "Date": "2/6/20"
    },
    "1.6.1" : {
        "changes": ["Improved display of Futura Data by rounding the concentration numbers and merging the FSO2 and TSO2 data onto a single line"], 
        "Date": "1/17/20"
    },
    "1.6.0" : {
        "changes": ["Added Futura instrument Data"], 
        "Date": "1/15/20"
    },
    "1.5.5" : {
        "changes": ["Created paths.js which contains all directories/file paths for each instrument", "Added a Setup and Troubleshooting section of the server directory with instructions on how to restore connectivity to Pentra"], 
        "Date": "12/09/19"
    },
    "1.5.4" : {
                "changes": ["Changed display for DMA 5000 M Data to have each test in its own cell in the HTML table", 
                 "Added Tool-tips to DMA 5000 M HTML data table", 
                 "Refactored code to use `boilerPlateHTML` template for each data server module"], 
                "Date": "11/13/19"
            },
    "1.5.3" : {
        "changes": [ "Added client-side JS script to reload page every 3 or 5 minutes", 
                "Added current version number to nav bar"],
                "Date": "11/4/19"
            },
    "1.5.2" : {
        "changes": ["Updated ChemWell-Server to select archive file using current year and month instead of hard-coded archive file path.", 
                 "Created seperate findHost module to redunecies in each server module"],
                "Date" : "11/3/19"
            }
};
exports.version = currentVersion;
exports.info = updateInfo;
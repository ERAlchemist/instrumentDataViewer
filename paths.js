const os = require('os');
const paths = {
    'Pentra C400': "Z:\\", 
    'Anton Paar DMA 5000 M' : `C:/Users/${os.userInfo().username}/ftp`,
    '814 Auto-Titrator "TJ"':  "P:\\Operations\\Lab\\TiamoJR Data\\Data Dump_TiamoJr.csv",
    '855 Auto-Titrator "Tiamo"':  "P:\\Operations\\Lab\\TiamoData\\TiamoDataDump.csv",
    'ChemWell': ["\\\\MJ04K72X\\ChemWell R6\\Root\\Archive", //primary
                 "\\\\10.128.116.223\\ChemWell R6\\Root\\Archive" ], //secondary
    'Futura' : ["\\\\MJ045H2L\\Futura\\Data\\Database\\FuturaDB.db", //primary
                `\\\\10.148.85.9\\Futura\\Data\\Database\\FuturaDB.db` ]   //secondary
};

exports.paths = paths;
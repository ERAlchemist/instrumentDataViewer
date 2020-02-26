const os = require('os');
const paths = {
    'Pentra C400': "Z:\\", 
    'Anton Paar DMA 5000 M' : `C:/Users/${os.userInfo().username}/ftp`,
    '814 Auto-Titrator "TJ"':  "P:\\Operations\\Lab\\TiamoJR Data\\Data Dump_TiamoJr.csv",
    '855 Auto-Titrator "Tiamo"':  "P:\\Operations\\Lab\\TiamoData\\TiamoDataDump.csv",
    'ChemWell': "\\\\10.128.117.205\\ChemWell R6\\Root\\Archive",
    'Futura' : `\\\\10.148.85.23\\Futura\\Data\\Database\\FuturaDB.db`
};

exports.paths = paths;
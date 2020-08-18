
const fs = require('fs');

const writeToLog = (instrumentName, text) =>{
    let logFile = '';
    switch(instrumentName){
        case 'Pentra C400' : logFile = './logs/pentraLog.txt'; break;
        case 'Anton Paar DMA 5000 M': logFile =  `./logs/dmaLog.txt`;  break;
        case '814 Auto-Titrator "TJ"':logFile =   './logs/tjLog.txt';  break;
        case '855 Auto-Titrator "Tiamo"':logFile =   './logs/tiamoLog.txt';  break;
        case 'ChemWell':logFile =  './logs/chemwellLog.txt';  break;
        case 'Futura' :logFile =  './logs/futuraLog.txt';  break;              
    }
    try{
        fs.appendFileSync(logFile, text+'\n');
    }catch(err){
        console.log("could not write to log file\n"+err);
    }
    
};

const logRequest = (req)=>{
    let arr = req.rawHeaders;
    let reqArr = [];
     for(let i=0; i<arr.length-1; i+=2){
       reqArr[i] = "\t"+arr[i]+": " +arr[i+1];
     }
    reqArr =  [new Date()+":\n---REQUEST---"].concat(reqArr)
    reqArr.push("---REQUEST END---");
     return reqArr.filter(x=> x != '').join('\n').replace('\n\n', '');
  };
exports.writeToLog = writeToLog;
exports.logRequest = logRequest;
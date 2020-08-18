'use strict';

const http = require('http');
const host = require('./findHost.js');
const instrumentName = `ChemWell`;
const hostname = host.hostname;
const port = 8000;
const fs = require('fs');
const versionInfo = require('./versionInfo.js');
const logger = require('./logger.js').writeToLog;
const logRequest = require('./logger.js').logRequest;
const currentVersion = versionInfo.version;
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
const d3 = require('d3');
let dateString = new Date().toISOString();
let arr = dateString.split("-");
let year = arr[0], 
    month = arr[1];
const chemWellPath = require('./paths.js').paths[instrumentName][1]; // [0] = primary path, [1] = secondary path
let archive = `${chemWellPath}/dbTest_Archive_${year}_${parseInt(month)}.mdb`; // The archive database file for currrent month and year
// Get the adodb module
const ADODB = require('node-adodb');
ADODB.debug = true;
// Connect to the MS Access DB
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${archive};`);
// Query the DB
let rawData; 
let records = [];
logger(instrumentName, "<<<<<<<<---STARTED--->>>>>>>>>");
const readCSV = (fileToRead, outputJSON) => {
  //fileToRead and outputJSON are relative path strings
  // call like this:
  //readCSV("/output/tbTest.csv", './data/chemWellHData.JSON');

// use readCSV function call to incorporate other historical data

 // Create CSV from .mdb file Using CURL
//Replace database.mdb with the path to the database you want to convert.
//The file output.zip will contain a CSV file, one for each table in the given database file. If something went wrong, output.zip contains the error message.
///curl -F files[]=@database.mdb 'https://www.rebasedata.com/api/v1/convert?outputFormat=csv&errorResponse=zip' -o output.zip

  let raw = fs.readFileSync(chemWellPath+fileToRead,'utf8'); 
  let historical = d3.csvParseRows(raw);

  let header = historical[0];
//console.log(header);
  let objects = [];
  for(let i=1; i<historical.length; i++){
    let obj = {};
    let analysisArr = historical[i];
    for(let j=0; j<header.length; j++){
      obj[header[j]] = analysisArr[j];
    }
    objects.push(obj);
  }
   // console.log(objects);
  try {
    fs.writeFileSync(outputJSON,JSON.stringify(objects), 'utf8')
  } catch (error) {
    console.error(error);
    logger(instrumentName, error);
  }
};


const getActiveData =()=>{
  async function query() {
    try {
      const tests = await connection.query('SELECT * FROM tbTest');
      logger(instrumentName, `reading from ${archive}:\n ${tests.length} active database records found`);
      fs.writeFileSync('./data/chemWellData.JSON',JSON.stringify(tests), 'utf8')
    } catch (error) {
      console.error(error);
      logger(instrumentName, error);
    }
  }
  query();
};
const mergeData = ()=>{
  let newRecords =[], oldRecords=[];
  getActiveData();
  try{
    rawData = fs.readFileSync('./data/chemWellData.json');
    newRecords = JSON.parse(rawData);
  //  console.log("records from json is now " + records.length);
  } catch (err) {
   console.log(err);
   logger(instrumentName, error);
  }
  try{
    rawData = fs.readFileSync('./data/chemWellHData.json');
    oldRecords = JSON.parse(rawData);
    //console.log("records from json is now " + records.length);
    logger(instrumentName, `${oldRecords.length} historical records found`);
  } catch (err) {
   console.log(err);
   logger(instrumentName, error);
  }
  let mergedRecords = oldRecords
                      .concat(newRecords)
                      .sort((a,b)=>b.TestNo-a.TestNo);
  let IDs = [...new Set(mergedRecords.map(x=>x.TestNo))];
  let finalRecords = [];
  IDs.forEach(id=>finalRecords.push(mergedRecords.filter(x=>x.TestNo == id)[0]))
  try {
    fs.writeFileSync('./data/chemWellHData.JSON',JSON.stringify(finalRecords), 'utf8')
  } catch (error) {
    console.error(error);
    logger(instrumentName, error);
  }
  logger(instrumentName, `${finalRecords.length} records ready for display`)
  return finalRecords;
};
// const logRequest = (req)=>{
//   let arr = req.rawHeaders;
//    let reqArr = [];
//  //  console.log(arr.length);
//    for(let i=0; i<arr.length-1; i+=2){
//      reqArr[i] = "\t"+arr[i]+": " +arr[i+1];
//    }
//   reqArr =  [new Date()+":\n---REQUEST---"].concat(reqArr)
//   reqArr.push("---REQUEST END---");
//   //console.log(reqArr);
//    return reqArr.filter(x=> x != '').join('\n').replace('\n\n', '');
// };
const server = http.createServer((req, res) => {
   
  // arr.forEach(part=>logger(instrumentName, part))
   logger(instrumentName, logRequest(req));

   logger(instrumentName, new Date() + ":\n___RESPONSE___");
  records = mergeData();
    res.write(`${boilerPlateHTML}
            <thead class="thead-light">
              <tr>
              <th scope="col">Record #</th>
                <th scope="col">Date</th>
                <th>Sample ID</th>
                <th scope="col">Test Method</th>
                <th scope="col">Concentration</th>
              </tr>
            </thead>
              <tbody>`);

    for(let i=0; i<records.length; i++){
      let rec = records[i];
      res.write(`<tr>
                  <td style="border-right: 1px solid; background-color: white;">${rec.TestNo}</td>
                  <td>${new Date(rec.Time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</td>
                  <td>${rec.SampleID.replace("R-", "")}</td>
                  <td>${rec.AssayName}</td>
                  <td>${rec.Conc}</td>
                </tr>`);
    }
  
    res.write(`</tbody>
                </table>
              </div>
            </div>
          </div>`);
      res.end(`  </body>
                </html>`);
logger(instrumentName, new Date() + ":\n___RESPONSE END___");
}).listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});

exports.analyses = records;
  
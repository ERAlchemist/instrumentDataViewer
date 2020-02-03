'use strict';
const http = require('http');
const host = require('./findHost.js');
const instrumentName = `ChemWell`;
const hostname = host.hostname;
const port = 8000;
const fs = require('fs');
const versionInfo = require('./versionInfo.js');
const currentVersion = versionInfo.version;
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
let dateString = new Date().toISOString();
let arr = dateString.split("-");
let year = arr[0], 
    month = arr[1];

const chemWellPath = require('./paths.js').paths[instrumentName];
let archive = `${chemWellPath}/dbTest_Archive_${year}_${month}.mdb`; // The archive database file for currrent month and year
// Get the adodb module
const ADODB = require('node-adodb');
ADODB.debug = true;
// Connect to the MS Access DB
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${archive};`);
// Query the DB
let rawData; 
let records; 
const server = http.createServer((req, res) => {
 // console.log(req.headers);

  async function query() {
    try {
      const tests = await connection.query('SELECT * FROM tbTest');
  
      fs.writeFileSync('./data/chemWellData.JSON',JSON.stringify(tests), 'utf8');
    } catch (error) {
      console.error(error);
    }
  }
  query();

  try{
    rawData = fs.readFileSync('./data/chemWellData.json');
    records = JSON.parse(rawData);
    console.log("records from json is now " + records.length);
  } catch (err) {
   console.log(err);
  }
  // 
    res.write(`${boilerPlateHTML}
              <tr><thead class="thead-light"><th scope="col">Date</th><th>Sample ID</th><th scope="col">Test Method</th><th scope="col">Concentration</th></thead></tr>
              <tbody>`);
    //add data to HTML table....
 let times =  records.map(a=>a.Time);
 records.sort((a,b)=>new Date(b.Time)- new Date(a.Time));
    for(let i=0; i<records.length; i++){
      let rec = records[i];
      res.write(`<tr><td>${new Date(rec.Time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</td><td>${rec.SampleID.replace("R-", "")}</td><td>${rec.AssayName}</td><td>${rec.Conc}</td><ul>`);
    }
    res.write(`</tbody></table></div></div></div>`);
      res.end(`  </body>
                </html>`);
}).listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});

exports.analyses = records;
  
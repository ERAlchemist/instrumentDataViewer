const SQL = require('sql-template-strings');
const sqlite = require(`sqlite`);
const fs = require('fs');
const http = require('http');
const host = require('./findHost.js');
const instrumentName = `Futura`;
const hostname = host.hostname;
const port = 9000;
const versionInfo = require('./versionInfo.js');
const currentVersion = versionInfo.version;
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
const futuraPath = require('./paths.js').paths[instrumentName][1];  // [0] indicates primary path  
                                                                    // [1] indicates secondary path
const logger = require('./logger.js').writeToLog;
const logRequest = require('./logger.js').logRequest;


const sqlite3 = require('sqlite3').verbose();
class FuturaRecord {
  constructor(record1, record2){
   this.fso2 = Math.round(record1.Concentration);
   this.tso2 = Math.round(record2.Concentration);
   this.tstamp = record1.tstamp;
   this.sample_name = record1.sample_name;
   this.id_sample = record1.id_sample;
  }
}
let rawData; 
let records; 
let merged = [];
async function getData() {
  let db = new sqlite3.Database(futuraPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(err.message);
      }else console.log('Connected to the Futura database.');
    });
  db.serialize(() => {
    let arr = [];
    let str = "";
    const data =  db.all(`SELECT Concentration, tstamp, id_sample, sample_name, num_console
             FROM sample_results
             INNER JOIN samples on samples.id = sample_results.id_sample
             ORDER BY id_sample DESC`, (err, row) => {
      if (err) {
        console.error(err.message);
      }
      str += JSON.stringify(row);
     fs.writeFileSync('./data/futuraData.JSON',str, 'utf8');
     });
 })

 db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Close the database connection.');
  });
  try{
    rawData = fs.readFileSync('./data/futuraData.json');
    records = JSON.parse(rawData);
  
  let idSet = new Set(records.map(x=>x.id_sample));
  idSet.forEach(id=>{ 
    let group = records.filter(record => record.id_sample  == id);
    let fso2 = group.filter(rec => rec.num_console == 1)[0];
    let tso2 = group.filter(rec => rec.num_console == 2)[0];
    merged.push(new FuturaRecord(fso2, tso2));
  })
    console.log("Futura Records is now " + merged.length);
  } catch (err) {
   console.log(err);
  }
  merged.sort((a,b)=> new Date(b.tstamp) - new Date(a.tstamp));
  fs.writeFileSync('./data/futuraData1.JSON',JSON.stringify(merged), 'utf8');
  merged = [];
}
  getData();
  logger(instrumentName, "<<<<---STARTED--->>>>");
const server = http.createServer((req, res) => {
  logger(instrumentName, logRequest(req));
  logger(instrumentName, new Date()+":\n___RESPONSE___");
  getData();
  const headerFields = ["Date", "Sample ID", "FSO2", "TSO2"];
    try{
      rawData = fs.readFileSync('./data/futuraData1.json');
      records = JSON.parse(rawData);
    } catch(err){
      console.log(err);
    }
    res.write(`${boilerPlateHTML}
              <thead class="thead-light">
                <tr>`);
    headerFields.forEach( field =>res.write(`<th scope="col">${field}</th>`) )
    res.write(` </tr>
              </thead>
              <tbody>`);
    for(let i=0; i<records.length; i++){
      let rec = records[i];
      res.write(`<tr>
                    <td>${new Date(rec.tstamp).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</td>
                    <td>${rec.sample_name}</td>
                    <td>${rec.fso2}</td>
                    <td>${rec.tso2}</td>
                  <tr>`);
    }
    res.write(`</tbody>
              </table>
            </div>
          </div>
        </div>`);
      res.end(`  </body>
                </html>`);
}).listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});
'use strict';
const test = false;
const http = require('http');
const hostname = require('./findHost.js').hostname;
const port = 7000;
const instrumentName = `Anton Paar DMA 5000 M`;
const currentVersion = require('./versionInfo.js').version;
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
const fs = require('fs');
const pdf = require('pdf-parse');
const pdfsPath = test ? 'P:/Operations/Lab/TiamoData/NodeJS Server/dataExampleFiles/dmaTest': require('./paths.js').paths[instrumentName];
const moveFile = require('move-file');
const os = require('os');
const reload = require('reload');

const dataFile = test ? './data/dmaData2.json' :`./data/dmaData.json`;
const watch = require('node-watch');
const logger = require('./logger.js').writeToLog;
const logRequest = require('./logger.js').logRequest;
logger(instrumentName, "<<<<<<<<---STARTED--->>>>>>>>>");
class Analysis_DMA {
  constructor(string){
    let rows = string.split('\n');
    this.name = rows.filter(row=> row.match(/Sample Name: /))
                    .join('\n')
                    .split(/Sample Name: /)[1];
    this.time = rows.filter(row=> row.match(/Time: /))
                    .join('\n')
                    .split(/Time: /)[1];
    this.date = rows.filter(row=> row.match(/Date: /))
                    .join('\n')
                    .split(/Date: /)[1];
    this.dateTime = new Date(this.date+" "+this.time).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    this.method = rows.filter(row=> row.match(/Method: /))
                      .join('\n')
                      .split(/Method: /)[1];
    this.id = parseInt(rows.filter(row=> row.match(/Unique Sample Id: /))
                            .join('\n')
                            .split(/Unique Sample Id: /)[1]);
    this.result = rows.join('\n')
                      .split(/Measurement Result:/)[1];
    this.url = string.split('---url---')[1];
  }
}
let rawData = fs.readFileSync(dataFile);
let records = [];
try{
  records = JSON.parse(rawData);
} catch (err) {
 console.log(err);
 logger(instrumentName, err);
}
let strings = [];
const process = (name) => {
    const fileUrl = `${name}`;
    let raw = fs.readFileSync(fileUrl);
    pdf(raw).then((data)=> strings.push( `${data.text}---url---${fileUrl}` ))
    try{
      let mPath = test? `P:/Operations/Lab/TiamoData/NodeJS Server/dataExampleFiles/dmaTestArchive/` : `C:/Users/${os.userInfo().username}/Desktop/dma file archive/`;
      moveFile(fileUrl, `${mPath}${fileUrl.split("/").reverse()[0]}`);
    }catch (err) {
          console.log(err);
          logger(instrumentName, err);
        }
};

const getData = () => {
  try{
    fs.readdirSync(pdfsPath)
      .forEach(fileName=>process(pdfsPath+"/"+fileName));
  }catch(err){
    console.log(err);
    logger(instrumentName, err);
  }
  
  try{
      rawData = fs.readFileSync(dataFile);
      records = JSON.parse(rawData);
      console.log("records from json is now " + records.length);
    } catch (err) {
     console.log(err);
     logger(instrumentName, err);
    }
    let newRecords = strings.filter(x=> x.match(/Sample Information:/))
                            .map(x=> new Analysis_DMA(x))
                            .sort((a,b) => b.id - a.id);
    console.log("new records are...");
    newRecords.length > 0 ? console.log(newRecords): console.log("No new records created");
    let dmaRecords = newRecords.concat(records).sort((a,b)=>b.id-a.id);
    let set = [...new Set(dmaRecords.map(x=>x.id))];
    let noDuplicates = [];
    set.forEach(id=>{
       let record = dmaRecords.filter(rec=>rec.id == id);
       noDuplicates.push(record[0]);
    });
    dmaRecords = noDuplicates;
    console.log(`${instrumentName}: Total records = ${dmaRecords.length}`);
    try {
      fs.writeFileSync(dataFile, JSON.stringify(dmaRecords), 'utf8');
       console.log(newRecords.length);
       const message = newRecords.length > 0 ? "New data was added to file!" : "No new data found"
       console.log(`${instrumentName}: ${message}`);
     } catch (err){
       console.log(err);
       logger(instrumentName, err);
    }
    try{
      rawData = fs.readFileSync(dataFile);
      records = JSON.parse(rawData);
      console.log("records from json is now " + records.length);
    } catch (err) {
     console.log(err);
     logger(instrumentName, err);
    }
    return records;
};
watch(pdfsPath, { recursive: true }, function(evt, name) {
  getData();
  console.log('%s changed.', name);
  logger(instrumentName, '%s changed.'+name);
});
const fieldHeaders = ["Date", "Sample ID", "Test Method", "Alcohol (%v/v)", "Density (g/cm³)", "Specific Gravity", "Ethanol  OIML-ITS-90 (% v/v)", "PDF"];
  const server = http.createServer((req, res) => {
    logger(instrumentName, logRequest(req));
    logger(instrumentName, new Date()+":\n___RESPONSE___");
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    records = getData();
  
      res.write(`${boilerPlateHTML}
          <thead class="thead-light">
            <tr>
              <th scope="col">Record #</th>
                ${fieldHeaders.map(field => `<th scope="col">${field}</th>`).join('')}
            </tr>
          </thead>
        <tbody>`
        )
      //add data to HTML table....
        let count = 0;
       for(let i=0; i<records.length; i++){
          let rec = records[i],
              num = records.length -i;
          if(rec == undefined) continue;
          if(rec.dateTime == "Invalid Date") continue;
          res.write(`
                        <tr>
                        <td data-toggle="tooltip" title="Record #" style="border-right: 1px solid;">${num}</td>
                        <td data-toggle="tooltip" title="Time">${rec.dateTime}</td>
                        <td data-toggle="tooltip" title="Sample Name">${rec.name}</td>
                        <td data-toggle="tooltip" title="Test Method">${rec.method}</td>`)
          if(rec.result == undefined) continue;
          let list = rec.result.split('\n');
          list.shift();
          list.pop();
          let counter = 0;
          list = list.map(part => part.match("Alcohol Condition") && rec.method.trim() == "Alcolyzer Wine-WINE EXT"  ? "@" : 
                                  part.match("Alcohol Condition") ? "" : 
                                  part.split(":")[1]);
          for(let i = 0; i< list.length; i++){
            let part = list[i];
            if(part == "@") continue ;
              res.write(`<td data-toggle="tooltip" title="${fieldHeaders[counter+3]}">${part}</td>`);
              counter++;
          }
          let urlParts = rec.url.split('/');
          res.write(`<td data-toggle="tooltip" title="See PDF">
                        <a href="${`file://\\\\${hostname}/Users/GonzalesLab/Desktop/dma file archive/${urlParts[urlParts.length-1]}`}">
                        
                          <img src="https://i2.wp.com/www.uei.com/wp-content/uploads/2017/10/pdf-icon.png" height="80px" width="80px" class="d-inline-block align-top" />
                        </a>
                    </td>`);
         count++;
        } ///<a href="${`ftp://${hostname}:21/archive/${urlParts[urlParts.length-1]}`}"> old ftp link
        res.write(`</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>`);
      
        res.end(`  </body>
                </html>`);
                logger(instrumentName, new Date()+":\n___RESPONSE END___");
        console.log("display count is " + count);
        
       
  }).listen(port, hostname, () => {
    console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
   
  });
  
  exports.dmaData = getData;

 
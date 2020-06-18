
'use strict';
const instrumentName = 'Pentra C400';
const http = require('http');
const host = require('./findHost.js');
const hostname = host.hostname;
const port = 5000;
const versionInfo = require('./versionInfo.js');
const currentVersion = versionInfo.version;
const fs = require('fs');
const d3 = require('d3');
const _ = require('lodash');
const moveFile = require('move-file');
const c400Path = require('./paths.js').paths[instrumentName];


class Analysis { 
    constructor(string) {
      let arr = string.split('--time--');
      string = arr[0];
      let testString = "";
      let dateTime = arr[1];
      let rows = string.split('\n');
      this.name = rows.filter(row=> row.match(/Name; |SID; /)).join('\n').split(/Name; |SID; /)[1];
      testString= rows.filter(row=> row.match(/Test name; /)).join('\n').split(/Test name; /)[1];
      this.test = testString;
      this.date = new Date(dateTime);
      this.value = rows.filter(row=> row.match(/Result value; /)).join('\n').split(/Result value; /)[1];
      this.position = parseFloat(rows.filter(row=> row.match(/Position; /)).join('\n').split(/Position;/)[1]);
      this.type = rows.filter(row=> row.match(/Sample type; /)).join('\n').split(/Sample type; /)[1].trim();
      this.key = rows.filter(row=>row.match(/Rate; /)).join('\n').split(/Rate; /)[1]+this.name+this.test+this.value;  // a unique id generated from the data to help remove duplicates
      this.hasFlags = rows.filter(row=>row.match(/Flags list;/)).join('\n').split(/Flags list; /).length > 1 ? true : false;
      this.flags = this.hasFlags ? rows.filter(row=>row.match(/Flags list;/)).join(` (${testString}) \n`).split(/Flags list; /) : [];
  
    }
}

class MergedRecord {  //merges multiple records into a single record
  constructor(recArr){
    this.date = recArr.length != 0 ? recArr[0].date : null;
    this.name = recArr.length != 0 ? recArr[0].name : null;
    this.malic =  recArr.filter(rec=> rec.test == "Tmal ser").length != 0 ? recArr.filter(rec=> rec.test == "Tmal ser")[0].value : null;
    this.rs = recArr.filter(rec=> rec.test == "RS ser").length != 0 ? recArr.filter(rec=> rec.test == "RS ser")[0].value : null;
    this.acetic = recArr.filter(rec=> rec.test == "AA ser").length != 0 ? recArr.filter(rec=> rec.test == "AA ser")[0].value : null;
    this.rs4 = recArr.filter(rec=> rec.test == "RS4 ser").length != 0 ? recArr.filter(rec=> rec.test == "RS4 ser")[0].value : null;
    this.type = recArr[0].type;
    this.key = recArr.map(a=>a.key).join("");
    this.hasFlags = recArr.map(a=>a.hasFlags).includes(true);
    this.flags = this.hasFlags ? recArr.map(x=>x.flags).filter(x => x.length > 0).join(",").replace(/,/gi, "") : [];
  }
}
let strings =[];
let records = [];

const process = name => {
  const raw = fs.readFileSync(`${name}`, 'utf8'); 
  let nameString = `${name}`.split(" ");
  let rawTimeString = nameString[1];
  let rawDateString = nameString[0].split("Routine")[1];
  let dateArr = rawDateString.split("-");
  let dateString = `${dateArr[1]} ${dateArr[0]} ${dateArr[2]}`;
  let timeArr = rawTimeString.split("-").map(x=>parseInt(x)); //[hours, minutes, seconds]
  let timeString = `${timeArr[0] < 10 ? '0'+timeArr[0]: timeArr[0]}:${timeArr[1] < 10 ? '0'+timeArr[1]: timeArr[1]}:${timeArr[2] < 10 ? '0'+timeArr[2]: timeArr[2]}`

  let analysisString = "";
  d3.csvParseRows(raw).forEach(arr=>{
    if(arr[0] != ""){
      analysisString += `${arr[0]}\n`
    }else{
      strings.push(`${analysisString} --time-- ${dateString} ${timeString}`);
      analysisString = "";
    } 
  })
  records = strings.map(x=> new Analysis(x) )
    .filter(x=> x.type != "Calibration");
    console.log(`${records.length} new records...`);
    records.forEach(record=> console.log(record))
  try{
    moveFile(name, `C:/Users/GonzalesLab/Desktop/pentra file archive/${name.split("/").reverse()[0]}`); // moves file to archive after processed
    //console.log(`file moved to archive`);
  }catch (err) {
        console.log(err);
      //  console.log('file move unsuccessful');
      }
};

let files; 
let rawData;
let oldRecords = [];
try{
  rawData = fs.readFileSync('./data/pentraData.json');
  oldRecords = JSON.parse(rawData);
} catch (err) {console.log(err);}
const server = http.createServer((req, res) => {
  strings = [];
  try{
    rawData = fs.readFileSync('./data/pentraData.json');
    oldRecords = JSON.parse(rawData);
    console.log(`${instrumentName}: records from json is now ${records.length}`);
  } catch (err) {
   console.log(err);
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  try{
    files = fs.readdirSync(c400Path);
  _.each(files, filename => process(`${c400Path}/${filename}`));
  }catch (err) { 
    console.log(err);
  }
  oldRecords.forEach(rec=> rec.date = new Date(rec.date));
 
  let times = records.map(a=>a.date); 
  let arrays = [];
 
  times.forEach(time=>{
   let filt = records.filter(x => x.date.toString() == time.toString()).sort((a,b)=>a.name-b.name);
   let names = [...new Set(filt.map(x=>x.name))];
   names.forEach(name=>{ 
      let group = filt.filter(rec=>rec.name == name);
      arrays.push(group);
    })
  })
 
 let merged = arrays.map(group=> new MergedRecord(group)).sort((a,b)=>a.name - b.name).sort((a,b)=>b.date-a.date);

 //boiler plate HTML code
 const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);

  let columns = [ "Date", "Sample ID", "RS (g/L)", "Acetic Acid (g/L)", "Malic Acid (g/L)", "RS4 (g/L)", "FLAGS"];
  res.write(`${boilerPlateHTML}<!-- pentraFirstWrite-->
    <thead>
      <tr>
        <th>Record #</th>`
      );
        columns.forEach(
          (col)=>res.write(`<th scope="col">${col}</th>
                            `)  
        );
  res.write(`</tr></thead>
  <!-- After thead-->
    <!-- After first tr-->
  `);

    //add data to HTML table....
    // Used to remove dupicates (if necessary....)
         let arr = merged.concat(oldRecords); // adds old records (from pentraData.json file) to new records 
         arr = arr.sort((a,b)=>a.key-b.key);
         let keySetArr = [...new Set(arr.map(x=>x.key))]; // creates an array of keys without duplicates
         arr = keySetArr.map(x=>arr[arr.map(x=>x.key).indexOf(x)]).sort((a,b)=>b.date - a.date); // uses unique key array to create an array of Analysis objects
         try {
          fs.writeFileSync('./data/pentraData.JSON',JSON.stringify(arr), 'utf8');
           console.log(`${instrumentName}: Data was added to file!`);
         } catch (err) {
           console.log(err);
        }
    let count = 0;
    
    for(let i=0; i<arr.length; i++){
      let row = arr[i];
      let num = arr.length-i;
      res.write(` <!-- Data Starts-->${row.type == "Control" && row.hasFlags == false ? 
                  `<tr class="table-success">` : 
                  row.type == "Control" && row.hasFlags == true ?
                  `<tr class="table-warning">` : 
                  '<tr>'}
                  <th scope="row" style="border-right: 1px solid; background-color: white;">${num}</th>
                    <td data-toggle="tooltip" title="Date Time">${row.date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</td>
                    <td data-toggle="tooltip" title="Sample Name">${row.name}</td>
                    <td data-toggle="tooltip" title="RS (g/L)">${row.rs != null ? row.rs : ""}</td>
                    <td data-toggle="tooltip" title="Acetic Acid (g/L)" >${row.acetic != null ? row.acetic : ""}</td>
                    <td data-toggle="tooltip" title="Malicic Acid (g/L)" >${row.malic != null ? row.malic : ""}</td>
                    <td data-toggle="tooltip" title="RS4 (g/L)" >${row.rs4 != null ? row.rs4 : ""}</td>
                    ${ row.hasFlags ? `<td class="table-warning" data-toggle="tooltip" title="Flags" >${row.flags}</td>`: `<td ></td>`}
                  </tr>
                  `
                );
      count++;
    }
console.log(`${instrumentName} displaying ${count}  records`);
res.write(`
               
          </table>
        </div>
      </div>
    </div>
  </div> <!-- close divs-->`);
  res.end(`  
</body><!-- close out-->
</html>`);
}).listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});


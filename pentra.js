'use strict';
const instrumentName = 'Pentra C400';
const http = require('http');
const host = require('./findHost.js');
const os = require('os');
const hostname = host.hostname;
const port = 5000;
const versionInfo = require('./versionInfo.js');
const currentVersion = versionInfo.version;
const fs = require('fs');
const d3 = require('d3');
const _ = require('lodash');
const moveFile = require('move-file');
const test = false;
const dataFile = test ? `./data/pentraData3.json` : `./data/pentraData2.json`;

const c400Path = test ? `P:/Operations/Lab/TiamoData/NodeJS Server/dataExampleFiles/Test` : require('./paths.js').paths[instrumentName];
const watch = require('node-watch');
const logger = require('./logger.js').writeToLog;
const logRequest = require('./logger.js').logRequest;
logger(instrumentName, "<<<<<<<<---STARTED--->>>>>>>>>");
//data model for each analysis read from CSV file
class Analysis { 
    constructor(string) {
      let arr = string.split('--time--');
          string = string.split('--time--')[0];
      let testString = "",
          dateTime = arr[1],
          rows = string.split('\n');

      this.name = rows.filter(row=> row.match(/Name; |SID; /))
                      .join('\n')
                      .split(/Name; |SID; /)[1];
      testString= rows.filter(row=> row.match(/Test name; /))
                      .join('\n')
                      .split(/Test name; /)[1];
      this.test = testString;
      this.date = new Date(dateTime);
      this.value = rows.filter(row=> row.match(/Result value; /))
                        .join('\n')
                        .split(/Result value; /)[1];
      this.position = parseFloat(rows.filter(row=> row.match(/Position; /))
                                      .join('\n')
                                      .split(/Position;/)[1]);
      this.type = rows.filter(row=> row.match(/Sample type; /))
                      .join('\n')
                      .split(/Sample type; /)[1].trim();
      this.key = rows.filter(row=>row.match(/Rate; /))
                            .join('\n')
                            .split(/Rate; /)[1]+this.name+this.test+this.value;  // a unique id generated from the data to help remove duplicates
      this.hasFlags = rows.filter(row=>row.match(/Flags list;/))
                          .join('\n')
                          .split(/Flags list; /).length > 1 ? true : false;
      this.flags = this.hasFlags ? rows.filter(row=>row.match(/Flags list;/))
                                        .map( flag=>flag.replace(/Flags list; /, "")
                                                        .replace(";"," ("+this.test+")\n")): "";
  
    }
}

class MergedRecord {  //merges multiple records into a single record
  constructor(recArr, ID){
    console.log("Creating a new merged record");
    let malics = recArr.filter(rec=> rec.test == "Tmal ser"),
        sugars = recArr.filter(rec=> rec.test == "RS ser"),
        acetics = recArr.filter(rec=> rec.test == "AA ser"),
        highSugars = recArr.filter(rec=> rec.test == "RS4 ser");

    this.date = recArr.length != 0 ? recArr[0].date : null;
    this.name = recArr.length != 0 ? recArr[0].name : null;
    this.malic =  malics.length != 0 ? malics[0].value : null;
    this.rs = sugars.length != 0 ? sugars[0].value : null;
    this.acetic = acetics.length != 0 ? acetics[0].value : null;
    this.rs4 = highSugars.length != 0 ? highSugars[0].value : null;
    this.type = recArr[0].type;
    this.key = recArr.map(a=>a.key)
                      .join("");
    this.hasFlags = recArr.map(a=>a.hasFlags)
                          .includes(true);
    this.flags = this.hasFlags ? recArr.map(x=>x.flags)
                                      .filter(x => x.length > 0)
                                      .join("") : "";
    this.id = ID;
  }
}
let strings =[], 
    records = [];
//Process CSV files-----------------------------------------------------------------------------------
const process = name => {
  console.log("file name is " + name);
  logger(instrumentName, "attempting to process file: " + name+"\n");
  const raw = fs.readFileSync(`${name}`, 'utf8'); 
  let nameString = `${name}`.split(" ");
  console.log("nameString is " + nameString);
 // let rawTimeString = nameString[1];
  let rawTimeString = nameString[1];
  console.log("rawTimeString is " + rawTimeString);
  let rawDateString = nameString[0].split("Routine")[1];
  console.log("rawDateString is " + rawDateString);
  let dateArr = rawDateString.split("-");
  let dateString = `${dateArr[1]} ${dateArr[0]} ${dateArr[2]}`;
  let timeArr = rawTimeString.split("-").map(x=>parseInt(x)); //[hours, minutes, seconds]
  let timeString = `${timeArr[0] < 10 ? '0'+timeArr[0]: 
        timeArr[0]}:${timeArr[1] < 10 ? '0'+timeArr[1]: 
        timeArr[1]}:${timeArr[2] < 10 ? '0'+timeArr[2]: timeArr[2]}`

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
   // .filter(x=> x.type != "Calibration");
    console.log(`${records.length} new records...`);
    logger(instrumentName, `${records.length} new records...`);
    records.forEach(record=>{
      console.log(record);
      logger(instrumentName, record+'\n');
      return;
    } )
  try{    
    let mPath = test ? `P:/Operations/Lab/TiamoData/NodeJS Server/dataExampleFiles/pentra file archive/${name.split("/").reverse()[0]}` :      
    `C:/Users/${os.userInfo().username}/Desktop/pentra file archive/${name.replace(c400Path, "").split("/").reverse()[0]}`;
    console.log("attempting move to " + mPath);
    moveFile(name, mPath); // moves file to archive after processed
    //console.log(`file moved to archive`);
    logger(instrumentName, new Date() + ": file moved to archive \n");
  }catch (err) {
        console.log(err);
        logger(instrumentName, err+'\n');
      }
};

let files;
let rawData;
let oldRecords = [], keys = [];
//Read data from JSON--------------------------------------------------------------------------------
try{
  rawData = fs.readFileSync(dataFile);
  oldRecords = JSON.parse(rawData);
 //keys = oldRecords.map(rec=> rec.key);
// keys 
} catch (err) {
  console.log(err);
  logger(instrumentName, err);
}


const keyCheck = (key, keys) =>{
return keys.includes(key);
};

const getData=()=>{
  strings = [];
  try{
    rawData = fs.readFileSync(dataFile);
    oldRecords = JSON.parse(rawData);
    console.log(`${instrumentName}: records from json is now ${records.length}`);
  } catch (err) {
   console.log(err);
   logger(instrumentName, err);
  }
 
  try{
    console.log("try to find " + c400Path);
    files = fs.readdirSync(c400Path);
  _.each(files, filename => process(`${c400Path}${filename}`));
  }catch (err) { 
    console.log(err);
    logger(instrumentName, err);
  }
  oldRecords.forEach(rec=> rec.date = new Date(rec.date));
  
  let times = records.map(a=>a.date); //list of times
  let arrays = [];
  
  //looks for records to merge by finding identical times and name
  times.forEach(time=>{
   let filt = records.filter(x => x.date.toString() == time.toString())
                     .sort((a,b)=>a.name-b.name);
   let names = [...new Set(filt.map(x=>x.name))];
   names.forEach(name=>{ 
    // console.log("creating a group");
      let group = filt.filter(rec=>rec.name == name);
      arrays.push(group);
    //  console.log("arrays.length is now " + arrays.length);
    })
  })
  
 // merges multiple analysis records into single sample record
 let IDs = oldRecords.map(rec=> rec.id);
 let lastID = Math.max(...IDs);
 let merged = arrays.map(group=>{
 //  console.log("group to Merge....");
 //  console.log(group);
   let newKey = group.map(a=>a.key).join("");
   if(!keyCheck(newKey, keys)){
      keys.push(newKey);
      return new MergedRecord(group, ++lastID);
   } else {
     console.log("---Merged Record Not Created----for "+newKey+ "checked against "+keys.length + " keys");
     logger(instrumentName, `Attepted to create record for ${group[0]}... but failed.\n ---Merged Record Not Created----for `+newKey+`\n index of existing record is ${keys.indexOf(newKey)}\nExisting matching record is ${keys[keys.indexOf(newKey)]}`);
   } return null;
 } ).filter(rec=> rec != null)
    .sort((a,b)=> b.date === a.date ? a.type - b.type: b.date-a.date);
 arrays = [];
 records = [];

   // Used to remove dupicates (if necessary....)
      //  console.log(merged);
      //  console.log('merged length is ' + merged.length);
      let arr = merged.concat(oldRecords); // adds old records (from pentraData.json file) to new records 
      //   let cnt = 0;
      //   console.log("arr length is " + arr.length);
         arr = arr.sort((a,b)=>a.key-b.key);
         let keySetArr = [...new Set(arr.map(x=>x.key))]; // creates an array of keys without duplicates
         arr = keySetArr.map(x=>arr[arr.map(x=>x.key).indexOf(x)]); // uses unique key array to create an array of Analysis objects
    
           arr.sort((a,b)=>b.id-a.id).sort((a,b)=> a.date == b.date? b.id - a.id : b.date - a.date);
         try {
          fs.writeFileSync(dataFile,JSON.stringify(arr), 'utf8');
           console.log(`${instrumentName}: Data written to JSON file.`);
         } catch (err) {
           console.log(err);
           logger(instrumentName, err);
        }
    let count = 0;
  
    return arr;
};
try{
  watch(c400Path, { recursive: true }, function(evt, name) {
   
    console.log('%s changed.', name);
    logger(instrumentName, '%s change detected' + name);
    getData();
  });
}catch(err){
  console.log('the following error occurred during "watch" process:\n' );
  console.log(err);
  logger(instrumentName, err+'the following error occurred during "watch" process:\n');
}

//server----------------------------------------------------------------------------------------------
const server = http.createServer((req, res) => {
    logger(instrumentName, logRequest(req));
    logger(instrumentName, `${instrumentName} server response initialized ${new Date()}`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
// 

 //boiler plate HTML code
 const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);

    //print records to console
    let arr = getData();
    let Tcount=0, RScount=0, AAcount=0, MAcount=0, RS4count = 0, controlRS=0, controlAA=0, controlMA=0, controlRS4=0;
    let sampleRS=0, sampleAA=0, sampleMA=0, sampleRS4=0;
    let calRS=0, calAA=0, calMA=0, calRS4=0;
    arr.forEach(rec=>{
        Tcount += 1; 
      //  RScount += rec.rs != null ? 1 : 0;
        if(rec.rs != null){
          RScount++;
          controlRS += rec.type == "Control" ? 1 : 0;
          sampleRS += rec.type == "Patient" ? 1 : 0;
        //  calRS += rec.type == "Calibration" ? 3 : 0;
        }
        if(rec.acetic != null){
          AAcount++;
          controlAA += rec.type == "Control" ? 1 : 0;
          sampleAA += rec.type == "Patient" ? 1 : 0;
        //  calAA += rec.type == "Calibration" ? 3 : 0;
        }
        if(rec.malic != null){
          MAcount++;
          controlMA += rec.type == "Control" ? 1 : 0;
          sampleMA += rec.type == "Patient" ? 1 : 0;
        //  calMA += rec.type == "Calibration" ? 3 : 0;
        }
        if(rec.rs4 != null){
          RS4count++;
          controlRS4 += rec.type == "Control" ? 1 : 0;
          sampleRS4 += rec.type == "Patient" ? 1 : 0;
       //   calRS4 += rec.type == "Calibration" ? 3 : 0;
        }
        if(rec.rs == null && rec.acetic == null && rec.malic == null && rec.rs4 == null){
          if(rec.type == "Calibration" && rec.name == "RS"){
           // calRS += 3;
            RScount += 3;
          } 
          if(rec.type == "Calibration" && rec.name == "RS4" ){
         //  calRS4 += 3;
            RS4count += 3;

          }
        if(rec.type == "Calibration" && rec.key.match(/Tmal/) ){
           // calMA += 3;
            MAcount += 3;
        }
          if(rec.type == "Calibration" && rec.key.match(/AA/) ){
          //  calAA += 3;
            AAcount += 3;
          }
          
        }
       // AAcount += rec.acetic != null ? 1 : 0;
        // MAcount  += rec.malic != null ? 1 : 0;
        // RS4count += rec.rs4 != null ? 1 : 0;
      })
      // calRS = RScount-sampleRS-controlRS;
      // calAA = AAcount-sampleAA-controlAA;
      // calMA = MAcount-sampleMA-controlMA;
      // calRS4 = RS4count-sampleRS4-controlRS4;
  //  console.log(`Total records = ${Tcount}\n, RS records = ${RScount}\n, AA records = ${AAcount}\n, MA records = ${MAcount}\n, RS4 = ${RS4count}`);
   // logger(instrumentName, `Total records = ${Tcount}\n, RS records = ${RScount}\n, AA records = ${AAcount}\n, MA records = ${MAcount}\n, RS4 = ${RS4count}\n`);
  //  logger(instrumentName, `Control Records: ${controlRS}\n, ${controlAA}\n, ${controlMA}\n, ${controlRS4}\n`);
    let columns = [ "Date", "Sample ID", "RS (g/L)", "Acetic Acid (g/L)", "Malic Acid (g/L)", "RS4 (g/L)", "FLAGS"];
    //writes boiler plate code + header    <!--Comments added to HTML for debugging display issues -->  <!-- This is a Comment -->
    const makeHeader = (columns)=>{
      let head = `<thead>
             <tr>
               <th data-toggle="tooltip" title="Total Records: ${Tcount}">Record #</th>`;
               columns.forEach((col)=> {head+=`<th data-toggle="tooltip" title="${col == 'RS (g/L)' ? `Total RS Count = ${RScount}\nControls = ${controlRS}\nSamples= ${sampleRS}`:
                                                                        col == "Acetic Acid (g/L)" ?  `Total AA Count = ${AAcount}\nControls = ${controlAA}\nSamples= ${sampleAA}`:
                                                                        col == 'Malic Acid (g/L)' ? `Total MA Count = ${MAcount}\nControls = ${controlMA}\nSamples= ${sampleMA}`:
                                                                        col == "RS4 (g/L)" ? `Total RS4 Count = ${RS4count}\nControls = ${controlRS4}\nSamples= ${sampleRS4}` : col }" scope="col">${col}</th>` })
      return head+`</tr>
                  </thead><!-- After thead-->`;
    };
    let header = makeHeader(columns);
   
   const makeDataTable = (arr) => {
     let table = "";
    
       // limit number of records displayed
       // set to arr.length if no limit  -->  let endOfDisplay = arr.length;
    //set to number less than arr.length to improve response time    5000 -> ~ 4 months
    let endOfDisplay = 5000, count = 0;
    for(let i=0; i<endOfDisplay; i++){
      let row = arr[i],
          num = row.id;
          table += `${row.type == "Control" && row.hasFlags == false ? 
          `<tr class="table-success">` : 
          row.type == "Control" && row.hasFlags == true ?
          `<tr class="table-warning">` : 
          '<tr>'}
          <td scope="row" style="border-right: 1px solid; background-color: white;">${num}</td>
            <td data-toggle="tooltip" title="Date Time">${row.date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}</td>
            <td data-toggle="tooltip" title="Sample Name">${row.name}</td>
            <td data-toggle="tooltip" title="RS (g/L)">${row.rs != null ? row.rs : ""}</td>
            <td data-toggle="tooltip" title="Acetic Acid (g/L)" >${row.acetic != null ? row.acetic : ""}</td>
            <td data-toggle="tooltip" title="Malic Acid (g/L)" >${row.malic != null ? row.malic : ""}</td>
            <td data-toggle="tooltip" title="RS4 (g/L)" >${row.rs4 != null ? row.rs4 : ""}</td>
            ${ row.hasFlags ? `<td style="font-size: 10px;" class="table-warning" data-toggle="tooltip" title="Flags" >${row.flags}</td>`: `<td ></td>`}
          </tr>`
          count++;
        }
        console.log(`${instrumentName} displaying ${count} of ${Tcount} records`);
        return table+`</table>`;
        
   };
   const table = makeDataTable(arr);
   res.write(boilerPlateHTML+header+table);
  
  res.end(`</div>
         </div>
       </div>
     </div> <!-- close divs-->  
</body><!-- close out-->
</html>`);
logger(instrumentName, `${instrumentName} ${new Date()}: server response completed `);
}).listen(port, hostname, () => {
  logger(instrumentName, `${instrumentName} ${new Date()}: server listening at ${hostname}:${port} `);
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});

exports.pentraData = getData;
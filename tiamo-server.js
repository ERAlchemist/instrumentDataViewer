'use strict';
const http = require('http');
const instrumentName = `855 Auto-Titrator "Tiamo"`;
const hostname = require('./findHost.js').hostname;
const port = 3000;
const currentVersion = require('./versionInfo.js').version;
const fs = require('fs');
const resourcePath = require('./paths.js').paths[instrumentName];
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
const headerFields = ["Time", "Sample ID", "pH", "TA (g/L)"];
const logger = require('./logger.js').writeToLog;
const logRequest = require('./logger.js').logRequest;
logger(instrumentName, "<<<<<---STARTED---->>>>>");
const server = http.createServer((req, res) => {
  logger(instrumentName, logRequest(req));
  logger(instrumentName, new Date()+":\n___RESPONSE___");
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(`${boilerPlateHTML}`); //boiler plate HTML code
  res.write(`<thead>
                <tr>
                <th>Record#</th>
                ${headerFields.map(field=>`<th>${field}</th>`).join('')}
                </tr>
              </thead><tbody>`); // table header
    //add data to HTML table....
    let data = fs.readFileSync(resourcePath,'utf8');
    let arr = data.split('\n').reverse();

    for(let i=0; i<arr.length-1; i++){
      let row = arr[i].split(',').filter(a=>a.length > 0);
      let num = arr.length-i;
      if(row == "") continue;
      res.write(`
                  <tr>
                    <td style="border-right: 1px solid;">${num}</td>
                    ${row.map(x=>`<td>${x}</td>`).join('')}
                  </tr>`);
    }
    res.write(`</tbody>
            </table>
            </div>
          </div>
        </div>
      </div>`);
    res.end(`  </body>
              </html>`);
    logger(instrumentName, new Date() + ":\n___RESPONSE END___");
});
server.listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});




'use strict';
const http = require('http');
const instrumentName = `855 Auto-Titrator "Tiamo"`;
const hostname = require('./findHost.js').hostname;
const port = 3000;
const currentVersion = require('./versionInfo.js').version;
const fs = require('fs');
const tiamoFilePath = require('./paths.js').paths[instrumentName];
const boilerPlateHTML = require("./boilerPlateHTML.js").boilerPlate(instrumentName, currentVersion);
const headerFields = ["Time", "Sample ID", "pH", "TA (g/L)"];
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(`${boilerPlateHTML}`); //boiler plate HTML code
  res.write(`<thead>
                <tr>
                <th>Record#</th>
                ${headerFields.map(field=>`<th>${field}</th>`).join('')}
                </tr>
              </thead>`); // table header
    //add data to HTML table....
    let data = fs.readFileSync(tiamoFilePath,'utf8');
    let arr = data.split('\n').reverse();

    for(let i=0; i<arr.length-1; i++){
      let row = arr[i].split(',').filter(a=>a.length > 0);
      let num = arr.length-i;
      res.write(`<tbody>
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
});
server.listen(port, hostname, () => {
  console.log(`${instrumentName} data visible at http://${hostname}:${port}/`);
});




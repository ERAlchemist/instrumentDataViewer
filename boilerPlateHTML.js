
const hostname =  require('./findHost.js').hostname;
const history = require("./versionInfo.js").info;
const URLs = {
    tiamoServer: `http://${hostname}:3000`,
    tjServer: `http://${hostname}:4000`,
    pentraServer: `http://${hostname}:5000`,
    dmaServer: `http://${hostname}:7000`,
    chemWellServer: `http://${hostname}:8000`,
    futuraServer: `http://${hostname}:9000`
};

const boilerPlateHTML = (instrumentName, currentVersion ) => `<!doctype html>   
 <html lang="en">
     <head>
       <meta charset="utf-8">
       <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
       <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
       <link rel="icon" href="https://iconarchive.com/download/i94219/graphicloads/polygon/science.ico">
       <title>Instrument Data Viewer - ${instrumentName}</title>
     </head>
   <body>
     <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
     <script src = "https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
     <script src = "https://code.highcharts.com/highcharts.js"></script> 
     <script src = "https://code.highcharts.com/modules/data.js"></script>
     <script>
         const reloader = () => location.reload(true);
         $(document).ready(function(){
           window.setInterval(reloader, 120000);
           console.log('page reload successful');
         });
     </script>
     <style>
        table {
          display: flex;
          flex-flow: column;
          width: 100%;
      }
  
      tbody{height: 800px; overflow-y: scroll;display:block;}
      tr {
          width: 100%;
          display: table;
          table-layout: fixed;
      }
      th { position: sticky; top: 0; }
    .table-responsive{height:900px;overflow:scroll;} 
    thead tr:nth-child(1) th{background: white; position: sticky;top: 0;z-index: 10;}
     </style>
   <nav class="navbar navbar-expand-lg navbar-light bg-light">
     <a class="navbar-brand" href="">
       <img src="https://cdn.filestackcontent.com/aq3jZRygQy6ku6ElUlJw" height="80px" width="120px" class="d-inline-block align-top" />
       Instrument Data Viewer   <div data-toggle="tooltip" title="${history[currentVersion]["Date"]} -- Version Update ${currentVersion}:\n•${history[currentVersion]["changes"].join("\n"+"•")}" class="d-inline-block align-right" style="font-size: 10px;">v. ${currentVersion}</div>
     </a>
       <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="${instrumentName == '855 Auto-Titrator "Tiamo"' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.tiamoServer}"> Tiamo </a>
          </li>
          <li class="${instrumentName == '814 Auto-Titrator "TJ"' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.tjServer}"> 'TJ' </a>
          </li>
          <li class="${instrumentName == 'Pentra C400' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.pentraServer}"> Pentra C400 </a>
          </li>
          <li class="${instrumentName == 'Anton Paar DMA 5000 M' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.dmaServer}"> Anton Paar DMA 5000 M </a>
          </li>
          <li class="${instrumentName == 'ChemWell' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.chemWellServer}"> ChemWell </a>
          </li>
          <li class="${instrumentName == 'Futura' ? "nav-item active" : "nav-item"}">
            <a class="nav-link" href="${URLs.futuraServer}"> Futura </a>
          </li>
        </ul>
     </div>
     </nav>
     <div class="container py-5">
      <div class="row">
         <div class="col-xs-7 mx-auto bg-white rounded shadow">
          <h3>${instrumentName} Data:</h3>
             <div class="table-responsive">
              <table class="table table-hover" id="datatable"><!-- boilerPlateEnds-->`;
exports.boilerPlate = boilerPlateHTML;

'use strict'

const schedule = require('node-schedule');
const express = require('express');
const path=require('path');
const server=express();
const port=process.env.PORT || 5000;
const myxlsx=require("xlsx");
const fs =require("fs");
const { createWriteStream } = require('fs');
const { writeFile } = require('fs/promises');
const createZip=require('./zipper');
//const backup=require('./backuptofolder');
const dB = require('./database/dbconn')
const expressWinston = require('express-winston');
const { logger, streamLogs } = require('./logger');
const multer = require('multer');

var initJob;
var cancelinitjob=false;
var inputFile;

//Set static files for express serve them
server.use(express.static(path.join(__dirname, "public")));
server.use(express.static(path.join(__dirname, "archivehistory")));
server.use(express.static(path.join(__dirname, "output")));
server.use(express.static(path.join(__dirname, "archives")));
server.use(express.json());
server.use(expressWinston.logger({ winstonInstance: logger }));
//Set the pug view engine using express
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "pug");


// Clear database

  // async function initDb(params) {
  //   await dB.initializeDb();
  // }

  // initDb();
  
  // dB.Response.destroy({ where: {} }) // Pass an empty object to delete all records
  // .then(() => {
  //   console.log('All records in the response table have been deleted');
  // })
  // .catch((err) => {
  //   console.error('Error while deleting records:', err);
  // });

  // render homepage
const dynamicData={"title":"Treck traffic"}

server.get('/', async (req,res)=>{
  
  console.log("Home route loaded or refreshed");
  console.log("Something for you before render")
  //logger.info('Home route loaded or refreshed...');
  // Your preprocessing code here
  //logger.info('Program is ready to start');
  

  res.render("index", dynamicData);


});

const storage = multer.diskStorage({
  destination: './input/',
  filename: function(req, file, cb) {
    cb(null,'input_data.xlsx');
  }
});

const upload = multer({ storage: storage });

server.post('/upload', upload.single('input'), (req, res) => {
  console.log(req.file); // Log information about the uploaded file
  res.send('File uploaded successfully'); // Send a response to the client
});

// server.get('/logs', (req, res) => {
//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');
//   streamLogs(res);
// });

// start execution
server.get('/start', (req,res)=> {

const preProcess=require('./preprocessInput');


console.log(`Starting program now at ${(new Date().toUTCString())}`);
////logger.info(`Starting program now at ${(new Date().toUTCString())}`);


  ///logs

try {

   inputFile = myxlsx.readFile("./input/input_data.xlsx",{});

 let inputFileSheets = inputFile.SheetNames;

 if (inputFileSheets.length<4) {
  console.log("Expected to find 4 sheets('optional_inputs', 'od_pairs', 'calendar', 'trip_times')")
  console.log(inputFileSheets.length +" sheets were found")
  return;

} 
   if (!inputFileSheets.includes("optional_inputs") && !inputFileSheets.includes("od_pairs") && !inputFileSheets.includes("calender") && !inputFileSheets.includes("trip_times")) {
    console.log("Expected to find 4 sheets('optional_inputs', 'od_pairs', 'calendar', 'trip_times')")
    return;
  }

  //inputFileSheets : [ 'optional_inputs', 'od_pairs', 'calendar', 'trip_times' ]

let calenderSheet = inputFile.Sheets[inputFileSheets[2]];

let calenderJson=myxlsx.utils.sheet_to_json(calenderSheet);

let currentHours; 
let currentMinutes;

//Start date eg: 01.01.2023
const calenderStartDate = calenderJson[0].start_date.split(".");

//assign stop date to stop variable
const calenderStopDate = calenderJson[0].stop_date.split(".");


let startDay = calenderStartDate[0]*1,
startMonth = calenderStartDate[1]*1, 
startYear = calenderStartDate[2]*1;

const programStartDate = new Date(Date.UTC(startYear,startMonth-1,startDay));
console.log(`Program start date : ${programStartDate}`);
//logger.info(`Program start date : ${programStartDate}`);



let stopDay = calenderStopDate[0]*1,
stopMonth = calenderStopDate[1]*1,
stopYear = calenderStopDate[2]*1;

const programStopDate = new Date(Date.UTC(stopYear,stopMonth-1,stopDay));

const compEndTime=new Date(Date.UTC(stopYear,stopMonth-1,stopDay+1));

console.log("Calender stop date : "+ programStopDate.toUTCString());
//logger.info("Calender stop date : "+ programStopDate.toUTCString());


//Make backup of files
//backup.backupFiles()

//Function to prepare and make requests ready 
function prepareRequests() {

  preProcess.readRequestFile(preProcess.parseTripTimes,preProcess.mapIdsToTime,preProcess.createDayRequests)

}

//Funtion to calculate the program preexecution time
function getPrerunTime(startHour,endHour) {
  let preRunnTime = 0;

      if (endHour-startHour==24) {
       console.log("There should be at least an hour for program to prepare @ app_calender ,line 51")
      } 

      else {   

        let programIdleTime = (startHour+24) - endHour;
    
        let averageIdleTime = programIdleTime/2
        
        // if average idle time less than start hour
        if ( (startHour-averageIdleTime) > 0) {
          preRunnTime = startHour - averageIdleTime
          } 
        else 
        {
          //preRunnTime = endHour + averageIdleTime
          preRunnTime = startHour
        }     
    
        console.log("Program inactive hours per day"+ programIdleTime)
        console.log(".......")
        console.log("Average inactive time per day"+ averageIdleTime)
        console.log(".......")
     
    }
      return preRunnTime;
  }

//Calculate run time 

preProcess.parseTripTimes();
preProcess.getRunTime();


let runTime = getPrerunTime(preProcess.startTime, preProcess.endTime)

//Declare the days of the week in an array
let days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"]

function checkValidDay(day) {
  return calenderJson[0][day]
}

//shdeule archiving of output file to after the last request

// schedule.scheduleJob('00 '+ preProcess.endTime +' * * *',function(){


//   console.log("Creating archives at ");
//   console.log(new Date().toUTCString());

//   archiveOutput.archiver("./output/output.json","./archives","./output/output_data.xlsx","./archives");

// })


//Check the run times against current time and do scheduling based
//on outcome

if( runTime > preProcess.endTime){
  console.log("Pre run at " + runTime + " hours.Create request inputs for the next day.")
}

else if (runTime < preProcess.endTime){

   currentHours=new Date().getUTCHours(); 
   currentMinutes=new Date().getUTCMinutes();

   //correct code// if(currentHours>runTime && currentHours< preProcess.endTime){
  if(currentHours > runTime && currentHours< preProcess.endTime){

    console.log(currentHours+"......")
    console.log("Sheduling requests now @ app_calender, line 90")
    //logger.info("Sheduling requests now @ app_calender, line 90")


//First job .Will be executed immediately if program starts during hours inbetween start and end hours
    initJob = schedule.scheduleJob({ start: programStartDate, end: programStopDate, hour:(currentHours),minute:(currentMinutes+1)

    }, async function(){

        await dB.initializeDb();

        async function createJsonDb(params) {
          await writeFile("./database/data.json",JSON.stringify([],null,2));

        }
        await createJsonDb();
      const currentDateTime = new Date();

      if (checkValidDay( days[currentDateTime.getDay()]) && currentDateTime >= programStartDate && currentDateTime < compEndTime) {

          console.log(`On ${days[currentDateTime.getDay()]} requests can be made per calender`)
          console.log(' Today is');
          console.log(days[currentDateTime.getDay()]);
          
          // manageFiles.createOutputDir(fs,path,dirName,inputFile,myxlsx,prepareRequests)

          prepareRequests();
          
          cancelinitjob = true;
          console.log("----------------------------------");
        
      }

      else {
         console.log(`Cannot make requests on this date.Start date: ${programStartDate} | end date ${programStopDate}`)

       }
    console.log("----------------------------------");
      
    });
  }

  console.log("Pre run time is at "+ runTime+" hours on each  day");

} 



//Second job.Will start executing during 

const job = schedule.scheduleJob({ start: programStartDate, end: programStopDate, hour:runTime,minute:0

}, async function(){

  await dB.initializeDb();
  async function createJsonDb(params) {
    await writeFile("./database/data.json",JSON.stringify([],null,2));

  }
  await createJsonDb();

   if (cancelinitjob) {
      initJob.cancel();
      console.log("Cancelling temporary job")
    }
      const currentDateTime = new Date();

      if (checkValidDay(days[currentDateTime.getDay()]) && currentDateTime>=programStartDate && currentDateTime <= compEndTime) {

      console.log(`On ${days[currentDateTime.getDay()]} requests can be made per caldender`)
      console.log(' Today is');
      console.log(days[currentDateTime.getDay()]);
    
      // manageFiles.createOutputDir(fs,path,dirName,inputFile,myxlsx,prepareRequests)

      prepareRequests();
      
      console.log("----------------------------------")
    
    } else {
      
      console.log(`Cant make requests on this date`)

    }
    console.log("----------------------------------")


});


//During process termination

process.on('SIGTERM',shutdown('SIGTERM'))
.on('SIGINT',shutdown('SIGINT'))

function shutdown(signal) {
  //backup.backupFiles()

  return (err)=>{
    console.log(`${signal}...`);
    console.log("Shutting dounn at "+ (new Date().toUTCString()));
    if (err) {
      console.error(err.stack ||err);
      console.log("Shutting down at "+  (new Date().toUTCString()));
    }
    setTimeout(() => {
      console.log("...waited 5s ,exiting");
      process.exit(err?1:0)
    }, 5000).unref();
  }
  
}

  

// fetch databse data as json
async function downloadJsonData() {
  // Fetch all records from the database
  const records = await dB.Response.findAll();

  // Convert the records to JSON
  const jsonData = records.map(record => record.toJSON());

  // You can now download the JSON data (this example just logs the data to the console)
  console.log(jsonData.length +" records downloaded");

  return jsonData;
}



//download json backup file
server.get('/backup',async (req,res)=>{
  try {
    //  await streamDataToJson();
     const trafficData = await downloadJsonData();
     await writeFile("./database/data.json",JSON.stringify(trafficData,null,2));
   

    setTimeout(() => {
          res.download("./database/data.json",(err) =>
    { 
      if (err) {
        res.send("<h1>Output file not available for download</h1>"
        )
      }
      console.log("File downloaded successfully")
    });
    }, 500);
  
   

  } catch (error) {
    
  }


});

//download excel output file
server.get('/output', async (req, res) => {
  try {
    const trafficData = await downloadJsonData();

    const workbook = myxlsx.utils.book_new();
    const worksheet = myxlsx.utils.json_to_sheet(trafficData);

    myxlsx.utils.book_append_sheet(workbook, worksheet, 'Traffic Data');

    const excelBuffer = myxlsx.write(workbook, { bookType: 'xlsx', type: 'buffer', encoding: 'binary' });

      // Save the excel file on the file system
      const filePath = './database/traffic_data.xlsx';
      fs.writeFileSync(filePath, excelBuffer);

    res.set('Content-Disposition', 'attachment; filename="traffic_data.xlsx"');

    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.set('Content-Length', excelBuffer.length);


    res.send(excelBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

//The archives path for downloads

server.get('/archives',(req,res)=>{

  createZip.createZip(()=> downloadFile(res))
  
})

//Function to downaload file after zipping it
function downloadFile(res) {
console.log("Heloo");
  //get most recent file
  const getMostRecentFile = (dir) => {
    const files = orderReccentFiles(dir);
   // console.log(files);
    return files.length ? files[0] : undefined;
  };

  //order recent files in folder
  const orderReccentFiles = (dir) => {
    return fs.readdirSync(dir)
      .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
      .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  };

  if(
    getMostRecentFile("./archivehistory")==undefined)
{
   res.render("404page", { title: "Not found" })
console.log("No files archived yet");
}
else
 {
  let recent=getMostRecentFile("./archivehistory");
  console.log(recent);
  var zipfile="./archivehistory/"+recent.file;
  console.log(zipfile +" is the file")
  res.download(zipfile,(err) =>
  { 
if (err) {
  console.log(err +"...error" )
 console.log("Error occured")
 

}
   });
  }
}



} catch (error) {
  console.log(error);
  console.log("Please provide the correct input file. Expected to find input_data.xlsx")
  console.log("Or some sheets may not contain the right format")

}

 
})



//Let server listen on the specified port
server.listen(port,"0.0.0.0",()=>{
  console.log( `server listening on http://localhost:${port} at ${(new Date().toUTCString())}`);
})
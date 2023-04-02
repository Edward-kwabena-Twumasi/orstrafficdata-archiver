//App.js file owns the functionalities of reading and preprocessing 
//the input file the program is to run with and then creating 
//a request file to be scheduled by the program

'use strict'
const myxlsx=require("xlsx");
const fs = require('fs');
const fsPromise = require('fs/promises');
const { logger} = require('./logger');
const requestsNdOutput=require('./cron')
const Stream = require('stream');
require("dotenv").config()

const distancematrixai_api_key=process.env.distancematrixai_api_key
//Read input file from the output folder 
//if it yet exists or access it from root folder


let input_work_book = myxlsx.readFile("./input/input_data.xlsx",{})


let inputFileSheets = input_work_book.SheetNames;

 //inputFileSheets : [ 'optional_inputs', 'od_pairs', 'calendar', 'trip_times' ]

let trip_times_sheet = input_work_book.Sheets[inputFileSheets[3]];

let od_pairs_sheet = input_work_book.Sheets[inputFileSheets[1]];

let trip_times_json = myxlsx.utils.sheet_to_json(trip_times_sheet);

 //console.log(trip_times_json)
let od_pairs_json = myxlsx.utils.sheet_to_json(od_pairs_sheet);
 
//all request times
let reqtimes=[];

let starttimes=[];

let stoptimes=[];

let req_times24hr=[];

let ids=[]

//Contains ids with all their request times as an object
let totalreqtimes = [];

//generated outout json
let trip_time_series = [];

//all times for one particular id
let timesfroneid = []

//contains a list of times and their associated ids

let time_ids_array=[]

//3
 function generateReqTimes(startime,stoptime,timestep,timesforid) {
  
    reqtimes=[]
    let start=startime.toString();
    let stop=stoptime.toString();
    let step=timestep.toString();

    //push request times for all ids into giant array
    reqtimes.push((start.split(".")[0]*60 + start.split(".")[1]*1))
    //push request times for a single id into one array
    timesforid.push((start.split(".")[0]*60 + start.split(".")[1]*1))
    //push unique request times
    req_times24hr.push((start.split(".")[0]*60 + start.split(".")[1]*1))
    //console.log(start+"  "+stop)
    
   let difference = -(start.split(".")[0]*60 + start.split(".")[1]*1) + (stop.split(".")[0]*60 + stop.split(".")[1]*1);

   //console.log(start+"  "+stop +"1")

   let periods = difference/(step*1) ;

   for (let i = 1; i <= periods; i++) {
    reqtimes.push((start.split(".")[0]*60 +  start.split(".")[1]*1)+i*timestep)

    timesforid.push((start.split(".")[0]*60 +  start.split(".")[1]*1)+i*timestep)

    req_times24hr.push((start.split(".")[0]*60  +  start.split(".")[1]*1)+i*timestep)
   
   }
    }


//trip times is a work sheet from our excel workbook containing
//fields for start time,end time,time step and trip ids
//we will try to read,preprocess and convert the data into a usable
//and more understandable format

// 4
exports.parseTripTimes= function parseTripTimes() {

  console.log("-------------------------------------------------------")
  console.log("parsing trip times for preprocessing @ app.js ,line 101")
  console.log("-------------------------------------------------------")
  logger.info("..parsing trip times for preprocessing @ app.js ,line 103..")
//console.log("creating request times from parsed trip times")
trip_times_json.map(function(row) {

timesfroneid=[]

starttimes=[]

stoptimes=[]

let steps=[]

ids=[]
   
   ids.push(row["trip_id"]);
   for (let index = 0; index < Object.keys(row).length; index++) {

    if (row["start_time_"+index] !=undefined) {
        starttimes.push(row["start_time_"+index]);
    }
    if (row["stop_time_"+index] !=undefined) {
        stoptimes.push(row["stop_time_"+index]);
    }
    if (row["time_step_min_"+index] !=undefined) {
       steps.push(row["time_step_min_"+index]);
    }
       
   }

  
  for (let j = 0; j < starttimes.length; j++) {
    generateReqTimes(starttimes[j],stoptimes[j],steps[j],timesfroneid) 
    
  }
    totalreqtimes.push(

    {
      "id":ids.toString() , 
    reqtimes:timesfroneid
    }

    );

    trip_time_series.push({})

});

}

//5
// parseTripTimes();
//###############################################################


exports.getRunTime = function getRunTime(params) {

  console.log("------------------------------------------------------------------")
  console.log("Getting run time from trip times after parsing @ app.js ,line 116")
  console.log("------------------------------------------------------------------")
  logger.info("..Getting run time from trip times after parsing @ app.js ,line 116..")
  req_times24hr = [...new Set(req_times24hr)]
  req_times24hr.sort(function(a, b) {
      return a - b;
    });
  console.log("Requests start time(hrs) .. "+req_times24hr[0]/60+".... Requests end time(hrs) ....."+req_times24hr[req_times24hr.length-1]/60);
 logger.info("Requests start time(hrs) .. "+req_times24hr[0]/60+".... Requests end time(hrs) ....."+req_times24hr[req_times24hr.length-1]/60);

  let startTime = req_times24hr[0]/60;
  let endTime=req_times24hr[req_times24hr.length-1]/60;

  exports.startTime=startTime
  exports.endTime=endTime

  
}

exports.mapIdsToTime= function mapIdsToTime(params) {
  
  console.log("----------------------------------------------")
  console.log("Sorting trip times after parsing @ app.js ,line 132")
  console.log("----------------------------------------------")
  logger.info("Sorting trip times after parsing @ app.js ,line 132")

  req_times24hr = [...new Set(req_times24hr)]
  req_times24hr.sort(function(a, b) {
      return a - b;
    });
// console.log("Start making requests at ... "+req_times24hr[0]/60+" | end Reuests at ... "+req_times24hr[req_times24hr.length-1]/60)


//generate generate trip_time_series
// to be used in generating time and ids array
for (let i = 0; i < totalreqtimes.length; i++) {
  trip_time_series[i]["id"] = totalreqtimes[i]["id"]
 

  for (let t = 0; t < req_times24hr.length; t++) {

  if (totalreqtimes[i]["reqtimes"].includes(req_times24hr[t])) {
    trip_time_series[i][req_times24hr[t]]=1
  } else {
    trip_time_series[i][req_times24hr[t]]=0
  }
  
  }
  
}

//time_ids_array generation
for (const k in req_times24hr) {

  let ids=[]
  for (const l in trip_time_series) {
   
     if (trip_time_series[l][req_times24hr[k]]==1) {
       ids.push(trip_time_series[l].id)
       ids=[...new Set(ids)]

    } 
  }
  time_ids_array.push({time:req_times24hr[k],ids:ids})
  time_ids_array = [...new Set(time_ids_array)]
}

// if (inputFileSheets.indexOf("trip_time_series")>-1) {
//   //console.log("Trip time series exists")
// }

// else{
//   let output=myxlsx.utils.json_to_sheet(trip_time_series)
// myxlsx.utils.book_append_sheet(input_work_book,output,"trip_time_series")
// myxlsx.writeFile(input_work_book,"./input/input_data.xlsx")
// }

}



/////////////////////
//Function to build request strings
////////////////////

 function genRequestString(palceCordinates,key,mode,trafficMode) {
    //const timemil=departure.getTime()
    let destinations=`${palceCordinates.origin_latitude}%2c${palceCordinates.origin_longitude}`;
    let origins=`${palceCordinates.destination_latitude}%2c${palceCordinates.destination_longitude}`;
    let baseUrl="https://api.distancematrix.ai/maps/api/distancematrix/json";
    let thisRequest=`${baseUrl}?destinations=${destinations}&origins=${origins}&mode=${mode}&traffic_mode=${trafficMode}&departure_time=today&key=${key}`;

    return thisRequest;
   
  }


//2
//createe requests for the day

exports.createDayRequests= function createDayRequests(params) {

let request_data24hr=[]
let today = new Date();
let month = today.getUTCMonth() ; //months from 1-12
let day = today.getUTCDate();
let year = today.getUTCFullYear();

for (const thisrequest in time_ids_array) {

  let timeAndIds = time_ids_array[thisrequest]
  const hour = parseInt( timeAndIds.time*1/60);
  const min = parseInt(timeAndIds.time*1%60);
  const requestTime = new Date(year, month, day, hour, min);

 let requestTimeBatch = {}

 //convert request time to string

let timeString=`${requestTime}`;

//set time for request batch
requestTimeBatch["time"]=timeString

//array of all ids and request strings
let requestStrings=[]
let ids=[]

 for (const m in timeAndIds.ids) {

   let id= timeAndIds.ids[m]

   for (const k in od_pairs_json) {
     
     
     if (od_pairs_json[k].trip_id == timeAndIds.ids[m]) {
       
    let requeststring = genRequestString(od_pairs_json[k],distancematrixai_api_key,"driving","best-guess");
    requestStrings.push(requeststring)
    ids.push(id)
    
     }
   }
   
 }
 requestTimeBatch["strings"] = requestStrings;

 requestTimeBatch["ids"] = ids;

 request_data24hr.push(requestTimeBatch);
 
}

return request_data24hr;
}




exports.readRequestFile = async function readRequestFile(parseTripTimes,mapIdsToTime,createDayRequests) {

  let TemplateRequestInputData ="";

  let readJsonTempRequestFile = fs.createReadStream("./input/request_data24hrTemp.json",{ encoding: 'utf8' });

  const writeTempRequests = new Stream.Writable();
  //write streams for request file
  writeTempRequests._write = (chunk, {}, next) => {
    // console.log(chunk.toString());
  TemplateRequestInputData += chunk;
    next();
  };
  
  readJsonTempRequestFile.pipe(writeTempRequests);

   //Try reading the temp file to create main request data for the day 
  readJsonTempRequestFile.on('end', async function() {

    let existingRequestData = JSON.parse(TemplateRequestInputData);

    console.log("----------------------------------------------------")
    console.log("Updating the requests data file @ app.js ,line 283 ")
    console.log("---------------------------------------------------")
    logger.info("Updating the requests data file @ app.js ,line 283 ")

    for (const data in existingRequestData) {

        let previousDate = new Date(existingRequestData[data].time);

        let currentDate = new Date();

        let currentDay = currentDate.getUTCDate();
        let currentMonth = currentDate.getUTCMonth() ; //months from 1-12
        let currentYear =currentDate.getUTCFullYear();

        let prevHour = previousDate.getUTCHours();
        let prevMinutes = previousDate.getUTCMinutes();
        
        let newDate = new Date(currentYear,currentMonth,currentDay,prevHour,prevMinutes);

        let timeinSeconds = newDate.getTime()/1000;
        let newStrings = [];
        
        existingRequestData[data].strings.forEach( string => {
          newStrings.push( string.replace("today",`${timeinSeconds}`))
        });
        
        existingRequestData[data].time = `${newDate}`
        existingRequestData[data].strings = newStrings    
    }
        //
    
        try {
          await fsPromise.writeFile("./input/request_data24hr.json", JSON.stringify(existingRequestData,null,2))

         logger.info("---------------------------------------------")
         logger.info("file  succesfully updated @ app.js ,line 308")
         logger.info("Day's requests file updated")
         logger.info("-----------PROGRAM READY----------------------");
         console.log("---------------------------------------------")
         console.log("file  succesfully updated @ app.js ,line 308")
         console.log("Day's requests file updated")
         console.log("-----------PROGRAM READY----------------------");



          requestsNdOutput.sheduleRequests();

        } catch (error) {
          console.log("This error was thrown during request data file creation @ app.js 335")
          logger.info("This error was thrown during request data file creation @ app.js 335")

            console.log(error)
        }

})

//If this file in question doesnt exist 

readJsonTempRequestFile.on('error', async function(err) { 

  logger.info("----------------------------------------------")
  logger.info("24hr request file not ready for  reading @ app.js, line 278 ")
  logger.info("Creating it now...")
  logger.info("----------------------------------------------")
  console.log("----------------------------------------------")
  console.log("24hr request file not ready for  reading @ app.js, line 278 ")
  console.log("Creating it now...")
  console.log("----------------------------------------------")



    await parseTripTimes();
    mapIdsToTime();
    //* Replace departure_time value in request strings which has a value of 'now' *//
  
    

    let request_data24hr = createDayRequests();

    for (const data in request_data24hr) {

      let previousDate = new Date(request_data24hr[data].time);

      let currentDate = new Date();
      let day = currentDate.getUTCDate();
      let month = currentDate.getUTCMonth() ; //months from 1-12
      let year =currentDate.getUTCFullYear();

      let hour = previousDate.getUTCHours();
      let minutes = previousDate.getUTCMinutes();

      const newtDate = new Date(year,month,day,hour,minutes);

      let timeinSeconds = newtDate.getTime()/1000;
      let newStrings=[];

      request_data24hr[data].strings.forEach(element => {
        newStrings.push(element.replace("today",`${timeinSeconds}`))
      });

      request_data24hr[data].time=`${newtDate.toUTCString()}`

      request_data24hr[data].strings=newStrings    
    }
    
    //* Template request letiable *//
    
    
    console.log("----------------------------------------------")
    console.log("----------------------------------------------")

    console.log("Creating 24hr requests  file @ app.js,line 356")
   logger.info("----------------------------------------------")
   logger.info("----------------------------------------------")
   logger.info("----------------------------------------------")

   logger.info("Creating 24hr requests  file @ app.js,line 356")
   logger.info("----------------------------------------------")

    try {

      await fsPromise.writeFile("./input/request_data24hr.json",JSON.stringify(request_data24hr,null,2));
      console.log("Request file for 24 hour period succesfully created @ app.js, line 357")
      console.log("----------------------------------------------")
      console.log("---------------PROGRAM READY-----------------");

      logger.info("Request file for 24 hour period succesfully created @ app.js, line 357")
      logger.info("----------------------------------------------")
      logger.info("---------------PROGRAM READY-----------------");

      requestsNdOutput.sheduleRequests();

    } 
    catch (error) {
      console.log("This error was thrown during request data file creation @ app.js 400");
      console.log(error)
    }
    
    let request_data24hrTemp = createDayRequests();
     try {
       await fsPromise.writeFile("./input/request_data24hrTemp.json",JSON.stringify(request_data24hrTemp,null,2))
        console.log("----------------------------------------------")
        console.log("----------------------------------------------")
        console.log("----------------------------------------------")

        console.log("Temporary/template requests data file succesfully created @ app.js, line 368")
       logger.info("Temporary/template requests data file succesfully created @ app.js, line 368")

            

     } catch (error) {
       console.log("Couldnt create temporrary/template requests data file @ app.js , line 368")
     }
    //**** */

});

}
































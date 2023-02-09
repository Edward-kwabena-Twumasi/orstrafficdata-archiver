
'use strict'

const schedule = require('node-schedule');
const fs = require('fs');
const getTraffic=require('./request')
const Stream = require('stream');



//function begins

exports.sheduleRequests = function Cron(params) {
   console.log("... LETS GO ...")
  let totalRequests = 0;
  let requestFileData = "";

  try { 

    //read json database file using read srteams
      let readJsonRequestsFile = fs.createReadStream("./input/request_data24hr.json",{ encoding:'utf8' });
      //write stream for request file declaration
      const writeRequests = new Stream.Writable();
    //write streams for request file
      writeRequests._write = (chunk, {}, next) => {
        // console.log(chunk.toString());
        requestFileData += chunk;
       
        next();
       };

      // After reading file using streams
      let departureTimes = [];
      //pipe read rwuest stream to write stream
      let departureTimeStrings = []
      readJsonRequestsFile.pipe(writeRequests);
      //read stream on end
      readJsonRequestsFile.on('end',function(){
        
        console.log("############################################");
        console.log("Reading and scheduling requests right now");
        console.log("############################################");

        requestFileData = JSON.parse(requestFileData);
        const requestArray = requestFileData;

      // console.log(requestFileData[requestFileData.length-1]);
       let startingTime;
        for (const batch in requestArray) {

        departureTimes.push(new Date(requestArray[batch].time));
        departureTimeStrings.push(requestArray[batch].time);
        
        
        }
        
        for (const batch in requestArray) {
        
          let count = 0;
           
          // count number of requests to be made for each time batch
          requestArray[batch]["strings"].forEach(request => {
          
            count += 1;

          });

            totalRequests += count;
         

            const job = schedule.scheduleJob( departureTimes[batch], function(){
              
                let index = 0;
                let departureTime = departureTimeStrings[batch];

                requestArray[batch]["strings"].forEach(request => {
              
                  console.log(requestArray[batch].strings[index])
                  console.log("...")
                  console.log(requestArray[batch].ids[index]);
                 
                  let requestId = requestArray[batch].ids[index];

                  getTraffic.getTrafficInfo(request, requestId, departureTime );

                  index += 1;
               
                });
            
            });
        
        }
         startingTime = new Date(departureTimes[0]).toUTCString();

        console.log(`Scheduled  ${totalRequests} requests  @ cron.js, line 50 on ${new Date().toUTCString()} and starting time is ${startingTime}`);
      })
      //read request file stream on error
      readJsonRequestsFile.on('error',function(){

        throw erroor;
      })


} 

catch (error) {
  console.log("An error occured in catch block")
    console.log(error)
   
  }

}
                        
  
//Cron()


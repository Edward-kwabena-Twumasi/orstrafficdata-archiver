'use strict'
const axios = require('axios');
const fs = require('fs/promises');
const { Response } = require('./database/dbconn');
const { logger} = require('./logger');


//let distmat="https://maps.googleapis.com/maps/api/distancematrix/json?destinations=6.686813%2c-1.573793&origins=6.703662%2c-1.528848&mode=driving&traffic_mode=best-guess&departure_time=1641960000000&key=AIzaSyCyCr5WebY0cl5VyeBiBxfZ7dOJr9mHnIg";

//currentdatase  is supplied as argument.It is the contents of output.json file

exports.getTrafficInfo = async function getTrafficInfo(requestString, requestId, departureTime) {

    try {
      //Try making a request to distance matrix api using axios
      const responseJson = await axios.get(requestString);
     
      // return;
      
      let distance_km ,duration_m, duration_traffic_m, destinations, origins;

      destinations = responseJson.data.destination_addresses[0];
      origins = responseJson.data.origin_addresses[0];

      //extract distance,duration and duration in traffic 
       for (const row in responseJson.data.rows) {
      
       distance_km = responseJson.data.rows[row]["elements"][0].distance.text;
       duration_traffic_m = responseJson.data.rows[row]["elements"][0].duration_in_traffic.text;
       duration_m = responseJson.data.rows[row]["elements"][0].duration.text;
       
       } 
     
      const newTrafficData =  await Response.create({
          requestId: requestId,
          departureTime: departureTime,
          distance: distance_km.toString(),
          duration: duration_m.toString(),
          trafficDuration: duration_traffic_m.toString(),
          origins: origins.toString(),
          destinations: destinations.toString()

        }) ;

        console.log(`Item with id ${requestId} inserted in database, row number ${newTrafficData.id}`)
       //logger.info(`Item with id ${newTrafficData.id} inserted in database`)

             
    //Catch errors if requests couldnt be made 
    } catch (error) {
      if (error.response) {
        console.log(error.response.data)
        console.log(error.response.status)
      } else if (error.request) {
        console.log("Request error.......")
        console.log("Request for | "+requestString)
        console.log("Has failed @ request.js line 53")
        console.log(error.response);

      logger.info("Request error.......")
      logger.info("Request for | "+requestString)
      logger.info("Has failed @ request.js line 53")
      logger.info(error.response);
        
       // console.log(error)
      }
      else
      {
        
        console.log("Error occured making request");
        console.log(error)
      
       logger.info("Error occured making request");
       logger.info(error)
      
      }
    }
  }


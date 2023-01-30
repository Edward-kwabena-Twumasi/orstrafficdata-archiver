'use strict'
const axios = require('axios');
const fs = require('fs/promises');
const myxlsx=require("xlsx");
const { Reasponse } = require('./database/dbconn');

//let distmat="https://maps.googleapis.com/maps/api/distancematrix/json?destinations=6.686813%2c-1.573793&origins=6.703662%2c-1.528848&mode=driving&traffic_mode=best-guess&departure_time=1641960000000&key=AIzaSyCyCr5WebY0cl5VyeBiBxfZ7dOJr9mHnIg";

//currentdatase  is supplied as argument.It is the contents of output.json file

exports.getTrafficInfo = async function getTrafficInfo(requestString, requestId, requestTime) {

    try {
      //Try making a request to distance matrix api using axios
      const response = await axios.get(requestString);
      //console.log(response);
      //console.log(response.data)
      let distance_km ,duration_m, duration_traffic_m, destinations, origins;

      destinations = response.data.destination_addresses[0];
      origins = response.data.origin_addresses[0];

      //extract distance,duration and duration in traffic 
       for (const row in response.data.rows) {
      
       distance_km = response.data.rows[row]["elements"][0].distance;
       duration_traffic_m = response.data.rows[row]["elements"][0].duration_in_traffic;
       duration_m = response.data.rows[row]["elements"][0].duration;
       
       } 
     
      const Response =  await Reasponse.create({
          requestId: requestId,
          departure: requestTime,
          distance: distance_km,
          duration: duration_m,
          trafficDuration: duration_traffic_m,
          origins: origins,
          destinations: destinations

        }) ;

        console.log(`Item with id ${Response.id} inserted`)
             
    //Catch errors if requests couldnt be made 
    } catch (error) {
      if (error.response) {
        console.log(error.response.data)
        console.log(error.response.status)
      } else if (error.request) {
        console.log("Request error.......")
        console.log("Request for | "+requestString)
        console.log("Has failed @ request.js line 53")
       // console.log(error)
      }
      else
      {
        
        console.log("Error occured making request");
        console.log(error)
      
      }
    }
  }


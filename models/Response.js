// Create traffic response model and initialize sequelize with database

const path = require("path");
require("dotenv").config();

const db_url = process.env.PORT ? process.env.live_db : process.env.local_db;

const {Sequelize , Model, DataTypes}  = require('sequelize');

 // use sqlite local db 
// const sequelize = new Sequelize({
//         dialect: 'sqlite',
//         storage: path.join("ouput","traffic_data")
//  });


// connect from withing render
const sequelize = new Sequelize(db_url,{
    
    dialect: 'postgres',
      port: 5432
  });

//Connect from outside render
// const sequelize = new Sequelize(db_url,{
    
//     dialect: 'postgres',
//       port: 5432,
//       dialectOptions :{
//         ssl:true,
//       rejectUnauthorized: false // for self-signed certificates
//       }
//   });


class TrafficResponse extends Model {};

 TrafficResponse.init(
{
    requestId : {
        type: DataTypes.STRING,
        allowNul: false,
    },
    departureTime : {
        type: DataTypes.STRING,
        allowNul: false,
    },

    distance : {
        type: DataTypes.STRING,
        allowNul: false,
    },
    duration : {
        type: DataTypes.STRING,
        allowNul: false,
    },   
    trafficDuration : {
        type: DataTypes.STRING,
        allowNul: false,
    },
     destinations : {
        type: DataTypes.STRING,
        allowNul: false,
    },
    origins : {
        type: DataTypes.STRING,
        allowNul: false,
    },
    provider : {
        type: DataTypes.STRING,
        allowNul: false,
    },
    },
    {
        sequelize,
        modelName: "TrafficResponse",
        timeStamp:false
    });

    console.log(TrafficResponse === sequelize.models.TrafficResponse); // true
 
 module.exports = {
    TrafficResponse,
    sequelize
 }
 
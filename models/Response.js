require("dotenv").config();
const db_url = process.env.PORT ? process.env.live_db : process.env.local_db;

//const url = "postgres://data_archiver_user:Oe6I0ltverdlps791SMCK3pVV4YRuPJ3@dpg-cgauq182qv267ue4rf7g-a.oregon-postgres.render.com/data_archiver";

const {Sequelize , Model, DataTypes}  = require('sequelize');

const sequelize = new Sequelize(db_url,{
    
    dialect: 'postgres',
      port: 5432, // replace with your port number if different
    dialectOptions :{
        ssl:true
    }
  });

// new Sequelize({
//     dialect: 'sqlite',
//     storage: path.join("ouput","traffic_data")
//   });

//postgres://data_archiver_user:Oe6I0ltverdlps791SMCK3pVV4YRuPJ3@dpg-cgauq182qv267ue4rf7g-a/data_archiver

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
 
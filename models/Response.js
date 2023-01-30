const {Sequelize , Model,  DataType} = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join("ouput","traffic_data")
  });


 class TrafficResponse extends Model {};

 TrafficResponse.init(
{
    requestId : {
        type: DataType.STRING,
        allowNul: false,
    },
    departureTime : {
        type: DataType.STRING,
        allowNul: false,
    },

    distance : {
        type: DataType.STRING,
        allowNul: false,
    },
    duration : {
        type: DataType.STRING,
        allowNul: false,
    },   
    trafficDuration : {
        type: DataType.STRING,
        allowNul: false,
    },
     destinations : {
        type: DataType.STRING,
        allowNul: false,
    },
    origins : {
        type: DataType.STRING,
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
 
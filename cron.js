var cron = require('node-cron')
var nodeimu  = require('nodeimu')
var IMU = new nodeimu.IMU()
var tuc = require('temp-units-conv')
var clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString
var Message = require('azure-iot-device').Message
var connectionString = 'HostName=BH-IOT-HUB.azure-devices.net;DeviceId=BS-Raspberry-pi;SharedAccessKey=ZLQgsQwWu/+lSm5aNcL8STcOwDhGyXYrVBDyTe/0Kbg='
var client = clientFromConnectionString(connectionString)
var globalTPH = {
          "deviceId": "BS-Raspberry-pi",
          "temperarature": "",
          "pressure": "",
          "humidity": ""
   }

var printResultFor = function (op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }

var connectCallback = function (err) {
    if (err) {
        console.log('Could not connect to Azure IOT Hub: ' + err);
    } else {
            var data = JSON.stringify({ deviceId: 'BS-Raspberry-pi', temperature: globalTPH.temperature, humidity: globalTPH.humidity, pressure: globalTPH.pressure });
            var message = new Message(data);
            message.properties.add('temperatureAlert', (globalTPH.temperature > 30) ? 'true' : 'false');
            console.log("Sending message: " + message.getData());
            client.sendEvent(message, printResultFor('send'));
    }
  }

var getTPH = function () {

  return new Promise((resolve, reject) =>{
          //console.log('In Get TPH Block');
          var data = IMU.getValueSync();
          //var data = {"temperature": "90.000", "pressure": "90.000", "humidity": "90.000"}
          globalTPH.temperature=tuc.c2f(data.temperature.toFixed(0))
          globalTPH.pressure=data.pressure.toFixed(0)
          globalTPH.humidity=data.humidity.toFixed(0)

          //globalTPH.temperature= "71";
          //globalTPH.pressure="70";
          //globalTPH.humidity="22";
          console.log("tph deviceId: " + globalTPH.deviceId);
          console.log("tph temperature: " + globalTPH.temperature);
          console.log("tph pressure: " + globalTPH.pressure);
          console.log("tph humidity: " + globalTPH.humidity);
          //client.open(connectCallback);
          resolve(globalTPH)
  }).catch((error)=>{
          exit(`Completed with error ${JSON.stringify(error)}`)
  })

  }  

// Exit function
function exit(message) {
    console.log(message)
}

var task = cron.schedule('* * * * *', function() {
          console.log('immediately started');
          var data = IMU.getValueSync();
          //var data = {temperature: "90.000", pressure: "90.000", humidity: "90.000"}
          globalTPH.temperature=tuc.c2f(data.temperature.toFixed(0)) + "F";
          globalTPH.pressure=data.pressure.toFixed(0) + "Pi";
          globalTPH.humidity=data.humidity.toFixed(0) + "%";
          console.log("tph deviceId: " + globalTPH.deviceId);
          console.log("tph temperature: " + globalTPH.temperature);
          console.log("tph pressure: " + globalTPH.pressure);
          console.log("tph humidity: " + globalTPH.humidity);
          client.open(connectCallback);
}, false);

var sensorToggle= function(state, callback) {
        //console.log("State Value: " + state)
        var response_json = {
            "data": "",
            "message": ""
        } 
        if(state === '1'){
            task.start()
            response_json.data = "Sensing Started"
            response_json.message = "Sensing Started"
            return callback(response_json);
        }else{
            task.stop()
            response_json.data = "Sensing Stopped"
            response_json.message = "Sensing Stopped"
            return callback(response_json);
        }
        
}

module.exports = {
  sensorToggle: sensorToggle,
  getTPH:getTPH
}


 

 

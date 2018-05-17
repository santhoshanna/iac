var cron = require('node-cron')
//var nodeimu  = require('nodeimu')
//var IMU = new nodeimu.IMU()


var tuc = require('temp-units-conv')
var connectionString = 'HostName=BH-IOT-HUB.azure-devices.net;DeviceId=BS-Raspberry-pi;SharedAccessKey=ZLQgsQwWu/+lSm5aNcL8STcOwDhGyXYrVBDyTe/0Kbg='
var globalTPH = {
          "deviceId": "BS-Raspberry-pi",
          "temperarature": "",
          "pressure": "",
          "humidity": ""
   }

var Mqtt = require('azure-iot-device-mqtt').Mqtt
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message
var client = DeviceClient.fromConnectionString(connectionString, Mqtt)   

/*var printResultFor = function (op) {
    return function printResult(err, res) {
          if (err) console.log(op + ' error: ' + err.toString());
          if (res) console.log(op + ' status: ' + res.constructor.name);
    }
  }*/
var printResultFor = function (op) {
    return function printResult(err, res) {
          if (err) {
            console.log(op + ' error: ' + err.toString())
            globalTPH.iotHubMessageStatus = "Telemetry Message was not sent due to server error"
          }
          if (res) {
            console.log(op + ' status: ' + res.constructor.name)
            globalTPH.iotHubMessageStatus = "Telemetry Message Sent"
          }
    }
  }  

var getTPH = function () {
  return new Promise((resolve, reject) =>{
          globalTPH.temperature= "75"
          globalTPH.pressure="70"
          globalTPH.humidity="22"
          console.log("tph deviceId: " + globalTPH.deviceId)
          console.log("tph temperature: " + globalTPH.temperature)
          console.log("tph pressure: " + globalTPH.pressure)
          console.log("tph humidity: " + globalTPH.humidity)
          var temperature = globalTPH.temperature
          var humidity = globalTPH.humidity
          var pressure = globalTPH.pressure
          var deviceId = globalTPH.deviceId
          var data = JSON.stringify({ deviceId:deviceId, temperature: temperature, humidity: humidity, pressure:pressure })
          var message = new Message(data)
          message.properties.add('temperatureAlert', (temperature > 30) ? 'true' : 'false')
          console.log('Sending message: ' + message.getData())
          client.sendEvent(message, printResultFor('send'))
          resolve(globalTPH)
  }).catch((error)=>{
          exit(`Completed with error ${JSON.stringify(error)}`)
  })

  }  

// Exit function
function exit(message) {
          console.log(message)
}

/*setInterval(function(){
          var temperature = globalTPH.temperature
          var humidity = globalTPH.humidity
          var pressure = globalTPH.pressure
          var deviceId = globalTPH.deviceId
          var data = JSON.stringify({ deviceId:deviceId, temperature: temperature, humidity: humidity, pressure:pressure });
          var message = new Message(data);
          message.properties.add('temperatureAlert', (temperature > 30) ? 'true' : 'false');
          console.log('Sending message: ' + message.getData());
          client.sendEvent(message, printResultFor('send'));
}, 6000)*/

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


 

 

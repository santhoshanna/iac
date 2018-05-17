var express = require('express')
var app = express()
var https = require('https')
var bodyParser = require("body-parser")
var port = process.env.PORT || 8080
var face = require('./face.js')
var path = require('path')
var switchJS = require('./switch.js')
var cronJS = require('./cron.js')
var http = require('http')
var fs = require('fs')
var promiseTimers = require('promise-timers')
var server = http.createServer(app)
//var server = require('http').createServer(app);
var io = require('socket.io').listen(server)
var sockets = {}
const PiCamera = require('pi-camera')
const myCamera = new PiCamera({
    mode: 'photo',
    output: 'images/currentpic.jpg',
    width: 640,
    height: 480,
    nopreview: true,
    rotation: 270,
  })

//app.set('port', process.env.PORT || 8080);
// Mandatory Uses
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/images', express.static(path.join(__dirname, '/images')))

//Applies to all the functions
app.all('/*', function(req, res, next) {
	if ((req.method != 'POST') && (req.method != 'GET') && (req.method != 'PUT') && (req.method != 'DELETE')) {
		res.status(405)
		res.set('Accept', 'GET, POST, PUT, DELETE')
		res.send()
	} else
		next()
})

//Render HTML Page
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
  })

//Status Check
app.route('/status').get(function(req, res) {
	console.log("Status Check")	
	try{
	    res.status(200).send({"status": "Server is up and running"})
	}catch(error){
	    res.status(500).send({"status": "Internal Error with server"})
	}
})

//File Read and call emotion api
app.route('/image').get(function(req, res) {
	//console.log("Image Processing and Facial Detection Process Started")
	var emotionArray
	var emotionObj
	var arrayObj = []
	var max
	var obj
	face.emotionDetect().then((response)=>{
			if(response.data !== null){
				//res.status(200).send(response)
				//console.log("Emotion Data: "+ response.data)
				emotionArray = JSON.parse(response.data)
				emotionObj = emotionArray[0].scores
				console.log("-----------------------------------------")
				console.log("\n"+"Emotion Identified In Image: "+ JSON.stringify(emotionObj) + "\n")
				arrayObj.push({"key":"anger","val":emotionObj.anger})
				arrayObj.push({"key":"contempt","val":emotionObj.contempt})
				arrayObj.push({"key":"disgust","val":emotionObj.disgust})

				arrayObj.push({"key":"fear","val":emotionObj.fear})
				arrayObj.push({"key":"happiness","val":emotionObj.happiness})
				arrayObj.push({"key":"neutral","val":emotionObj.neutral})

				arrayObj.push({"key":"sadness","val":emotionObj.sadness})
				arrayObj.push({"key":"surprise","val":emotionObj.surprise})

				console.log("\n"+"array: "+ JSON.stringify(arrayObj))
				console.log("\n"+"Max Value in emotion: "+ Math.max.apply(Math,arrayObj.map(function(o){return o.val})))
				max = Math.max.apply(Math,arrayObj.map(function(o){return o.val}))
				obj = arrayObj.find(function(o){ return o.val == max })
				console.log("\n"+"Max Key in emotion: "+ JSON.stringify(obj))
				console.log("-----------------------------------------")
				return face.picReadgetPerson()
			}
			else{
				res.status(500).send(response)
			}
	}).then((responsePicIdentification)=>{
			if(responsePicIdentification.data !== null){
				var data = {}
				//var person = JSON.parse(responsePicIdentification)
				//console.log("Person: "+ person)
				var contents = fs.readFileSync("settings.json")
				var jsonContent = JSON.parse(contents)
				var userObj = jsonContent.find(function(o){ return o.name == responsePicIdentification.data.name })
				var emotionTPHObj = userObj.settings.find(function(o){return o.emotion == obj.key })
				//console.log("\n"+"userObj: "+ JSON.stringify(userObj))
				//console.log("\n"+"emotionTPH: "+ JSON.stringify(emotionTPHObj))
				data.name = responsePicIdentification.data.name
				data.emotionKey = obj.key
				data.emotionValue = obj.val
				data.suggestedTemperature = emotionTPHObj.temperature
				data.suggestedHumidity = emotionTPHObj.humidity
				cronJS.getTPH().then((response)=>{
					console.log("Current TPH: "+ response)
					data.currentTemperature = response.temperature
					data.currentPressure = response.pressure
					data.currentHumidity = response.humidity
					if(parseInt(data.currentTemperature) > parseInt(data.suggestedTemperature)){
									var token
									switchJS.generateToken().then((response)=>{
										    token = JSON.parse(response.data).result.token
											return switchJS.getState(JSON.parse(response.data).result.token)
										}).then((responseState)=>{
										    var obj = JSON.parse(responseState.data)
								            var responseDataObj = JSON.parse(obj.result.responseData)
								            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
								            if(responseDataObj.system.get_sysinfo.relay_state === 0){
								            	console.log("Token: "+ token)
								            	console.log('Since switch was off, it was turned on')
								            	data.hvacStatus = "On"
												data.hvacMessage = "Since switch was off, it was turned on"
								            	return switchJS.turnOn(responseState.token)
								            }else {
								            	console.log('Since switch was on, it will remian on')
								            	data.hvacStatus = "On"
												data.hvacMessage = "Since switch was on, it will remian on"
								            }
										}).then((responseToggle)=>{
											console.log("Response Toggle: "+responseToggle)
											res.status(200).send(data)
										}).catch((error)=>{
											console.log(error)
									    	res.status(500).send("Internal Server Error")
									})
					}else {
									console.log("No change in temperature")
									var token
									switchJS.generateToken().then((response)=>{
									token = JSON.parse(response.data).result.token
									return switchJS.getState(JSON.parse(response.data).result.token)
										}).then((responseState)=>{
										    var obj = JSON.parse(responseState.data)
								            var responseDataObj = JSON.parse(obj.result.responseData)
								            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
								            if(responseDataObj.system.get_sysinfo.relay_state === 0){
								            	data.hvacStatus = "Off"
												data.hvacMessage = "HVAC is currently off"
												res.status(200).send(data)
								            	//return switchJS.turnOn(responseState.token)
								            }else {
								            	console.log('Since switch was on, it was turned off')
								            	data.hvacStatus = "On"
												data.hvacMessage = "HVAC is currently on"
												res.status(200).send(data)
								            }
										}).catch((error)=>{
											console.log(error)
									    	res.status(500).send("Internal Server Error")
									})
					}
				}).catch((error)=>{
					console.log("Failed to get TPH data: "+ error)
				})
			}
			else{
				res.status(500).send(responsePicIdentification)
			}
		}).catch((error)=>{
			    console.log("\n"+ "error: "+ error)
	    		res.status(500).send("Internal Server Error")
	})
})

//Emotion detection by posting the captured photo
app.route('/emotion').get(function(req, res) {
	console.log("Emotion API Invoked")	
	face.emotionDetect().then((response)=>{
			if(response.data !== null){
				res.status(200).send(response)
			}
			else{
				res.status(500).send(response)
			}
		}).catch((error)=>{
	    		res.status(500).send("Internal Server Error")
	})
})

//Face Identification by posting the captured photo. It will return face id
app.route('/faceIdentify').get(function(req, res) {
	console.log("Face Indentification API Invoked")	
	face.faceIdentify().then((response)=>{
			if(response.data !== null){
				res.status(200).send(response)
			}
			else{
				res.status(500).send(response)
			}
		}).catch((error)=>{
	    		res.status(500).send("Internal Server Error")
	})
})

//Person Identification by posting the aface ids. It will return person id on passing list of face ids
app.route('/personIdentify').get(function(req, res) {
	console.log("Person Indentification API Invoked")	
	var faceIDs = req.get('faceIDs')
	face.personIdentify(faceIDs).then((response)=>{
			if(response.data !== null){
				res.status(200).send(response)
			}
			else{
				res.status(500).send(response)
			}
		}).catch((error)=>{
	    		res.status(500).send("Internal Server Error")
	})
})

//Person Identification sending the person id
app.route('/person').get(function(req, res) {
	console.log("Person Indentification API Invoked")	
	var personID = req.get('personID')
	console.log(personID)
	face.person(personID).then((response)=>{
			if(response.data !== null){
				res.status(200).send(response)
			}
			else{
				res.status(500).send(response)
			}
		}).catch((error)=>{
	    		res.status(500).send("Internal Server Error")
	})
})

//Smart Switch Toggle
app.route('/toggle').get(function(req, res) {
	console.log("Smart Switch API Invoked")	
	var token
	switchJS.generateToken().then((response)=>{
		    token = JSON.parse(response.data).result.token
			return switchJS.getState(JSON.parse(response.data).result.token)
		}).then((responseState)=>{
		    var obj = JSON.parse(responseState.data)
            var responseDataObj = JSON.parse(obj.result.responseData)
            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
            if(responseDataObj.system.get_sysinfo.relay_state === 0){
            	console.log("Token: "+ token)
            	console.log('Since switch was off, it was turned on')
            	return switchJS.turnOn(responseState.token)
            }else {
            	console.log('Since switch was on, it was turned off')
            	return switchJS.turnOff(responseState.token)
            }
		}).then((responseToggle)=>{
			res.status(200).send(responseToggle)
		}).catch((error)=>{
			console.log(error)
	    	res.status(500).send("Internal Server Error")
	})
})

//Get Current TPH
app.route('/tph').get(function(req, res) {
	console.log("Get Current TPH API Invoked")	
//	var token
	cronJS.getTPH().then((response)=>{
		    console.log("Current TPH data: "+ response)
		    res.status(200).send(response)
		}).catch((error)=>{
			console.log(error)
	    	res.status(500).send("Internal Server Error")
	})
})

//Sensor Cron Job Start\Stop
app.route('/sensor').get(function(req, res) {
	console.log("Sensor Start\Stop API Invoked")	
	try{
		var toggleValue = req.get('toggleValue')
		cronJS.sensorToggle(toggleValue,function(response){
			if(response.data !== null){
				res.status(200).send(response)
			}
			else{
				res.status(500).send(response)
			}
		})
	    
	}catch(error){
	    res.status(500)
	}
})

//Sockets
var sockets = {}; 
io.on('connection', function(socket) { 
  sockets[socket.id] = socket
   // console.log("Total clients connected : ", Object.keys(sockets).length);
  socket.emit('server_connection', { clientNumber: Object.keys(sockets).length })

  //Emit TPH data every minute
  setInterval(()=>{
	    cronJS.getTPH().then((response)=>{
	  		socket.emit('TPH', response)
	  }).catch((error)=>{})
   }, 6000)

  //Disconnect event
  socket.on('disconnect', function(data) {
    delete sockets[socket.id];
    console.log("One of client is disconnecting: "+ data)
  })

    //Join event
  socket.on('join', function(data) {
      console.log("Response from client: "+ data)
  })
 
  //Take Snap
  socket.on('take-snap', function() {
	console.log("Socket IO Take Snap Function Started")
    	var emotionArray
		var emotionObj
		var arrayObj = []
		var max
		var obj
		face.emotionDetect().then((response)=>{
			if(response.data !== null){
				//res.status(200).send(response)
				//console.log("Emotion Data: "+ response.data)
				emotionArray = JSON.parse(response.data)
				emotionObj = emotionArray[0].scores
				console.log("-----------------------------------------")
				console.log("\n"+"Emotion Identified In Image: "+ JSON.stringify(emotionObj) + "\n")
				arrayObj.push({"key":"anger","val":emotionObj.anger})
				arrayObj.push({"key":"contempt","val":emotionObj.contempt})
				arrayObj.push({"key":"disgust","val":emotionObj.disgust})

				arrayObj.push({"key":"fear","val":emotionObj.fear})
				arrayObj.push({"key":"happiness","val":emotionObj.happiness})
				arrayObj.push({"key":"neutral","val":emotionObj.neutral})

				arrayObj.push({"key":"sadness","val":emotionObj.sadness})
				arrayObj.push({"key":"surprise","val":emotionObj.surprise})

				console.log("\n"+"array: "+ JSON.stringify(arrayObj))
				console.log("\n"+"Max Value in emotion: "+ Math.max.apply(Math,arrayObj.map(function(o){return o.val})))
				max = Math.max.apply(Math,arrayObj.map(function(o){return o.val}))
				obj = arrayObj.find(function(o){ return o.val == max })
				console.log("\n"+"Max Key in emotion: "+ JSON.stringify(obj))
				console.log("-----------------------------------------")
				return face.picReadgetPerson()
			}
			else{
				res.status(500).send(response)
			}
	}).then((responsePicIdentification)=>{
			if(responsePicIdentification.data !== null){
				var data = {}
				//var person = JSON.parse(responsePicIdentification)
				//console.log("Person: "+ person)
				var contents = fs.readFileSync("settings.json")
				var jsonContent = JSON.parse(contents)
				var userObj = jsonContent.find(function(o){ return o.name == responsePicIdentification.data.name })
				var emotionTPHObj = userObj.settings.find(function(o){return o.emotion == obj.key })
				//console.log("\n"+"userObj: "+ JSON.stringify(userObj))
				//console.log("\n"+"emotionTPH: "+ JSON.stringify(emotionTPHObj))
				data.name = responsePicIdentification.data.name
				data.emotionKey = obj.key
				data.emotionValue = obj.val
				data.suggestedTemperature = emotionTPHObj.temperature
				data.suggestedPressure = emotionTPHObj.pressure
				cronJS.getTPH().then((response)=>{
					console.log("Current TPH: "+ response)
					data.currentTemperature = response.temperature
					data.currentPressure = response.pressure
					data.currentHumidity = response.humidity
								if(parseInt(data.currentTemperature) > parseInt(data.suggestedTemperature)){
									console.log("Current temp greater than the suggested one for the user")
									var token
									switchJS.generateToken().then((response)=>{
										    token = JSON.parse(response.data).result.token
											return switchJS.getState(JSON.parse(response.data).result.token)
										}).then((responseState)=>{
										    var obj = JSON.parse(responseState.data)
								            var responseDataObj = JSON.parse(obj.result.responseData)
								            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
								            if(responseDataObj.system.get_sysinfo.relay_state === 0){
								            	console.log("Token: "+ token)
								            	console.log('Since switch was off, it was turned on')
								            	data.hvacStatus = "On"
												data.hvacMessage = "Since switch was off, it was turned on"
								            	return switchJS.turnOn(responseState.token)
								            }else {
								            	console.log('Since switch was on, it will remian on')
								            	data.hvacStatus = "On"
												data.hvacMessage = "Since switch was on, it will remian on"
												return true
								            }
										}).then((responseToggle)=>{
											console.log("Response Toggle: "+responseToggle)
											socket.emit( "ai_response",data)
										}).catch((error)=>{
											console.log(error)
											socket.emit( "ai_response",error)
									})
								}else if (parseInt(data.currentTemperature) = parseInt(data.suggestedTemperature)){
									console.log("No change in temperature")
									var token
									switchJS.generateToken().then((response)=>{
									token = JSON.parse(response.data).result.token
									return switchJS.getState(JSON.parse(response.data).result.token)
										}).then((responseState)=>{
										    var obj = JSON.parse(responseState.data)
								            var responseDataObj = JSON.parse(obj.result.responseData)
								            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
								            if(responseDataObj.system.get_sysinfo.relay_state === 0){
								            	data.hvacStatus = "Off"
												data.hvacMessage = "HVAC is currently off"
												socket.emit( "ai_response",data)
								            }else {
								            	console.log('Since switch was on, it was turned off')
								            	data.hvacStatus = "On"
												data.hvacMessage = "HVAC is currently on"
												socket.emit( "ai_response",data)
								            }
										}).catch((error)=>{
											console.log(error)
											socket.emit( "ai_response",error)
									})
								}else if (parseInt(data.currentTemperature) < parseInt(data.suggestedTemperature)){
									console.log("Current temo less that the one suggested for user")
									var token
									switchJS.generateToken().then((response)=>{
									token = JSON.parse(response.data).result.token
									return switchJS.getState(JSON.parse(response.data).result.token)
										}).then((responseState)=>{
                                            var obj = JSON.parse(responseState.data)
                                            var responseDataObj = JSON.parse(obj.result.responseData)
                                            console.log("Response System: " + responseDataObj.system.get_sysinfo.relay_state + "\n")
                                            if(responseDataObj.system.get_sysinfo.relay_state === 0){
                                                console.log('Since switch was off, it will remian off')
                                                data.hvacStatus = "Off"
                                                data.hvacMessage = "Since switch was off, it will remian off"
                                                socket.emit( "ai_response",data)
                                            }else {
                                                console.log('Since switch was on, it was turned off')
                                                data.hvacStatus = "On"
                                                data.hvacMessage = "Since switch was on, it was turned off"
                                                return switchJS.turnOff(responseState.token)
                                                socket.emit( "ai_response",data)
								            }
								        }).catch((error)=>{
											console.log(error)
											socket.emit( "ai_response",error)
									})
								}
				}).catch((error)=>{
					console.log("Failed to get TPH data: "+ error)
				})
			}
			else{
				socket.emit( "ai_response","Internal Server Error")
			}
		}).catch((error)=>{
			    console.log("\n"+ "error: "+ error)
	    		socket.emit( "ai_response","Internal Server Error")
	})		
 })    		
})

//Start the node web app on port defined above
//app.listen(port, function() {console.log('Orders server started on port ' + port + '.')})
server.listen(port, function() {console.log('Orders server started on port ' + port + '.')})
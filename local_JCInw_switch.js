var https = require('https')
var fs = require('fs')
var TPLink = require('tplink-cloud-api')
var uuidV4 = require('uuid/v4')
var url = require('url')
var HttpsProxyAgent = require('https-proxy-agent')

const TPLINK_USER = "bharathanselvaraj@gmail.com"
const TPLINK_PASS = "IDEALBh@03"
const TPLINK_TERM = "a055c0f4-a6ce-4c18-bad6-bba4b1027282"
const TPLINK_DEVICEID = "80060DA206EB38A4916A57B4AAAA8B1B194A5CBF"

var switchToggle= function(){
    return new Promise((resolve, reject) =>{
          TPLink.login(TPLINK_USER, TPLINK_PASS, TPLINK_TERM).then((myTPLink)=>{
            console.log("Token obtained is: " + myTPLink.getToken())
            return myTPLink.getHS100("My Smart Plug")
        }).then((myPlug)=>{
            return myPlug.toggle()
        }).then((response)=>{
            console.log("Current Relay State: "+ myPlug.get_relay_state())
        })
    }).catch((error)=>{
        exit(`Completed with error ${JSON.stringify(error)}`)
    })
}

// Exit function
function exit(message) {
    console.log(message)
}
 
//main();

var generateToken= function() {

    return new Promise((resolve, reject) =>{   
        var headers = {
            'Content-Type':'application/json'
        }
        var response_json = {
            "data": "",
            "message": ""
        }
        var proxyOpts = url.parse('http://10.10.5.18:8080')
        proxyOpts.auth = 'cups:SAIbaba@786'
        var proxy = new HttpsProxyAgent(proxyOpts)    
        var options = {
                    host: 'use1-wap.tplinkcloud.com',
                    method: 'POST',
                    headers: headers,
                    agent: proxy         
        }
        var body = JSON.stringify({
                "method": "login",
                "params": { 
                    "appType": "Santosh's Laptop",
                     "cloudUserName": "bharathanselvaraj@gmail.com",
                     "cloudPassword": "IDEALBh@03",
                     "terminalUUID": "a055c0f4-a6ce-4c18-bad6-bba4b1027282"
                    }
        })
        var post_callback = function(response){
            response.on('data', function (chunk) {
                //console.log("Token: "+ chunk.toString())
                response_json.data = chunk.toString()
                response_json.message = "Token generated successfully"
                resolve(response_json)
            })
            response.on('end', function () {
                console.log("Completed token generation")
            })
            response.on('error', function(err) {
                console.log('API Error'+ err)
                response_json.message = err
                reject(err)
            }) 
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            reject(e)
        })
        req.end(body)
   }).catch((error)=>{
        exit(`Completed with error ${JSON.stringify(error)}`)
   })
}

var getState= function(token) {

    return new Promise((resolve, reject) =>{   
        var headers = {
            'Content-Type':'application/json'
        }
        var response_json = {
            "data": "",
            "token": ""
        }
        var proxyOpts = url.parse('http://10.10.5.18:8080')
        proxyOpts.auth = 'cups:SAIbaba@786'
        var proxy = new HttpsProxyAgent(proxyOpts)  
        var options = {
                    host: 'use1-wap.tplinkcloud.com',
                    method: 'POST',
                    headers: headers,
                    path: '/?token='+token,
                    agent: proxy         
        }
        var body = JSON.stringify({
                "method": "passthrough",
                "params": { 
                            "deviceId": TPLINK_DEVICEID,
                            "requestData": "{\"system\":{\"get_sysinfo\":null},\"emeter\":{\"get_realtime\":null}}"
                    }
        })
        var post_callback = function(response){
            response.on('data', function (chunk) {
                //console.log("Response from POST is : "+ chunk.toString() + "\n")
                response_json.data = chunk.toString()
                response_json.token = token
                resolve(response_json)
            })
            response.on('end', function () {
                console.log("Completed state fetch")
            })
            response.on('error', function(err) {
                console.log('API Error'+ err)
                reject(err)
            }) 
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            reject(e)
        })
        req.end(body)
   }).catch((error)=>{
        exit(`Completed with error ${JSON.stringify(error)}`)
   })
}

var turnOff= function(token) {

    return new Promise((resolve, reject) =>{   
        var headers = {
            'Content-Type':'application/json'
        }
        var proxyOpts = url.parse('http://10.10.5.18:8080')
        proxyOpts.auth = 'cups:SAIbaba@786'
        var proxy = new HttpsProxyAgent(proxyOpts)  
        var options = {
                    host: 'use1-wap.tplinkcloud.com',
                    method: 'POST',
                    headers: headers,
                    path: '/?token='+token,
                    agent: proxy         
        }
        var body = JSON.stringify({
                "method": "passthrough",
                "params": { 
                            "deviceId": TPLINK_DEVICEID,
                            "requestData": "{\"system\":{\"set_relay_state\":{\"state\":0}}}"
                    }
        })
        var post_callback = function(response){
            response.on('data', function (chunk) {
                console.log("Response from POST is : "+ chunk.toString() + "\n")
                resolve(chunk.toString())
            })
            response.on('end', function () {
                console.log("Completed state fetch")
            })
            response.on('error', function(err) {
                console.log('API Error'+ err)
                reject(err)
            }) 
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            reject(e)
        })
        req.end(body)
   }).catch((error)=>{
        exit(`Completed with error ${JSON.stringify(error)}`)
   })
}

var turnOn= function(token) {

    return new Promise((resolve, reject) =>{   
        var headers = {
            'Content-Type':'application/json'
        }
        var proxyOpts = url.parse('http://10.10.5.18:8080')
        proxyOpts.auth = 'cups:SAIbaba@786'
        var proxy = new HttpsProxyAgent(proxyOpts)   
        var options = {
                    host: 'use1-wap.tplinkcloud.com',
                    method: 'POST',
                    headers: headers,
                    path: '/?token='+token,
                    agent: proxy         
        }
        var body = JSON.stringify({
                "method": "passthrough",
                "params": { 
                            "deviceId": TPLINK_DEVICEID,
                            "requestData": "{\"system\":{\"set_relay_state\":{\"state\":1}}}"
                    }
        })
        var post_callback = function(response){
            response.on('data', function (chunk) {
                console.log("Response from POST is : "+ chunk.toString() + "\n")
                resolve(chunk.toString())
            })
            response.on('end', function () {
                console.log("Completed state fetch")
            })
            response.on('error', function(err) {
                console.log('API Error'+ err)
                reject(err)
            }) 
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            reject(e)
        })
        req.end(body)
   }).catch((error)=>{
        exit(`Completed with error ${JSON.stringify(error)}`)
   })
}

module.exports = {
  switchToggle: switchToggle,
  generateToken: generateToken,
  getState: getState,
  turnOff: turnOff,
  turnOn: turnOn
}
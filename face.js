var https = require('https')
var fs = require('fs')

var emotionDetect = function(){
        var response_json = {
            "data": "",
            "message": ""
        } 
        return new Promise((resolve, reject) =>{
            fs.readFile('images/currentpic.jpg', (err, data) => {
                var headers = {
                    'Content-Type':'application/octet-stream'
                    }
                var options = {
                            host: 'westus.api.cognitive.microsoft.com',
                            method: 'POST',
                            path: '/emotion/v1.0/recognize?subscription-key=c336adc7e85f4d229920a3025572bfe0',
                            headers: headers         
                }
                var post_callback = function(response){
                    response.on('data', function (chunk) {
                        //console.log(chunk.toString())
                        response_json.data = chunk.toString()
                        response_json.message = "completed emotion detection process successfully"
                    })
                    response.on('end', function () {
                        //console.log("completed emotion detection process")
                        resolve(response_json)
                    })
                    response.on('error', function(err) {
                        //console.log('API Error'+ err)
                        response_json.message = "error in emotion detection process"
                        reject(response_json) 
                    })
                }
                var req = https.request(options, post_callback)
                req.on('error', function(e) {
                    console.log('problem with request: ' + e.message)
                    response_json.message = e.message
                    reject(response_json)
                })
                req.end(data)
            })
        }).catch((error)=>{
            exit(`Completed with error ${JSON.stringify(error)}`)
        })
    }

var faceIdentify = function(){
        var response_json = {
            "data": "",
            "message": ""
        }
        return new Promise((resolve, reject) =>{
            fs.readFile('images/currentpic.jpg', (err, data) => {
            var headers = {
                'Content-Type':'application/octet-stream'
                }
            var options = {
                        host: 'westus.api.cognitive.microsoft.com',
                        method: 'POST',
                        path: '/face/v1.0/detect?subscription-key=2accc76102724b81b016734bccda4b62&returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age,gender,smile,facialHair,headPose,glasses,emotion,hair,makeup,accessories,blur,exposure,noise',
                        headers: headers         
            }
            var post_callback = function(response){
                response.on('data', function (chunk) {
                    //console.log(chunk.toString())
                    response_json.data = chunk.toString()
                    response_json.message = "completed face identification process successfully"
                })
                response.on('end', function () {
                    //console.log("completed face identification process")
                    resolve(response_json); 
                })
                response.on('error', function(err) {
                    //console.log('API Error'+ err)
                    response_json.message = "error during face identification process"
                    reject(response_json); 
                })
            }
            var req = https.request(options, post_callback)
            req.on('error', function(e) {
                console.log('problem with request: ' + e.message)
                response_json.message = e.message
                reject(response_json)
            })
            req.end(data)
            })
        }).catch((error)=>{
            exit(`Completed with error ${JSON.stringify(error)}`)
        })
    }

var personIdentify = function(faceIDs){
    return new Promise((resolve, reject) =>{
        console.log("faceIDs: "+ faceIDs)
        var response_json = {
            "data": "",
            "message": ""
        }
        var body = JSON.stringify({
                "faceids": JSON.parse(faceIDs),
                "personGroupId": "myfriends",
                "maxNumOfCandidatesReturned":1,
                "confidenceThreshold": 0.5
        })
        console.log(body)
        var headers = {
            'Content-Type':'application/json'
            }
        var options = {
                    host: 'westus.api.cognitive.microsoft.com',
                    method: 'POST',
                    path: '/face/v1.0/identify?subscription-key=2accc76102724b81b016734bccda4b62&returnFaceId=true&returnFaceLandmarks=true&returnFaceAttributes=age,gender,smile,facialHair,headPose,glasses,emotion,hair,makeup,accessories,blur,exposure,noise',
                    headers: headers         
        }
        var post_callback = function(response){
            response.on('data', function (chunk) {
                //console.log(chunk.toString())
                response_json.data = chunk.toString()
                response_json.message = "completed person identification process successfully"
            })
            response.on('end', function () {
                console.log("completed person identification process")
                resolve(response_json); 
            })
            response.on('error', function(err) {
                console.log('API Error'+ err)
                response_json.message = "error during person identification process"
                reject(response_json)
            })
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            response_json.message = e.message
            reject(response_json)
        })
        req.end(body)
    }).catch((error)=>{
            exit(`Completed with error ${JSON.stringify(error)}`)
    })
}

var person = function(personID){
    return new Promise((resolve, reject) =>{
        var id = personID
        var response_json = {
            "data": "",
            "message": ""
        }
        var headers = {
            'Content-Type':'application/json'
            }
        var options = {
                    host: 'westus.api.cognitive.microsoft.com',
                    method: 'GET',
                    path: '/face/v1.0/persongroups/myfriends/persons/'+id+'?subscription-key=2accc76102724b81b016734bccda4b62',
                    headers: headers         
        }
        var post_callback = function(response){
            response.on('data', function (chunk) {
                //console.log(chunk.toString())
                //console.log(JSON.parse(chunk.toString()))
                response_json.data = JSON.parse(chunk.toString())
                response_json.message = "obtained person identification process successfully"
            })
            response.on('end', function () {
                //console.log("obtained person identification process")
                resolve(response_json) 
            })
            response.on('error', function(err) {
                //console.log('API Error'+ err)
                response_json.message = "error during person identification process"
                reject(response_json) 
            }) 
        }
        var req = https.request(options, post_callback)
        req.on('error', function(e) {
            console.log('problem with request: ' + e.message)
            response_json.message = e.message
            reject(response_json)
        })
        req.end()
        }).catch((error)=>{
            exit(`Completed with error ${JSON.stringify(error)}`)
    })
}

var picReadgetPerson = function(){

return new Promise((resolve, reject) =>{
    var response_json = {
            "data": "",
            "message": ""
        }

    var propertiesJSON = ""

    emotionDetect().then((responseEmotion)=>{
            if(responseEmotion.data !== null){
                //console.log("Emotion values detected are: " + responseEmotion.data)
                //return resolve(response_json)
                return faceIdentify()
            }
            else{
                console.log("Error Response during emotion detection: "+ responseEmotion)
                response_json.message = "Error while obtaining emotion from image stream"
                reject(response_json)
            }
    }).then((responseFaceIdentity)=>{
            propertiesJSON = propertiesJSON + JSON.stringify(responseFaceIdentity.data)
            if(responseFaceIdentity.data !== null){
                //console.log("Face Identity values detected are: " + responseFaceIdentity.data)
                var result = JSON.parse(responseFaceIdentity.data)
                var faceIDs = []
                faceIDs.push(result[0].faceId)
                return personIdentify(JSON.stringify(faceIDs))
            }
            else{
                console.log("Error Response during face identification: "+ responseFaceIdentity)
                response_json.message = "Error while obtaining face identification from image stream"
                reject(response_json)
            }
    }).then((responsePersonIdentify)=>{
            propertiesJSON = propertiesJSON + JSON.stringify(responsePersonIdentify.data)
            if(responsePersonIdentify.data !== null){
                var result = JSON.parse(responsePersonIdentify.data)
                var personId = result[0].candidates[0].personId
                //console.log("personId: "+ personId)
                return person(personId)
                }
            else{
                console.log("Error Response during Person identification: "+ responsePersonIdentify)
                response_json.message = "Error while obtaining person identification from face ID"
                reject(response_json)
                }
    }).then((responsePerson)=>{
            propertiesJSON = propertiesJSON + JSON.stringify(responsePerson.data)
            if(responsePerson.data !== null){
                 var result = JSON.stringify(responsePerson.data)
                 //console.log("Person Information: "+ result)
                 //response_json.data = responsePerson.data
                 //console.log('\n'+'Final Properties JSON: '+ propertiesJSON)
                 //response_json.data = JSON.parse(propertiesJSON)
                 response_json.data = responsePerson.data
                 response_json.message = "obtained person identification process successfully"
                 resolve(response_json)
                }
            else{
                console.log("Error Response during Person identification: "+ responsePerson)
                 response_json.message = "Error while obtaining person identification from person ID"
                 reject(response_json)
                }
    })
    }).catch((error)=>{
            exit(`Completed with error ${JSON.stringify(error)}`)
    })
}

// Exit function
function exit(message) {
    console.log(message)
}

module.exports = {
  emotionDetect: emotionDetect,
  faceIdentify: faceIdentify,
  personIdentify: personIdentify,
  person: person,
  picReadgetPerson: picReadgetPerson
}
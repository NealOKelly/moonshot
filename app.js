// Dependencies
const express = require('express') // node.js web server
const expressLayouts = require('express-ejs-layouts')
const axios = require('axios');
const https = require("https")
const fs = require("fs")
//const dateFormat = require('dateformat');

// Included Files
require('dotenv').config();
const agent = require('./modules/https-auth/agent'); 

// Constants
const app = express()
const port= 80
const contentManagerUsername = process.env['CONTENT_MANAGER_USERNAME'];
const contentManagerPassword = process.env['CONTENT_MANAGER_PASSWORD'];
const authorizationHeaderValue = "Basic " + Buffer.from(contentManagerUsername + ":" + contentManagerPassword).toString('base64');
const contentManagerServiceAPIBaseUrl = process.env['CONTENT_MANAGER_API_BASE_URL'];

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// Set Templating Engine
app.use(expressLayouts)
app.set('view engine', 'ejs')

//  ROUTES
app.get('/', (req, res) => {
	res.render('index', { title: 'Moonshot'})
	})

// ROUTES - /Search
app.get("/Search", (req, res, next) =>
	{
    console.log("Call to '/Search' received")
	console.log(req.query.q)
	var classificationUri = req.query.q
	var jsonData = {
					"TrimType": req.query.trimtype,
					"q": req.query.q,
					"properties": req.query.properties,
					"pageSize": 1000000,
					} 
	var config = {
		  httpsAgent: agent('api-client'),
		  method: 'post',
		  url: contentManagerServiceAPIBaseUrl + '/Search',
		  headers:
			{ 
			'Authorization': authorizationHeaderValue, 
			'Content-Type': 'application/json', 
			},
		  data: JSON.stringify(jsonData)
		};
		//console.log(getTimeStamp(), green + "New Content Manager record successfully created.", resetColor)
		console.log("Calling CMServiceAPI.")
		axios(config)
			.then( function (response)
			{
			console.log("Response from CMServiceAPI recieved.")
			console.log("Sending response to browser.")
			res.status(200).send(response.data)
			})
			.catch(err => next(err));
	})


// get-classification-details
app.get("/get-classification-details", (req, res, next) => {
    console.log("Call to '/get-classification-details' received")
	var classificationUri = req.query.uri
		
	var config = {
		  httpsAgent: agent('api-client'),
		  method: 'get',
		  url: contentManagerServiceAPIBaseUrl + '/Classification/' + classificationUri + '/?properties=ClassificationName, ClassificationParentClassification, ClassificationAccessControl, ClassificationRetentionSchedule, ClassificationCanAttachRecords',
		  headers: { 
			'Authorization': authorizationHeaderValue, 
			//'Content-Type': 'application/json', 
		  },
		  //data : JSON.stringify(jsonData)
		};
  //console.log(getTimeStamp(), green + "New Content Manager record successfully created.", resetColor)
  console.log("Calling CMServiceAPI.")
  axios(config)
    .then( function (response)  {
	  console.log("Response from CMServiceAPI recieved.")
	  console.log("Sending response to browser.")
	  res.status(200).send(response.data)
  } 
 )
    .catch(err => next(err));
})



// get-record-type-containment-details
app.get("/get-record-type-attributes", (req, res, next) => {
    console.log("Call to '/get-record-type-attributes' received")
	var recordTypeUri = req.query.uri;
	var config = {
		  httpsAgent: agent('api-client'),
		  method: 'get',
		  url: contentManagerServiceAPIBaseUrl + '/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName',
		  headers: { 
			'Authorization': authorizationHeaderValue, 
		  },
		};
  //console.log(getTimeStamp(), green + "New Content Manager record successfully created.", resetColor)
  console.log("Calling CMServiceAPI.")
  axios(config)
    .then( function (response)  {
	  console.log("Response from CMServiceAPI recieved.")
	  console.log("Sending response to browser.")
	  res.status(200).send(response.data)
  } 
 )
    .catch(err => next(err));
})

https.createServer
	({
		key: fs.readFileSync("server-key.pem"),
		cert: fs.readFileSync("server-cert.pem")
	
	
	}, app)
	.listen(443, function() {
			console.log("Listening on 443")
			})


// Listen on Port 300
//app.listen(port, () => console.info('App listening on port ' + port))
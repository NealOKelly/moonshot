// JavaScript Document
// nodemon - https://www.npmjs.com/package/nodemon
// express-ejm-layouts - https://www.npmjs.com/package/express-ejs-layouts

// Imports
const express = require('express') // node.js web server
const expressLayouts = require('express-ejs-layouts')

// Constants
const app = express()
const port= 3000

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// Set Templating Engine
app.use(expressLayouts)
app.set('view engine', 'ejs')

//  Navigation
app.get('', (req, res) => {
	res.render('index', { title: 'Moonshot'})
})

// Listen on Port 300
app.listen(port, () => console.info('App listening on port ' + port))

///////  CONTENT MANAGER INTEGRATION ///////
//get dependencies
const axios = require('axios');
require('dotenv').config();
//const dateFormat = require('dateformat');

// constants
const contentManagerUsername = process.env['CONTENT_MANAGER_USERNAME'];
const contentManagerPassword = process.env['CONTENT_MANAGER_PASSWORD'];
const authorizationHeaderValue = "Basic " + Buffer.from(contentManagerUsername + ":" + contentManagerPassword).toString('base64');
const contentManagerServiceAPIBaseUrl = process.env['CONTENT_MANAGER_API_BASE_URL'];

const agent = require('./modules/https-auth/agent'); 

console.log(contentManagerUsername)

// invoke the CMServiceAPI
//https://api.gilbyim.com/CMServiceAPI/Classification?q=all&properties=ClassificationName
function invokeCMServiceAPI()
	{
		console.log('invokeCMServiceAPI has been called.')
		var config = {
		  httpsAgent: agent('api-client'),
		  method: 'get',
		  url: contentManagerServiceAPIBaseUrl + '/Classification?q=all&properties=ClassificationName',
		  headers: { 
			'Authorization': authorizationHeaderValue, 
			//'Content-Type': 'application/json', 
		  },
		  //data : JSON.stringify(jsonData)
		};
		axios(config)
		
		.then(function (response) {

			console.log(response.data)
			//console.log(getTimeStamp(), green + "New Content Manager record successfully created.", resetColor)
			
		})
		.catch(function (error) {
		  //console.log(getTimeStamp(), red + "Error creating Content Manager record.", resetColor)
		  console.log(error);
		});
	}

invokeCMServiceAPI()



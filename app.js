// Packages
var passport = require('passport'),
	expressLayouts = require('express-ejs-layouts'),
	express = require('express'),
	https = require('https'),
	fs = require('fs'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	methodOverride = require('method-override'),
	session = require('express-session'),
	axios = require('axios');

var app = express();
require('./modules/passport/passport.js');
const agent = require('./modules/https-auth/agent');
const contentManagerUsername = process.env['CONTENT_MANAGER_USERNAME'];
const contentManagerPassword = process.env['CONTENT_MANAGER_PASSWORD'];
const authorizationHeaderValue = "Basic " + Buffer.from(contentManagerUsername + ":" + contentManagerPassword).toString('base64');
const contentManagerServiceAPIBaseUrl = process.env['CONTENT_MANAGER_API_BASE_URL'];

const idpLogoutURL = process.env['PASSPORT_SAML_LOGOUTURL'];

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// Express configuration
var router = express.Router();
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded(
	{
	extended: true
	}));
app.use(methodOverride());
app.use(session(
	{
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true
	}));
app.use(passport.initialize());
app.use(passport.session());
app.use('', router);

// Routes
app.get('/', ensureAuthenticated, function(req, res)
	{
	res.render('index', { user: req.user, title: "Moonshot" });
	});

app.get('/login',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function(req, res)
			{
			console.log("req.user: " + req.user)
			res.redirect('/');
			}
	);

app.post('/login/callback',
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
  function(req, res)
			{
			res.redirect('/');
			}
		);

app.get('/logout', function(req, res)
	{
	req.logout();
	res.redirect(idpLogoutURL);
	});


// ROUTES - /Search
app.get("/Search", ensureAuthenticated, (req, res, next) =>
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
app.get("/get-classification-details", ensureAuthenticated, (req, res, next) => {
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
app.get("/get-record-type-attributes", ensureAuthenticated, (req, res, next) => {
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



// Create HTTPS listener
https.createServer(
	{
	key: fs.readFileSync("./server-certs/STAR_gilbyim_com_pem.key"),
	ca: fs.readFileSync("./server-certs/STAR_gilbyim_com.ca-bundle"),
	cert: fs.readFileSync("./server-certs/STAR_gilbyim_com.crt")
	}, app).listen(443, function()
		{
		console.log("Listening on 443.")
		})

// Functions
function ensureAuthenticated(req, res, next)
	{
	console.log("isAuthenticated:" + req.isAuthenticated())
	if(req.isAuthenticated())
		{
		return next();
		}
	res.redirect('/login')
}
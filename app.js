// Dependencies
var express = require('express'),
	expressLayouts = require('express-ejs-layouts'),
	axios = require('axios'),
	https = require("https"),
	fs = require("fs"),
	passport = require('passport'),
	util = require('util'),
	wsfedsaml2 = require('passport-wsfed-saml2').Strategy,
	fs = require('fs'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	session = require('express-session');
//const dateFormat = require('dateformat');

// Included Files
require('dotenv').config();
const agent = require('./modules/https-auth/agent'); 

// Constants
const app = express()
const port = 80
const contentManagerUsername = process.env['CONTENT_MANAGER_USERNAME'];
const contentManagerPassword = process.env['CONTENT_MANAGER_PASSWORD'];
const authorizationHeaderValue = "Basic " + Buffer.from(contentManagerUsername + ":" + contentManagerPassword).toString('base64');
const contentManagerServiceAPIBaseUrl = process.env['CONTENT_MANAGER_API_BASE_URL'];

// Set Templating Engine
app.use(expressLayouts)
app.set('view engine', 'ejs')

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

var users = [
    { id: 1, givenName: 'Neal', emailaddress: 'neal.okelly100@gmail.com' }
  , { id: 2, givenName: 'foo', email: 'foo@gmail.com' }
];

function findByEmail(email, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.email === email) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.emailaddress);
});

passport.deserializeUser(function(id, done) {
  findByEmail(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new wsfedsaml2(
  {
    path: '/login/callback',
    realm: 'https://beta.gilbyim.com/',
    homeRealm: '', // specify an identity provider to avoid showing the idp selector
    identityProviderUrl: 'https://authenticate.gilbyim.com/adfs/ls',
    // setup either a certificate base64 encoded (cer) or just the thumbprint of the certificate if public key is embedded in the signature

    //cert: 'MIIDFjCCAf6gAwIBAgIQDRRprj9lv5RBvaQdlFltDzANBgkqhkiG9w0BAQUFADAvMS0wKwYDVQQDEyRhdXRoMTAtZGV2LmFjY2Vzc2NvbnRyb2wud2luZG93cy5uZXQwHhcNMTEwOTIxMDMzMjMyWhcNMTIwOTIwMDkzMjMyWjAvMS0wKwYDVQQDEyRhdXRoMTAtZGV2LmFjY2Vzc2NvbnRyb2wud2luZG93cy5uZXQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCEIAEB/KKT3ehNMy2MQEyJIQ14CnZ8DC2FZgL5Gw3UBSdRb9JinK/gw7yOQtwKfJUqeoZaUSAAdcdbgqwVxOnMBfWiYX7DGlEznSfqYVnjOWjqqjpoe0h6RaOkdWovDtoidmqVV1tWRJFjkj895clPxkLpnqqcycfXtSdZen0SroGyirD2mhMc9ccLbJ3zRnBNjlvpo5zow1zYows09tNC2EhGROL/OS4JNRQnJRICZC+WkA7Igf3xb4btJOzIPYhFiqCGrd/81CHmAyEuNzyc60I5yomDQfZ91Eb5Uk3F7mlfAlYB2aZwDwldLSOlVE8G1E5xFexF/5KyPC4ShNodAgMBAAGjLjAsMAsGA1UdDwQEAwIE8DAdBgNVHQ4EFgQUyYfx/r0czsPgTzitqey+fGMQpkcwDQYJKoZIhvcNAQEFBQADggEBAB5dgQlM3tKS+/cjlvMCPjZH0Iqo/Wxecri3YWi2iVziZ/TQ3dSV+J/iTyduN7rJmFQzTsNERcsgyAwblwnEKXXvlWo8G/+VDIMh3zVPNQFKns5WPkfkhoSVlnZPTQ8zdXAcWgDXbCgvdqIPozdgL+4l0W0XVL1ugA4/hmMXh4TyNd9Qj7MWvlmwVjevpSqN4wG735jAZFHb/L/vvc91uKqP+JvLNj8tPFVxatzi56X1V8jBM61Hx1Z9D0RCDjtmcQVysVEylW9O6mNy6ZrhLm0q5yecWudfBbTKDqRoCHQRjrMU2c5q/ZFDtgjLim7FaNxFbgTyjeRCPclEhfemYVg='
    thumbprints: ['BE1E796EBDE7935B2BC11C28D898EB307C38C373']
  },
  function(profile, done) {
    console.log("Auth with", profile);
    if (!profile.emailaddress) {
      return done(new Error("No email found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByEmail(profile.emailaddress, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      })
    });
  }
));


var router = express.Router();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
 saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('', router);
app.use(express.static(__dirname + '/../../public'));

// Handle the post from AD FS
app.post('/', function(req, res){
	console.log("POST /")
	xml = req.body.wresult;
	var parser = require('xml2json');
	var json = JSON.parse(parser.toJson(xml));
	var samlAttributes = json["t:RequestSecurityTokenResponse"]["t:RequestedSecurityToken"]["saml:Assertion"]["saml:AttributeStatement"]["saml:Attribute"];
	
	user = new Object();
	
	for(i=0; i<samlAttributes.length; i++)
		{
		user[samlAttributes[i]["AttributeName"]] = samlAttributes[i]["saml:AttributeValue"]
	//	console.log(samlAttributes[i]["AttributeName"] + ": " + samlAttributes[i]["saml:AttributeValue"])
		}
	res.render('index', { user: user, title: "Moonshot"})
	//res.send(user)
});
app.get('/',
  passport.authenticate('wsfed-saml2', { failureRedirect: '/failure', failureFlash: true }),
  function(req, res) {
    res.render('index', { user: user, title: "Moonshot"})
  }
);







app.get('/failure',checkAuthentication,function(req,res){
    //do something only if user is authenticated
	console.log("The user is authenticated.")
	res.send("Something went wrong.")
});



function checkAuthentication(req,res,next){
    if(req.isAuthenticated()){
        //req.isAuthenticated() will return true if user is logged in
		console.log("Hello")
        next();
    } else{
		console.log("Goodbye")
        res.redirect("/");
    }
}












// ROUTES - /Search
app.get("/Search", (req, res, next) =>
	{
    console.log("Call to '/Search' received")
	console.log("Request authenticated? :" + req.isAuthenticated())
		
	
	
	//console.log(req.query.q)
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
		key: fs.readFileSync("./server-certs/STAR_gilbyim_com_pem.key"),
		ca: fs.readFileSync("./server-certs/STAR_gilbyim_com.ca-bundle"),
		cert: fs.readFileSync("./server-certs/STAR_gilbyim_com.crt")
	
	
	}, app)
	.listen(443, function() {
			console.log("Listening on 443")
			})

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}
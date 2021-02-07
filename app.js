// Packages
var passport = require('passport'),
	expressLayouts = require('express-ejs-layouts'),
	express = require('express'),
	https = require('https'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	fs = require('fs');

var app = express();
require('dotenv').config();

const idpLogoutURL = process.env['IDENTITY_PROVIDER_PROTOCOL'] + "://" + process.env['IDENTITY_PROVIDER_HOST'] + process.env['LOGOUT_PATH'];
const contentManagerDatasetId = process.env['CONTENT_MANAGER_DATASET_ID'];
const contentManagerDatasetName = process.env['CONTENT_MANAGER_DATASET_NAME'];
//const siteLogo = process.env['SITE_LOGO'];
const brandingName = process.env['BRANDING_NAME'];
const applicationBaseUrl = process.env['APPLICATION_PROTOCOL'] + "://" + process.env['APPLICATION_HOST']
const apiPath = process.env['API_PATH']

console.log(brandingName)

//console.log("Config file: " + contentManagerDatasetId + "-" + contentManagerDatasetName.replace(/ /g, "_"))
var config = fs.readFileSync("./config/" + contentManagerDatasetId + "-" + contentManagerDatasetName.replace(/ /g, "_") + ".json")


//console.log(JSON.parse(config))
//var str = JSON.stringify(config)
//console.log(str)

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// Express configuration
var router = express.Router();
app.set('view engine', 'ejs');
app.use(expressLayouts);
//app.use(morgan('combined'));
// morgan provides rich logging on https requests to the console.
app.use(cookieParser());
app.use(bodyParser.urlencoded(
	{
	extended: true
	}));
app.use(session(
	{
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge: 25 * 60 * 1000 }
	}));
app.use(passport.initialize());
app.use(passport.session());
app.use('', router);

require('./modules/passport/passport.js');

console.log("GA: " + JSON.parse(config).Analytics.Google.Enabled)
// Routes
app.get('/', ensureAuthenticated, function(req, res)
	{
	res.render('index', { user: req.user, title: "GilbyIM Lite", config: JSON.stringify(JSON.parse(config)), brandingName: brandingName, applicationBaseUrl: applicationBaseUrl, apiPath: apiPath, gtagEnabled: JSON.parse(config).Analytics.Google.Enabled, gtagMeasurementId: JSON.parse(config).Analytics.Google.MeasurementId });
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

app.get('/authentication-status', function(req, res, next)
	{
	if(req.isAuthenticated())
		{
		res.send(true)
		}
	else
		{
		res.send(false)
		}
});

app.get('/logout', function(req, res)
	{
	req.logout();
	res.redirect(idpLogoutURL);
	});

app.get('/healthcheck', function(req, res)
	{
	res.send("OK");
	});


app.listen(3000, () => {
  console.log('Example app listening at http://localhost:3000')
})


// Create HTTPS listener
//https.createServer(
//	{
//	key: fs.readFileSync("./server-certs/STAR_gilbyim_com_pem.key"),
//	ca: fs.readFileSync("./server-certs/STAR_gilbyim_com.ca-bundle"),
//	cert: fs.readFileSync("./server-certs/STAR_gilbyim_com.crt")
//	}, app).listen(443, function()
//		{
//		console.log("Listening on 443.")
//		})

// Functions
function ensureAuthenticated(req, res, next)
	{
	if(req.isAuthenticated())
		{
		return next();
		}
	res.redirect('/login')
}
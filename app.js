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
	axios = require('axios'),
	cors = require('cors');

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
//app.use(cors());

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

app.listen(3000, () => {
  console.log('Example app listening at http://localhost:3000')
})


// Create HTTPS listener
///https.createServer(
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
	console.log("isAuthenticated:" + req.isAuthenticated())
	if(req.isAuthenticated())
		{
		return next();
		}
	res.redirect('/login')
}
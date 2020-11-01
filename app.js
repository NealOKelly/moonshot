// Packages
var passport = require('passport'),
	express = require('express'),
	https = require('https'),
	fs = require('fs'),
	bodyParser = require('body-parser'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	methodOverride = require('method-override'),
	session = require('express-session');

var app = express();
require('./modules/passport/passport.js');

// Express configuration
var router = express.Router();
app.set('view engine', 'ejs');
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
	res.render('index', { user: req.user, profile: req.profile });
	});

app.get('/account', ensureAuthenticated, function(req, res)
	{
	res.send("This is the account page.");
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
	res.redirect('/');
	});

// Create HTTPS listener
https.createServer(
	{
	key: fs.readFileSync("./server-certs/STAR_gilbyim_com_pem.key"),
	ca: fs.readFileSync("./server-certs/STAR_gilbyim_com.ca-bundle"),
	cert: fs.readFileSync("./server-certs/STAR_gilbyim_com.crt")
	}, app).listen(443, function()
		{
		console.log("Listening on 443")
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
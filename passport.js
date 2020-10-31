// Packages
var fs = require('fs'),
	passport = require('passport'),
	SamlStrategy = require('passport-saml').Strategy;

// Users object
var users = [
		{ id: 1, givenName: 'Neal', email: 'neal.okelly100@gmail.com' },
		{ id: 2, givenName: 'foo', email: 'foo@gmail.com' }
	];

// Not sure what this does
function findByEmail(email, fn)
	{
	for(var i=0; i<users.length; i++)
		{
		var user = users[i];
		if(user.email===email)
			{
			return fn(null, user);
			}
		}
		return fn(null, null);
	}

// Passport session setup
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done)
	{
	done(null, user);
	});

passport.deserializeUser(function(user, done)
	{
	done(null, user);
	});

// Passport strategy
passport.use(new SamlStrategy(
	{
	entryPoint: 'https://authenticate.gilbyim.com/adfs/ls/',
	issuer: 'https://beta.gilbyim.com/', // This is the Relying Party Trust identifier.
	callbackUrl: 'https://beta.gilbyim.com/login/callback',
    authnContext: 'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password',
    acceptedClockSkewMs: -1,
    identifierFormat: null,
    signatureAlgorithm: 'sha256',
	},
	function(profile, done)
	{
	console.log("Auth with", profile);
    if (!profile.email)
		{
		return done(new Error("No email found"), null);
		}
		process.nextTick(function()
		{
		findByEmail(profile.email, function(err, user)
			{
			if(err)
				{
				return done(err);
				}
			if(!user)
				{
				// "Auto-registration"
				users.push(profile);
				return done(null, profile);
				}
			return done(null, user);
			})
		});
	}
));

module.exports = passport;
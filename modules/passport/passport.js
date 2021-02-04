// Packages
var fs = require('fs'),
	passport = require('passport'),
	SamlStrategy = require('passport-saml').Strategy;

// Constants
require('dotenv').config();
const entryPoint = process.env['IDENTITY_PROVIDER_PROTOCOL'] + "://" + process.env['IDENTITY_PROVIDER_HOST'] + process.env['ENTRY_POINT_PATH'];
const issuer = process.env['APPLICATION_PROTOCOL'] + "://" + process.env['APPLICATION_HOST'];
const callbackUrl = process.env['APPLICATION_PROTOCOL'] + "://" + process.env['APPLICATION_HOST'] + process.env['CALLBACK_PATH'];

//https://authenticate.gilbyim.com/adfs/ls/?wa=wsignout1.0&wreply=https://test.gilbyim.com

// Random function that somehow creates the user object through magic.
function getUser(profile, fn)
	{
	return fn(null, profile);
	}

//  Passport session setup
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
	entryPoint: entryPoint,
	issuer: issuer, // This is the Relying Party Trust identifier.
	callbackUrl: callbackUrl,
    acceptedClockSkewMs: -1,
    identifierFormat: null,
	},
	function(profile, done)
		{
		console.log("Auth with", profile);
		process.nextTick(function()
			{
			getUser(profile, function(err, user)  // It really bothers me that I don't understand what this is doing.
				{
				if(err)
					{
					return done(err);
					}
				return done(null, user);
				})
			});
		}
	));

module.exports = passport;
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

//console.log('expressLayouts:' + expressLayouts)//
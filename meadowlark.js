/**
 * Created by Steph on 11/18/2014.
 */
//include libraries
//initialize handlebars and define helper functions
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
var express = require('express');
var fortune = require('./lib/fortune.js');
var credentials = require('./credentials.js');



//create express app
var app = express();

//temporary weather data
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)'
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)'
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)'
            }
        ]
    };
}


//create middleware to inject weather data
app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weather = getWeatherData();
    next();
});

//cookies and sessions
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());

//set up handlebars view engine
app.use(express.static(__dirname + '/public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//set port
app.set('port', process.env.PORT || 4000);

//setup tests
app.use(function(req, res, next){
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

//create middleware to parse URL-encoded body
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
//app.use(require('body-parser')());

app.post('/process', function(req, res){
/*    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    res.redirect(303, '/thank-you');*/
    if(req.xhr || req.accepts('json,html')==='json'){
        //if there were an error, we would send {error: 'error description'}
        res.send({ success: true });
    } else{
        //if there were an error, we would direct to an error page
        res.redirect(303, '/thank-you');
    }
});

app.post('/newsletter', function(req, res){
    var name = req.body.name || '', email = req.body.email || '';
    //input validation
    if(!email.match(VALID_EMAIL_REGEX)){
        if(req.xhr) return res.json({error: 'Invalid name email address.'});
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was not valid.'
        };
        return res.redirect(303, 'newsletter/archive');
    }
    new NewsletterSignup({name: name, email: email}).save(function(err){
        if(err){
            if(req.xhr) return res.json({error: 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.'
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if(req.xhr) return res.json({success: true});
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.'
        };
        return res.redirect(303, '/newsletter/archive');
    });
});
app.use(function(req, res, next){
    //if there is a flash message, transfer it to the context, then clear it
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});
//routes
app.get('/', function(req, res){
    res.render('home');
});
app.get('/about', function(req, res){
    res.render('about', {fortune: fortune.getFortune(), pageTestScript: '/qa/tests-about.js'});
});
app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});
app.get('/jquery-test', function(req, res){
    res.render('jquery-test');
});
app.get('/nursery-rhyme', function(req, res){
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
    res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck'
    });
});
app.get('/newsletter', function(req, res){
    res.render('newsletter', {csrf: 'CSRF token goes here'});
});
//end routes
//custom 500 page
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});
//custom 404 page
app.use(function(req, res){
    res.status(404);
    res.render('404');
});

//start server
app.listen(app.get('port'), function(){
    console.log( 'Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.' );
});
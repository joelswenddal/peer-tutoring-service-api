'use strict';


//Set up Express app
const express = require('express');
const app = express();

require('dotenv').config();

//Use the routes defined in ./index
app.use('/', require('./index'));

//Serve static content from the public folder
app.use(express.static('public'));

//added for the Handlebars view engine
//********************************************** */
app.set('views', './views');
app.set('view engine', 'hbs');
//*********************************************** */

// Fallback Middleware function for returning 
// 404 error for undefined paths
const invalidPathHandler = (request, response, next) => {
  response.status(404)
  response.send('This is not a valid path for this API. Please consult documentation');
}

// Error handling Middleware function for logging the error message
const errorLogger = (error, request, response, next) => {
  console.log(`error ${error.message}`)
  next(error) // calling next middleware
}

app.use(errorLogger);
app.use(invalidPathHandler);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
/**
 * Server related tasks
 *
 */

import http from 'http';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import { debuglog as debug } from 'util';

import handlers from './handlers';
import helpers from './helpers';


// Instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {

  // Get the URl and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', function(data){
    buffer += decoder.write(data);
  });
  req.on('end', function(){
    buffer += decoder.end();

    // Choose the handler this request should go to or notFound handler
    let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // If the request is within public directory, use the public handler than
    chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    // Construct the data object to send to handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload, contentType){

      // Determine the type of response (fallback to JSON)
      contentType = typeof contentType === 'string' ? contentType : 'json';

      // Use the status code defined by the handler or default to 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Return the response parts that are content-specific
      let payloadString = '';
      if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        payload = typeof payload === 'object' ? payload : {};
        payloadString = JSON.stringify(payload);
      }

      // Return the common response parts
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log: if the response code is 200, print green, otherwise print red
      if (statusCode === 200) {
        debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
      } else {
        debug('\x1b[31om%s\x1b[0m', `${method.toUpperCase()} /${trimmedPath} ${statusCode}`);
      }

    });

  });
});

// Define a request router
server.router = {
  'transactions/new': handlers.createTransaction,
  'mine': handlers.mine,
  'chain': handlers.chain,
  'nodes/register': handlers.registerNode,
  'nodes/resolve': handlers.resolveConflicts,
};

// Init script
server.init = httpPort => {

  // Start the HTTP server
  server.httpServer.listen(httpPort, function() {
    console.log('\x1b[36m%s\x1b[0m', 'The HTTP server is listening on port ' + httpPort);
  });
};

/*
 * Exports
 */
export default server;

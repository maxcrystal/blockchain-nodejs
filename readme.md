# Learn Blockchains by Building One with Pure NodeJS

This is a port to NodeJS of the python source code for the post on [Building a Blockchain](https://medium.com/p/117428612f46) by Daniel van Flymen. I did it in order to learn Node and Blockchain, so it may not be ideal.

## Installation

1. Make sure [Node JS](https://nodejs.org/en/) is installed. 

2. Clone this git repo.

```bash
$ git clone https://github.com/maxcrystal/blockchain-nodejs.git
```

3. Install development requirements to support ES6 syntax, no other dependencies - pure NodeJS.

```
$ cd blockchain-nodejs
$ npm install 
``` 

4. Run the server (default port 3000):
    * `$ npm start`
    * `$ npm start 3001` <small>(start the server on port 3001)</small>
    * `$ node run.js` 
    * `$ node run.js 3001`  <small>(start the server on port 3001)</small>
    
5. Run tests
    * `$ npm test`
    * `$ node test/run.js`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request here or to the original python [repo](https://github.com/dvf/blockchain).

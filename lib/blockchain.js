/**
 * Implementation of Blockhain logic
 *
 */

import url from 'url';
import http from 'http';

import helpers from "./helpers";


/**
 * Blockchain class
 *
 */
class Blockchain {
  constructor() {
    this.chain = [];
    this.currentTransactions = {};
    this.nodes = new Set();
    this.nodeId = helpers.randomValueBase64(36);

    // Create the genesis block
    this.newBlock({
      previousHash: 1,
      proof: 100,
    });
  }

  /**
   * Add a new node to the list of nodes
   *
   * @param address {String} Address of node. Eg. 'http://192.168.0.5:5000'
   */
  registerNode(address) {
    const parsedUrl = url.parse(address);
    if (parsedUrl.protocol && parsedUrl.host && parsedUrl.path === '/') {
      this.nodes.add(address);
    }
  }

  /**
   * Creates a new Block and adds it to the chain
   *
   * @param proof {Number} The proof given by the Proof of Work algorithm
   * @param previousHash {String} Hash of the previous Block
   * @return {Object} New Block
   */
  newBlock({proof, previousHash}) {
    const block = {
      index: this.chain.length + 1,
      timestamp: new Date().getTime(),
      transactions: this.currentTransactions,
      proof,
      previousHash,
    };

    // Reset the current list of transactions
    this.currentTransactions = {};

    this.chain.push(block);
    return block;
  }

  /**
   * Adds a transaction to the list of transactions
   *
   * @param sender {String} Address of the sender
   * @param recipient {String} Address of the recipient
   * @param amount {Number} Amount
   * @return {Number} The index of the block, that will hold the transaction
   */
  newTransaction({sender, recipient, amount}) {
    const transactionId = helpers.randomValueBase64(36);
    const index = this.lastBlock.index + 1;

    this.currentTransactions[transactionId] = {
      sender,
      recipient,
      amount,
    };

    return {
      index,
      transactionId,
    }
  }

  /**
   * Creates a SHA-256 hash of the Block
   *
   * @param block {Object}
   * @return {string}
   */
  static hash(block) {

    // We must make sure that the Block is ordered, or we'll have inconsistent hashes
    const blockString = helpers.orderedJsonStringify(block);

    return helpers.hash(blockString, block.proof.toString());
  }

  /**
   * Simple Proof of Work Algorithm:
   *   - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
   *   - p is the previous proof, and p' is the new proof
   *
   * @param lastProof {Number}
   * @return {number}
   */
  static proofOfWork(lastProof) {
    let proof = 0;
    while (!Blockchain.validProof(lastProof, proof)) {
      proof++;
    }

    return proof;
  }

  /**
   * Validates the Proof: Does hash(last_proof, proof) contain 4 trailing zeroes?
   *
   * @param lastProof {Number}
   * @param proof {Number}
   * @return {boolean}
   */
  static validProof(lastProof, proof) {
    const guess = helpers.hash(lastProof.toString(), proof.toString());
    return guess.slice(-4) === '0000';
  }

  // Returns the last block
  get lastBlock() {
    return this.chain.slice(-1)[0];
  }

  /**
   * Determine if a given blockchain is valid
   *
   * @param chain {Array} A blockchain
   * @return {boolean} true if valid, false if not
   */
  static validChain(chain) {
    let lastBlock = chain[0];
    let currentIndex = 1;

    while (currentIndex < chain.length) {
      const block = chain[currentIndex];
      // console.log('Last Block', lastBlock, Blockchain.hash(lastBlock));
      // console.log('This Block', block);
      // console.log('---------------------------------');
      // Check that the hash of the block is correct
      if (block.previousHash !== Blockchain.hash(lastBlock)) {
        return false;
      }
      // Check that the proof of work is correct
      if (!Blockchain.validProof(lastBlock.proof, block.proof)) {
        return false;
      }
      lastBlock = block;
      currentIndex++;
    }

    return true;
  }

  /**
   * This is our Consensus Algorithm, it resolves conflicts
   * by replacing our chain with the longest one in the network.
   *
   * @param done {Function} Callback with a new chain if found or an empty object
   */
  resolveConflicts(done) {
    const neighbours = [...this.nodes];
    let newChain = null;

    // We're only looking for chains longer than ours
    let maxLength = this.chain.length;
    let lastNode = false;

    // Grab and verify the chains from all the nodes in our network
    for (const node in neighbours) {
      // Callback if we check last node
      lastNode = Number(node) === neighbours.length - 1;

      // Parse the node URL
      const parsedUrl = url.parse(`${neighbours[node]}`, true);
      const protocol = parsedUrl.protocol;
      const hostname = parsedUrl.hostname;
      const port = parsedUrl.port;

      // Construct the request
      const requestDetails = {
        protocol,
        hostname,
        port,
        method: 'GET',
        path: '/chain',
        timeout: 10000,
      };

      // Instantiate the request object
      const request = http.request(requestDetails, response => {
        // Check the status code
        if (response.statusCode === 200) {

          // Get the data
          let str = '';
          response.on('data', chunk => {
            str += chunk;
          });

          response.on('end', () => {
            // Parse severe response
            const res = helpers.parseJsonToObject(str);
            const length = typeof res.length === 'number' && res.length > 0 ? res.length : 0;
            const  chain = typeof res.chain === 'object' && res.chain instanceof Array && res.chain.length > 0 ? res.chain : null;

            // Check if the length is longer and the chain is valid
            if (length && chain) {
              if (length > maxLength && Blockchain.validChain(chain)) {
                maxLength = length;
                newChain = chain;
                this.chain = newChain;

                if (lastNode) done(newChain);
              } else {
                console.log({message: 'Chain is not longer or valid'});
                if (lastNode) done(newChain);
              }
            } else {
              console.log({error: 'Invalid payload'});
              if (lastNode) done(newChain);
            }
          });
        } else {
          console.log({error: `Server responds with status code: ${response.statusCode}`});
          if (lastNode) done(newChain);
        }
      });

      request.on('error', err => {
        console.log(neighbours[node], err);
        if (lastNode) done(newChain);
      });

      request.on('timeout', err => {
        console.log(err);
        if (lastNode) done(newChain);
      });

      request.end();
    }
  }
}


// Export
export default Blockchain;

/*
 * Request handlers
 *
 */

import Blockchain from './blockchain';
import { blockchain } from '../index';


/**
 * JSON API handlers
 *
 */

const handlers = {};

handlers.mine = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    // We run the proof of work algorithm to get the next proof...
    const lastProof = blockchain.lastBlock.proof;
    const proof = Blockchain.proofOfWork(lastProof);

    // We must receive a reward for finding the proof.
    // The sender is "0" to signify that this node has mined a new coin.
    blockchain.newTransaction({
      sender: '0',
      recipient: blockchain.nodeId,
      amount: 1,
    });

    // Forge the new Block by adding it to the chain
    const previousHash = Blockchain.hash(blockchain.lastBlock);
    const block = blockchain.newBlock({proof, previousHash});

    const response = {
      message: 'New block forge',
      block,
    };

    callback(200, response);
  } else {
    callback(405);
  }
};

handlers.createTransaction = (data, callback) => {
  const acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {

    const sender = typeof data.payload.sender === 'string' && data.payload.sender.length > 0 ? data.payload.sender : '';
    const recipient = typeof data.payload.recipient === 'string' && data.payload.recipient.length > 0 ? data.payload.recipient : '';
    const amount = typeof data.payload.amount === 'number' && data.payload.amount > 0 ? data.payload.amount : 0;

    if (sender && recipient && amount) {
      // Create a new Transaction
      const { index, transactionId } = blockchain.newTransaction({sender, recipient, amount});

      const response = {message: `Transaction "${transactionId}" is added to block #${index}`};

      callback(200, response);
    } else {
      callback(400, {error: 'Missing or invalid values'});
    }
  } else {
    callback(405);
  }
};

handlers.chain = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    const response = {
      chain: blockchain.chain,
      length: blockchain.chain.length,
    };

    callback(200, response);
  } else {
    callback(405);
  }
};

handlers.registerNode = (data, callback) => {
  const acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    const nodes = typeof data.payload.nodes === 'object' && data.payload.nodes instanceof Array ? data.payload.nodes : null;
    if (nodes) {
      for (const node in nodes) {
        blockchain.registerNode(nodes[node]);
      }
      const response = {
        message: 'New nodes have been added',
        nodes: [...blockchain.nodes],
      };
      callback(200, response);
    } else {
      callback(400, {error: 'Please supply a list of valid nodes'});
    }
  } else {
    callback(405);
  }
};

handlers.resolveConflicts = (data, callback) => {
  blockchain.resolveConflicts(done => {
    if (done) {
      const response = {
        message: 'Our chain was replaced',
        newChain: blockchain.chain,
      };
      callback(200, response);
    } else {
      const response = {
        message: 'Our chain is authoritative',
        chain: blockchain.chain,
      };
      callback(200, response);
    }
  })
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};


// Export
export default handlers;

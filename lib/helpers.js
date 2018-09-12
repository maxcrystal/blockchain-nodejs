/**
 * Helpers
 *
 */


const helpers = {};

// Sort objects by key
const sortObjByKey = value => {
  return (typeof value === 'object') ?
    (Array.isArray(value) ?
        value.map(sortObjByKey) :
        Object.keys(value).sort().reduce(
          (o, key) => {
            const v = value[key];
            o[key] = sortObjByKey(v);
            return o;
          }, {})
    ) :
    value;
};

helpers.orderedJsonStringify = obj => {
  return JSON.stringify(sortObjByKey(obj));
};


// Creates SHA-256 hash
helpers.hash = (str, secret) => {
  if (typeof str  === 'string' && str.length > 0) {
      secret = typeof secret === 'string' && secret.length > 0 ? secret : '';
      return require('crypto').createHmac('sha256', secret).update(str).digest('hex');
  } else {
    return false;
  }
};


// Parse a JSON string to an object in all cases without throwing
helpers.parseJsonToObject = function(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return {};
  }
};

// Generate UID
helpers.randomValueBase64 = len => {
  return require('crypto')
    .randomBytes(Math.ceil((len * 3) / 4))
    .toString('base64') // convert to base64 format
    .slice(0, len) // return required number of characters
    .replace(/\+/g, '0') // replace '+' with '0'
    .replace(/\//g, '0') // replace '/' with '0'
};

// Export
export default helpers;

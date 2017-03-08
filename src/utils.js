// Formats messages to be prefixed with `minska: `
// str => str
const formatMsg = msg => `minska: ${msg}`;

// Test if all keys in a object are functions
// obj => bool
const validateObjHasOnlyFunctions = obj =>
  Object.keys(obj).map(item => typeof obj[item] === 'function').every(i => i === true);

export default {
  formatMsg,
  validateObjHasOnlyFunctions
};

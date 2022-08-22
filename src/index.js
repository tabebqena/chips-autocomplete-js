// eslint-disable-next-line no-unused-vars, no-undef
var initChips = require("./chips");
// eslint-disable-next-line no-unused-vars, no-undef
var initAutocomplete = require("./autocomplete");
// eslint-disable-next-line no-unused-vars, no-undef
var intMSF = require("./msf");

var juis = {};
juis.Chips = initChips();
juis.Autocomplete = initAutocomplete();
juis.MultiStepForm = intMSF();
juis.MSF = juis.MultiStepForm;

if (window !== undefined && window !== null) {
  window.juis = juis || {};
}

// eslint-disable-next-line no-unused-vars, no-undef
module.exports = juis;

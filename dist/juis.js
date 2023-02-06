(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// eslint-disable-next-line no-undef
var guid = require("./utils").guid;
// eslint-disable-next-line no-undef
var assign = require("./utils").assign;
// eslint-disable-next-line no-undef
var similarityScore = require("./utils").similarityScore;

function iniAutocomplete() {
  var DEFAULT_OPTIONS = {
    filter: filter,

    extractValue: _extractValue,
    sort: null,
    dropDownClasses: ["dropdown"],
    dropDownItemClasses: [],
    dropDownTag: "div",
    hideItem: hideItem,
    showItem: showItem,
    showList: showList,
    hideList: hideList,
    onItemSelected: onItemSelected,
    activeClass: "active",
    isVisible: isVisible,
    onListItemCreated: null,
  };

  function isVisible(element) {
    return element.style.display != "none";
  }

  function onItemSelected(input, item, htmlElement, autcomplete) {
    input.value = item.text;
    autcomplete.hide();
  }

  function showList(l) {
    l.style.display = "inline-block";
  }

  function hideList(l) {
    l.style.display = "none";
  }

  function hideItem(e) {
    e.style.display = "none";
  }

  function showItem(e) {
    e.style.display = "block";
  }

  // eslint-disable-next-line no-unused-vars
  function sort(value, data) {
    return data;
  }

  function _extractValue(object) {
    return object.text || object;
  }

  function filter(value, data, extractValue) {
    if (extractValue === undefined || extractValue === null) {
      extractValue = _extractValue;
    }

    var scores = {};
    var _data = [];
    for (var index = 0; index < data.length; index++) {
      var itemValue = extractValue(data[index]);
      var score = similarityScore(value, itemValue);
      if (score > 0) {
        _data.push(data[index]);
        scores[itemValue] = score;
      }
    }
    _data = _data.sort(function (a, b) {
      var scoreA = scores[extractValue(a)];
      var scoreB = scores[extractValue(b)];
      return scoreB - scoreA;
    });
    return _data;
  }

  // generate unique id

  function Autocomplete(input, data, options) {
    this.input = input;
    this.data = this.fixData(data);
    this.filtered = this.data;
    this.activeElement = -1;

    this.dropdownItems = [];

    this.options = assign({}, DEFAULT_OPTIONS, options || {});
    this.parentNode = input.parentNode;
    this.createList = this._createList.bind(this);
    this.createItem = this._createItem.bind(this);
    this.updateData = this._updateData.bind(this);
    this.show = this._show.bind(this);
    this.hide = this._hide.bind(this);
    this.filter = this._filter.bind(this);
    this.sort = this._sort.bind(this);
    this.activateNext = this._activateNext.bind(this);
    this.activatePrev = this._activatePrev.bind(this);
    this.selectActive = this._selectActive.bind(this);

    this.isShown = false;

    this.setupListeners = this._setup_listeners;
    this.list = this.createList();
    this.hide();
    this.setupListeners();
  }
  Autocomplete.prototype.fixData = function (data) {
    var rv = [];
    for (var index = 0; index < data.length; index++) {
      var element = data[index];
      if (typeof element == "string") {
        element = { text: element };
      }
      element._uid = guid();
      rv.push(element);
    }
    return rv;
  };

  Autocomplete.prototype._setup_listeners = function () {
    var self = this;
    // eslint-disable-next-line no-unused-vars
    this.input.addEventListener("input", function (e) {
      var input = self.input;
      if (self.isShown) {
        self.hide();
      }
      self.filter(input.value);
      self.sort(input.value);
      self.show();
    });

    /*execute a function presses a key on the keyboard:*/
    this.input.addEventListener("keydown", function (e) {
      if (!self.isShown) {
        self.show();
      }
      if (e.keyCode == 40) {
        // down key
        self.activateNext();
      } else if (e.keyCode == 38) {
        // up key
        self.activatePrev();
      } else if (e.keyCode == 13) {
        // enter
        self.selectActive();
      } else if (e.keyCode == 27) {
        // escape
        if (self.isShown) {
          self.hide();
        }
      }
    });
  };

  Autocomplete.prototype._updateData = function (data) {
    this.data = this.fixData(data);
  };

  Autocomplete.prototype._show = function () {
    var lastItem = 0;
    for (var index = 0; index < this.filtered.length; index++) {
      var htmlElement = this.dropdownItems[this.filtered[index]._uid];
      if (htmlElement === null) {
        continue;
      }
      this.options.showItem(htmlElement);
      this.list.insertBefore(htmlElement, this.list.children[lastItem]);
      lastItem++;
    }

    for (index = lastItem; index < this.list.children.length; index++) {
      var child = this.list.childNodes[index];
      this.options.hideItem(child);
    }

    this.options.showList(this.list);
    this.isShown = true;
  };

  Autocomplete.prototype._filter = function (value) {
    this.filtered = this.data;
    if (this.options.filter != null) {
      this.filtered = this.options.filter(
        value,
        this.data,
        this.options.extractValue
      );
    }
  };

  Autocomplete.prototype._sort = function (value) {
    if (this.options.sort != null) {
      this.filtered = this.options.sort(value, this.filtered);
    }
  };

  Autocomplete.prototype._createList = function () {
    var a = document.createElement(this.options.dropDownTag);
    for (var index = 0; index < this.options.dropDownClasses.length; index++) {
      a.classList.add(this.options.dropDownClasses[index]);
    }

    for (var i = 0; i < this.data.length; i++) {
      var item = this.data[i];
      var b = this.createItem(item);
      a.appendChild(b);
    }

    this.input.parentNode.appendChild(a);
    return a;
  };

  Autocomplete.prototype._createItem = function (item) {
    /*create a DIV element for each matching element:*/
    var htmlElement = document.createElement("DIV");
    /*make the matching letters bold:*/

    var text = item.text;
    var _uid = item._uid;

    htmlElement.innerHTML = text;

    var attrs = item.attrs || {};
    var attrsKeys = Object.keys(attrs);
    for (var index = 0; index < attrsKeys.length; index++) {
      var key = attrsKeys[index];
      var val = attrs[key];
      htmlElement.setAttribute(key, val);
    }

    for (
      var index2 = 0;
      index2 < this.options.dropDownItemClasses.length;
      index2++
    ) {
      htmlElement.classList.add(this.options.dropDownItemClasses[index2]);
    }

    this.dropdownItems[_uid] = htmlElement;

    var self = this;
    // eslint-disable-next-line no-unused-vars
    htmlElement.addEventListener("click", function (e) {
      self.options.onItemSelected(self.input, item, htmlElement, self);
    });

    if (
      this.options.onListItemCreated !== null &&
      this.options.onListItemCreated !== undefined
    ) {
      this.options.onListItemCreated(htmlElement, item);
    }

    return htmlElement;
  };

  Autocomplete.prototype._activateClosest = function (index, dir) {
    for (var i = index; i < this.list.childNodes.length; ) {
      var e = this.list.childNodes[i];
      if (this.options.isVisible(e)) {
        e.classList.add(this.options.activeClass);
        break;
      }
      if (dir > 0) {
        i++;
      } else {
        i--;
      }
    }
  };

  Autocomplete.prototype._deactivateAll = function () {
    var all = this.list.querySelectorAll("." + this.options.activeClass);
    for (var index = 0; index < all.length; index++) {
      all[index].classList.remove(this.options.activeClass);
    }
  };

  Autocomplete.prototype._activateNext = function () {
    this._deactivateAll();
    this.activeElement++;
    this._activateClosest(this.activeElement, 1);
  };

  Autocomplete.prototype._activatePrev = function () {
    this._deactivateAll();
    this.activeElement--;
    this._activateClosest(this.activeElement, -1);
  };

  Autocomplete.prototype._selectActive = function () {
    var active = this.list.querySelector("." + this.options.activeClass);
    if (active !== null && active !== undefined) {
      active.click();
    }
  };

  Autocomplete.prototype._hide = function () {
    this.options.hideList(this.list);
    this.isShown = false;
  };

  return Autocomplete;
}

// eslint-disable-next-line no-undef
module.exports = iniAutocomplete;

},{"./utils":5}],2:[function(require,module,exports){
// eslint-disable-next-line no-undef
var guid = require("./utils").guid;
// eslint-disable-next-line no-undef
var assign = require("./utils").assign;

function initChips() {
  var DEFAULT_SETTINGS = {
    createInput: true,
    chipsClass: "chips",
    chipClass: "chip",
    closeClass: "chip-close",
    chipInputClass: "chip-input",
    imageWidth: 96,
    imageHeight: 96,
    close: true,
    onclick: null,
    onclose: null,
    onchange: null,
  };

  var chipData = {
    _uid: null,
    text: "",
    img: "",
    attrs: {
      tabindex: "0",
    },
    closeClasses: null,
    closeHTML: null,
    onclick: null,
    onclose: null,
  };

  function createChild(tag, attributes, classes, parent) {
    var ele = document.createElement(tag);
    var attrsKeys = Object.keys(attributes);
    for (var index = 0; index < attrsKeys.length; index++) {
      ele.setAttribute(attrsKeys[index], attributes[attrsKeys[index]]);
    }
    for (var classIndex = 0; classIndex < classes.length; classIndex++) {
      var kls = classes[classIndex];
      ele.classList.add(kls);
    }
    if (parent !== undefined && parent !== null) {
      parent.appendChild(ele);
    }
    return ele;
  }

  /**
   * _create_chip, This is an internal function, accessed by the Chips._addChip method
   * @param {*} data The chip data to create,
   * @returns HTMLElement
   */
  function _createChip(data) {
    data = assign({}, chipData, data);
    var attrs = assign(data.attrs, { "chip-id": data._uid });
    var chip = createChild("div", attrs, ["chip"], null);

    function closeCallback(e) {
      e.stopPropagation();
      data.onclose(e, chip, data);
    }

    function clickCallback(e) {
      e.stopPropagation();
      if (data.onclick !== null && data.onclick !== undefined) {
        data.onclick(e, chip, data);
      }
    }

    if (data.image) {
      createChild(
        "img",
        {
          width: data.imageWidth || 96,
          height: data.imageHeight || 96,
          src: data.image,
        },
        [],
        chip,
        {}
      );
    }
    if (data.text) {
      var span = createChild("span", {}, [], chip, {});
      span.innerHTML = data.text;
    }
    if (data.close) {
      var classes = data.closeClasses || ["chip-close"];
      var closeSpan = createChild(
        "span",
        {}, // id: data.closeId
        classes,
        chip,
        {}
      );

      closeSpan.innerHTML = data.closeHTML || "&times";
      if (data.onclose !== null && data.onclose !== undefined) {
        closeSpan.addEventListener("click", closeCallback);
      }
    }
    chip.addEventListener("click", clickCallback);

    return chip;
  }

  function Chips(element, data, options) {
    this.options = assign({}, DEFAULT_SETTINGS, options || {});
    this.data = data || [];
    this._data = [];
    this.element = element;
    element.classList.add(this.options.chipsClass);

    this._setElementListeners();
    this.input = this._setInput();
    this.addChip = this._addChip.bind(this);
    this.removeChip = this._removeChip.bind(this);
    this.getData = this._getData.bind(this);

    this.setAutocomplete = this._setAutocomplete.bind(this);
    this.render = this._render.bind(this);

    this.render();
  }

  Chips.prototype._getData = function () {
    var o = [];
    for (var index = 0; index < this._data.length; index++) {
      if (this._data[index] !== undefined && this._data[index] !== null) {
        var uid = this._data[index]._uid;
        for (var i = 0; i < this.data.length; i++) {
          if (
            this.data[i] !== undefined &&
            this.data[i] !== null &&
            this.data[i]._uid === uid
          ) {
            o.push(this.data[i]);
          }
        }
      }
    }
    return o;
  };

  Chips.prototype._render = function () {
    for (var index = 0; index < this.data.length; index++) {
      this.data[index]._index = index;
      this.addChip(this.data[index]);
    }
  };

  Chips.prototype._setAutocomplete = function (autocompleteObj) {
    this.options.autocomplete = autocompleteObj;
  };

  /**
   * add chip to element by passed data
   * @param {*} data chip data, Please see `chipData` documnetations.
   */
  Chips.prototype._addChip = function (data) {
    // get input element
    var distData = assign({}, this.options, chipData, data);
    data = assign(
      { onclick: this.options.onclick, onclose: this.options.onclose },
      data
    );

    if (data._uid === undefined || data._uid === null) {
      var uid = guid();
      data._uid = uid;
      distData._uid = uid;
    }
    var self = this;

    // eslint-disable-next-line no-unused-vars
    distData.onclick = function (e, chip, distData) {
      self._handleChipClick.apply(self, [e, chip, data]);
    };

    // eslint-disable-next-line no-unused-vars
    distData.onclose = function (e, chip, distData) {
      self._handleChipClose.apply(self, [e, chip, data]);
    };

    var chip = _createChip(distData);
    var input = this.input;
    if (input === null || input === undefined) {
      this.element.appendChild(chip);
    } else if (input.parentElement === this.element) {
      this.element.insertBefore(chip, input);
    } else {
      this.element.appendChild(chip);
    }
    // Avoid infinte loop, if recurssively add data to the this.data while render is terating
    // over it.
    if (data._index !== undefined && data._index !== null) {
      var index = data._index;
      delete data._index;
      this.data[index] = data;
    } else {
      this.data.push(data);
    }

    this._data.push(distData);
    if (this.options.onchange !== null && this.options.onchange !== undefined) {
      this.options.onchange(this.getData());
    }
    return data;
  };

  Chips.prototype._setInput = function () {
    var input = null;
    if (this.options.input !== null && this.options.input !== undefined) {
      input = this.options.input;
    } else {
      var inputs = this.element.getElementsByClassName(
        this.options.chipInputClass
      );
      if (inputs.length > 0) {
        input = inputs[0];
      }
    }

    if (input === null || input === undefined) {
      if (this.options.createInput) {
        // create input and append to element
        input = createChild(
          "input",
          { placeholder: this.options.placeholder || "" },
          [this.options.chipInputClass],
          this.element
        );
      } else {
        return;
      }
    }
    var self = this;
    // set event listener
    input.addEventListener("focusout", function () {
      self.element.classList.remove("focus");
    });

    input.addEventListener("focusin", function () {
      self.element.classList.add("focus");
    });

    input.addEventListener("keydown", function (e) {
      // enter
      if (e.keyCode === 13) {
        // Override enter if autocompleting.
        if (
          self.options.autocomplete !== undefined &&
          self.options.autocomplete !== null &&
          self.options.autocomplete.isShown
        ) {
          return;
        }
        if (input.value !== "") {
          self.addChip({
            text: input.value,
          });
        }
        input.value = "";
        return false;
      }
    });
    return input;
  };

  Chips.prototype._setElementListeners = function () {
    var self = this;
    this.element.addEventListener("click", function () {
      self.input.focus();
    });
    this.element.addEventListener("keydown", function (e) {
      if (!e.target.classList.contains(self.options.chipClass)) {
        return;
      }

      if (e.keyCode === 8 || e.keyCode === 46) {
        self._handleChipDelete(e);
      }
    });
  };

  // eslint-disable-next-line no-unused-vars
  Chips.prototype._handleChipClick = function (e, chip, data) {
    e.target.focus();
    if (data.onclick !== undefined && data.onclick !== null) {
      data.onclick(e, chip, data);
    }
  };

  Chips.prototype._deleteChipData = function (uid) {
    for (var index = 0; index < this._data.length; index++) {
      if (this._data[index] !== undefined && this._data[index] !== null) {
        if (uid === this._data[index]._uid) {
          delete this._data[index];
          return true;
        }
      }
    }
    return false;
  };

  Chips.prototype._handleChipClose = function (e, chip, data) {
    if (this._deleteChipData(data._uid)) {
      chip.parentElement.removeChild(chip);
      if (data.onclose !== undefined && data.onclose !== null) {
        data.onclose(e, chip, data);
      }
      if (
        this.options.onchange !== null &&
        this.options.onchange !== undefined
      ) {
        this.options.onchange(this.getData());
      }
    }
  };

  Chips.prototype._removeChip = function (chipId) {
    var chip = null;
    for (var index = 0; index < this.element.children.length; index++) {
      var element = this.element.children[index];
      if (
        element !== undefined &&
        element !== null &&
        element.classList.contains(this.options.chipClass)
      ) {
        if (element.getAttribute("chip-id") === chipId) {
          chip = element;
          break;
        }
      }
    }
    for (var index2 = 0; index2 < this.data.length; index2++) {
      var item = this.data[index2];
      if (item !== undefined && item !== null && item._uid === chipId) {
        this._handleChipClose(null, chip, item);
        break;
      }
    }
  };

  Chips.prototype._handleChipDelete = function (e) {
    var chip = e.target;
    var chipId = chip.getAttribute("chip-id");
    if (chipId === undefined || chipId === null) {
      throw Error("You  should provide chipId");
    }
    var data = {};
    for (var index = 0; index < this.data.length; index++) {
      var element = this.data[index];
      if (
        element !== undefined &&
        element !== null &&
        element._uid === chipId
      ) {
        data = element;
        this._handleChipClose(e, chip, data);
        return;
      }
    }
    throw Error("can't find data with id: " + chipId, this.data);
  };

  return Chips;
}
// eslint-disable-next-line no-undef
module.exports = initChips;

},{"./utils":5}],3:[function(require,module,exports){
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

},{"./autocomplete":1,"./chips":2,"./msf":4}],4:[function(require,module,exports){
/**
 * @namespace msf
 */
// eslint-disable-next-line no-undef
var assign = require("./utils").assign;

/**
 * init multi step form
 * @memberof msf
 * @function
 * @param {Element}  - the form HTMLElement
 * @param {object} - the options {@link msf.defaults}
 * @return {msf.MultiStepForm}
 */
function initMSF() {
  /** defaults 
   * @memberof msf
   * @property {string}  defaults.formStepClass         - the class name that identify the form step element
   * @property {function}  defaults.getCurrentStep      - function to get the current step, it should return `int`
     - deafult is the `MultiStepForm._defaultGetCurrentStep` that returns `MultiStepForm.currentStep` property.
   * @property {function}  defaults.storeCurrentStep  - Store the current step value.
     - default is `MultiStepForm._defaultStoreCurrentStep` that stores the value in the `MultiStepForm.cuurentStep`
   * @property {function} defaults.onStepShown  - function that called after the step shown, recieves the shown step index.
   * @property {function} defaults.onStepHide   - function that called after the step hidden, recieves the hidden step index.
   * @property {function} defaults.hideFun  - The function that actually hide step elemets, recieves the HTML element as single parameter
                                            - default action is done by applying "display:'none'""  
   * @property {function} defaults.showFun -  The function that actually show step elemets, recieves the HTML element as single parameter
                                            - default action is done by applying "display:'block'""
    * @property {function } defaults.submitFun   -  The function that acutually submit the form after the last step.
   - It recieves no parameters.
   - default is `form.submit()` 
   * @property {function} defaults.afterLastStep  
   - * The function that will run after reaching the last step & next step is requested.
   * default is  submitting the form.
   * @property {function} defaults.alterSubmitBtn  - * If you create submit button in your form, You should specify valid value for this option.
   * Choices are: 'next', null, 'hide'
   * - next: means that clicking the submit button will show the next step.
   * - hide: means that the submit button will be hidden
   * - null: the submit button will be left unchaged.
   * @property {object} defaults.extraValidators  - *  this object map form field id to a single function that should validate it.
      the function will recieve the HTMLElement as single argument & should return `true`
      if validation success or `false` if failed.
  * @property {array} defaults.validatableTags  -list of element TAGs that can be validated, default is ['input', 'textarea', 'select'].
  * @property {array} defaults.validateEachStep  - Whether each step should be validated before moving to the next step or not.
  * @property {function } defaults.validateFun  - * The usual validator function that should run on all elements that are validatables, excluding those with `formnovalidate` attribute.
   * This function recieves the element to validate., default is 'false'.
   * Note that this function will never be called if the form has `novalidate` attribute.
   * default is `element.reportValidity()`
   *  @property {function} defaults.oninvalid the function that runs if the form is invalid, it runs after form validation.
   * This means that it if `defaults.validateEachStep` is `true` , it will run after each step, unless it will run once after the last step
   * This function recieves no arguments. but you can access the form errors from the `errors` attribute of the form object. 
   */
  var defaults = {
    formStepClass: "form-step",
    getCurrentStep: null,
    storeCurrentStep: null,
    onStepShown: null,
    onStepHide: null,
    hideFun: null,
    showFun: null,
    submitFun: null,
    alterSubmitBtn: null, // [ 'next', 'null'. null, 'hide']
    afterLastStep: null,
    extraValidators: {},
    validatableTags: ["input", "select", "textarea"],
    validateEachStep: true,
    validateFun: null,
    oninvalid: null,
  };

  function call(fn) {
    if (fn === undefined || fn === null) {
      return;
    }
    return fn.apply(this, Array.prototype.slice.call(arguments, 1));
  }

  function alterSubmitBtn(form, strategy, callback) {
    if (strategy === null || strategy === "null") {
      return;
    }
    var inputElements = form.getElementsByTagName("input");
    var buttonElements = form.getElementsByTagName("button");
    var submitBtn = undefined;
    for (var index = 0; index < inputElements.length; index++) {
      if (inputElements[index].getAttribute("type") == "submit") {
        submitBtn = inputElements[index];
        break;
      }
    }
    if (submitBtn == undefined) {
      for (index = 0; index < buttonElements.length; index++) {
        if (buttonElements[index].getAttribute("type") == "submit") {
          submitBtn = buttonElements[index];
          break;
        }
      }
    }
    if (strategy == "next") {
      if (submitBtn != undefined) {
        submitBtn.addEventListener("click", callback);
        submitBtn.addEventListener("submit", callback);
      }
    } else if (strategy == "hide") {
      submitBtn.style.display = "none";
    }
  }

  /** MultiStepForm
   * @class
   * @memberof msf
   * @param {Element} form the form element
   * @param {object} options options, see `{@link msf.defaults}` documentations.
   * @property {number} currentStep - the current step
   * @property {Function} submit - The submit method
   * @property {Function} moveTo - move to method, accept the step index to move to it.
   * @property {Function} showNext - move to the next step.
   * @property {Function} showPrev - move to the previous step.
   * @property {Function} showFirst - move to the first step.
   * @property {Function} getCurrentStep - returns the current step index.
   * @property {Function} isLastStep - returns `true` if the current step is the last one.
   * Notes:
   * - if the form has `novalidate` attribute, no validation will run.
   * - `errors` contains all form errors & updated after each validation.
   */
  function MultiStepForm(form, options) {
    this.form = form;
    this.currentStep = 0;
    this.initial = this._initial.bind(this);
    this.submit = this._submit.bind(this);
    this.reportValidity = this._reportValidity.bind(this);
    this.moveTo = this._moveTo.bind(this);
    this.showNext = this._showNext.bind(this);
    this.showPrev = this._showPrev.bind(this);
    this.showFirst = this._showFirst.bind(this);
    this.getCurrentStep = this._getCurrentStep.bind(this);
    this.isLastStep = this._isLastStep.bind(this);
    this.fixOptions = this._fixOptions.bind(this);
    this.tryToValidate = this._tryToValidate.bind(this);

    this.options = this.fixOptions(options);
    this.formSteps = this.form.getElementsByClassName(
      this.options.formStepClass
    );
    this.stepLength = this.formSteps.length;
    this.novalidate = this.form.getAttribute("novalidate") !== null;
    this.errors = {};

    if (this.formSteps.length === 0) {
      throw Error(
        "Your form has no step defined by class: " + this.options.formStepClass
      );
    }

    this.initial();
    this.showFirst();
  }
  MultiStepForm.prototype._fixOptions = function (options) {
    options = options || {};
    this.options = assign({}, defaults, options);
    this.options.getCurrentStep =
      this.options.getCurrentStep || this._defaultGetCurrentStep.bind(this);
    this.options.storeCurrentStep =
      this.options.storeCurrentStep || this._defaultStoreCurrentStep.bind(this);
    this.options.submitFun =
      this.options.submitFun || this._defaultSubmit.bind(this);
    this.options.showFun =
      this.options.showFun || this._defaultShowFun.bind(this);
    this.options.hideFun =
      this.options.hideFun || this._defaultHideFun.bind(this);
    this.options.validateFun =
      this.options.validateFun || this._defaultValidateFun.bind(this);
    this.options.afterLastStep =
      this.options.afterLastStep || this._afterLastStep.bind(this);
    return this.options;
  };

  MultiStepForm.prototype._initial = function () {
    var self = this;
    // Hide all
    for (var x = 0; x < this.formSteps.length; x++) {
      this.options.hideFun(this.formSteps[x]);
    }

    alterSubmitBtn(this.form, this.options.alterSubmitBtn, function (event) {
      event.preventDefault();
      self.showNext();
    });
  };

  MultiStepForm.prototype._submit = function () {
    return this.options.submitFun();
  };

  MultiStepForm.prototype._defaultValidateFun = function (element) {
    try {
      return element.reportValidity();
    } catch (e) {
      console.error(e);
    }
  };
  /** report validity of the element, it runs the `options.validateFun` on all element with `options.validatableTags` & also the `options.extravalidators`
   * @param {*} ele the element to validate.
   * @return {boolean} true if no errors
   */
  MultiStepForm.prototype._reportValidity = function (ele) {
    function callExtraValidator(_element, validators) {
      if (
        _element == undefined ||
        typeof _element.getAttribute == "undefined" ||
        validators == undefined
      ) {
        return true;
      }
      var name = _element.getAttribute("name");
      if (name == undefined) {
        return true;
      }
      var validator = validators[name];
      if (validator == undefined) {
        return true;
      }
      return validator(_element);
    }
    var rv = true;
    var validatables = [];
    for (var i = 0; i < this.options.validatableTags.length; i++) {
      var queryString =
        this.options.validatableTags[i] + "[name]:not([formnovalidate])";
      ele.querySelectorAll(queryString).forEach(function (e) {
        validatables.push(e);
      });
    }
    for (var index = 0; index < validatables.length; index++) {
      var elem = validatables[index];
      var name = elem.getAttribute("name");
      var isValid = true;
      isValid = this.options.validateFun(elem);
      isValid =
        isValid && callExtraValidator(elem, this.options.extraValidators);
      if (isValid) {
        delete this.errors[name];
      } else {
        var validationObj = elem.validity;
        validationObj.validationMessage = elem.validationMessage;
        validationObj.step = this.getCurrentStep();
        this.errors[name] = validationObj;
      }
      rv = rv && isValid;
    }
    return rv;
  };

  MultiStepForm.prototype._tryToValidate = function () {
    if (this.novalidate) {
      return true;
    }
    var currentStep = this.getCurrentStep();
    if (this.options.validateEachStep) {
      return this.reportValidity(this.formSteps[currentStep]);
    } else if (this.isLastStep()) {
      // if `options.validateEachStep` is `false`, we should run validation at least one time befor submit.
      // if there is error in validation, we shouldn't submit.
      return this.reportValidity(this.form);
    } else {
      return true;
    }
  };

  MultiStepForm.prototype._moveTo = function (targetStep) {
    // This function will figure out which form-step to display
    if (targetStep < 0) {
      return false;
    }
    var currentStep = this.getCurrentStep();
    // Exit the function if any field in the current form-step is invalid:
    // and wants to go next
    if (targetStep > currentStep && !this.tryToValidate()) {
      if (this.options.oninvalid !== null) {
        this.options.oninvalid();
      }
      return false;
    }
    // if you have reached the end of the form...
    if (targetStep > currentStep && this.isLastStep()) {
      return this.options.afterLastStep();
    } else {
      if (currentStep !== undefined && currentStep !== null) {
        this.options.hideFun(this.formSteps[currentStep]);
        call(this.options.onStepHide, currentStep);
      }
      // Show current
      this.options.showFun(this.formSteps[targetStep]);
      // store the correct currentStep
      this.options.storeCurrentStep(targetStep);
      call(this.options.onStepShown, targetStep);
    }
  };

  MultiStepForm.prototype._showNext = function () {
    var current = this.getCurrentStep();
    this.moveTo(current + 1);
  };

  MultiStepForm.prototype._showFirst = function () {
    this.moveTo(0);
  };

  MultiStepForm.prototype._showPrev = function () {
    var current = this.getCurrentStep();
    this.moveTo(current - 1);
  };

  MultiStepForm.prototype._getCurrentStep = function () {
    return this.options.getCurrentStep();
  };

  MultiStepForm.prototype._defaultGetCurrentStep = function () {
    return this.currentStep;
  };

  MultiStepForm.prototype._defaultStoreCurrentStep = function (step) {
    this.currentStep = step;
  };

  MultiStepForm.prototype._defaultSubmit = function () {
    this.form.submit();
    return false;
  };

  MultiStepForm.prototype._defaultHideFun = function (element) {
    element.style.display = "none";
  };

  MultiStepForm.prototype._defaultShowFun = function (element) {
    element.style.display = "block";
  };

  MultiStepForm.prototype._isLastStep = function () {
    return this.options.getCurrentStep() === this.stepLength - 1;
  };
  MultiStepForm.prototype._afterLastStep = function () {
    return this.submit();
  };

  return MultiStepForm;
}

// eslint-disable-next-line no-undef
module.exports = initMSF;

},{"./utils":5}],5:[function(require,module,exports){
/**
 * generate unique id
 */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  function _guid() {
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }
  return _guid();
}

// eslint-disable-next-line no-unused-vars
function assign(target, varArgs) {
  "use strict";
  if (target == null) {
    // TypeError if undefined or null
    throw new TypeError("Cannot convert undefined or null to object");
  }

  var to = Object(target);
  for (var index = 1; index < arguments.length; index++) {
    var nextSource = arguments[index];

    if (nextSource != null) {
      // Skip over if undefined or null
      for (var nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}

function similarityScore(str, string, slice) {
  if (slice === undefined || slice === null) {
    slice = true;
  }

  if (!slice) {
    str = str.trim();
    string = string.trim();
  }

  str = str.toLowerCase();

  string = string.toLowerCase();

  function equals(s1, s2) {
    return s1 == s2;
  }

  function toSubstrings(s) {
    var substrs = [];
    for (var index = 0; index < s.length; index++) {
      substrs.push(s.slice(index, s.length));
    }
    return substrs;
  }

  function fraction(s1, s2) {
    return s1.length / s2.length;
  }

  if (equals(str, string)) {
    score = 100;
    return score;
  } else {
    var score = 0;
    var index = string.indexOf(str);
    var f = fraction(str, string);
    if (index === 0) {
      // stratsWith ()
      score = f * 100;
    }
    // contains()
    else if (index != -1) {
      score = f * ((string.length - index) / string.length) * 100;
    }

    //
    if (!slice) {
      return score;
    } else {
      var substrs = toSubstrings(str);
      for (var index2 = 0; index2 < substrs.length - 1; index2++) {
        var subscore = similarityScore(substrs[index2], string, false);
        score = score + subscore / substrs.length;
      }

      return score; // / substrs.length
    }
  }
}

// eslint-disable-next-line no-undef
module.exports = {
  guid: guid,
  assign: assign,
  similarityScore: similarityScore,
};

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGd1aWQgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ndWlkO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgc2ltaWxhcml0eVNjb3JlID0gcmVxdWlyZShcIi4vdXRpbHNcIikuc2ltaWxhcml0eVNjb3JlO1xuXG5mdW5jdGlvbiBpbmlBdXRvY29tcGxldGUoKSB7XG4gIHZhciBERUZBVUxUX09QVElPTlMgPSB7XG4gICAgZmlsdGVyOiBmaWx0ZXIsXG5cbiAgICBleHRyYWN0VmFsdWU6IF9leHRyYWN0VmFsdWUsXG4gICAgc29ydDogbnVsbCxcbiAgICBkcm9wRG93bkNsYXNzZXM6IFtcImRyb3Bkb3duXCJdLFxuICAgIGRyb3BEb3duSXRlbUNsYXNzZXM6IFtdLFxuICAgIGRyb3BEb3duVGFnOiBcImRpdlwiLFxuICAgIGhpZGVJdGVtOiBoaWRlSXRlbSxcbiAgICBzaG93SXRlbTogc2hvd0l0ZW0sXG4gICAgc2hvd0xpc3Q6IHNob3dMaXN0LFxuICAgIGhpZGVMaXN0OiBoaWRlTGlzdCxcbiAgICBvbkl0ZW1TZWxlY3RlZDogb25JdGVtU2VsZWN0ZWQsXG4gICAgYWN0aXZlQ2xhc3M6IFwiYWN0aXZlXCIsXG4gICAgaXNWaXNpYmxlOiBpc1Zpc2libGUsXG4gICAgb25MaXN0SXRlbUNyZWF0ZWQ6IG51bGwsXG4gIH07XG5cbiAgZnVuY3Rpb24gaXNWaXNpYmxlKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gb25JdGVtU2VsZWN0ZWQoaW5wdXQsIGl0ZW0sIGh0bWxFbGVtZW50LCBhdXRjb21wbGV0ZSkge1xuICAgIGlucHV0LnZhbHVlID0gaXRlbS50ZXh0O1xuICAgIGF1dGNvbXBsZXRlLmhpZGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMaXN0KGwpIHtcbiAgICBsLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUxpc3QobCkge1xuICAgIGwuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUl0ZW0oZSkge1xuICAgIGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0l0ZW0oZSkge1xuICAgIGUuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICBmdW5jdGlvbiBzb3J0KHZhbHVlLCBkYXRhKSB7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBmdW5jdGlvbiBfZXh0cmFjdFZhbHVlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QudGV4dCB8fCBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIodmFsdWUsIGRhdGEsIGV4dHJhY3RWYWx1ZSkge1xuICAgIGlmIChleHRyYWN0VmFsdWUgPT09IHVuZGVmaW5lZCB8fCBleHRyYWN0VmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGV4dHJhY3RWYWx1ZSA9IF9leHRyYWN0VmFsdWU7XG4gICAgfVxuXG4gICAgdmFyIHNjb3JlcyA9IHt9O1xuICAgIHZhciBfZGF0YSA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGl0ZW1WYWx1ZSA9IGV4dHJhY3RWYWx1ZShkYXRhW2luZGV4XSk7XG4gICAgICB2YXIgc2NvcmUgPSBzaW1pbGFyaXR5U2NvcmUodmFsdWUsIGl0ZW1WYWx1ZSk7XG4gICAgICBpZiAoc2NvcmUgPiAwKSB7XG4gICAgICAgIF9kYXRhLnB1c2goZGF0YVtpbmRleF0pO1xuICAgICAgICBzY29yZXNbaXRlbVZhbHVlXSA9IHNjb3JlO1xuICAgICAgfVxuICAgIH1cbiAgICBfZGF0YSA9IF9kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHZhciBzY29yZUEgPSBzY29yZXNbZXh0cmFjdFZhbHVlKGEpXTtcbiAgICAgIHZhciBzY29yZUIgPSBzY29yZXNbZXh0cmFjdFZhbHVlKGIpXTtcbiAgICAgIHJldHVybiBzY29yZUIgLSBzY29yZUE7XG4gICAgfSk7XG4gICAgcmV0dXJuIF9kYXRhO1xuICB9XG5cbiAgLy8gZ2VuZXJhdGUgdW5pcXVlIGlkXG5cbiAgZnVuY3Rpb24gQXV0b2NvbXBsZXRlKGlucHV0LCBkYXRhLCBvcHRpb25zKSB7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIHRoaXMuZGF0YSA9IHRoaXMuZml4RGF0YShkYXRhKTtcbiAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5kYXRhO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IC0xO1xuXG4gICAgdGhpcy5kcm9wZG93bkl0ZW1zID0gW107XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgICB0aGlzLmNyZWF0ZUxpc3QgPSB0aGlzLl9jcmVhdGVMaXN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5jcmVhdGVJdGVtID0gdGhpcy5fY3JlYXRlSXRlbS5iaW5kKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlRGF0YSA9IHRoaXMuX3VwZGF0ZURhdGEuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3cgPSB0aGlzLl9zaG93LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oaWRlID0gdGhpcy5faGlkZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZmlsdGVyID0gdGhpcy5fZmlsdGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zb3J0ID0gdGhpcy5fc29ydC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWN0aXZhdGVOZXh0ID0gdGhpcy5fYWN0aXZhdGVOZXh0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5hY3RpdmF0ZVByZXYgPSB0aGlzLl9hY3RpdmF0ZVByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNlbGVjdEFjdGl2ZSA9IHRoaXMuX3NlbGVjdEFjdGl2ZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2U7XG5cbiAgICB0aGlzLnNldHVwTGlzdGVuZXJzID0gdGhpcy5fc2V0dXBfbGlzdGVuZXJzO1xuICAgIHRoaXMubGlzdCA9IHRoaXMuY3JlYXRlTGlzdCgpO1xuICAgIHRoaXMuaGlkZSgpO1xuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcnMoKTtcbiAgfVxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLmZpeERhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSBkYXRhW2luZGV4XTtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGVsZW1lbnQgPSB7IHRleHQ6IGVsZW1lbnQgfTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuX3VpZCA9IGd1aWQoKTtcbiAgICAgIHJ2LnB1c2goZWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zZXR1cF9saXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgaW5wdXQgPSBzZWxmLmlucHV0O1xuICAgICAgaWYgKHNlbGYuaXNTaG93bikge1xuICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuZmlsdGVyKGlucHV0LnZhbHVlKTtcbiAgICAgIHNlbGYuc29ydChpbnB1dC52YWx1ZSk7XG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcblxuICAgIC8qZXhlY3V0ZSBhIGZ1bmN0aW9uIHByZXNzZXMgYSBrZXkgb24gdGhlIGtleWJvYXJkOiovXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICB9XG4gICAgICBpZiAoZS5rZXlDb2RlID09IDQwKSB7XG4gICAgICAgIC8vIGRvd24ga2V5XG4gICAgICAgIHNlbGYuYWN0aXZhdGVOZXh0KCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAzOCkge1xuICAgICAgICAvLyB1cCBrZXlcbiAgICAgICAgc2VsZi5hY3RpdmF0ZVByZXYoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgIC8vIGVudGVyXG4gICAgICAgIHNlbGYuc2VsZWN0QWN0aXZlKCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAyNykge1xuICAgICAgICAvLyBlc2NhcGVcbiAgICAgICAgaWYgKHNlbGYuaXNTaG93bikge1xuICAgICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fdXBkYXRlRGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5maXhEYXRhKGRhdGEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3Nob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhc3RJdGVtID0gMDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5maWx0ZXJlZC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBodG1sRWxlbWVudCA9IHRoaXMuZHJvcGRvd25JdGVtc1t0aGlzLmZpbHRlcmVkW2luZGV4XS5fdWlkXTtcbiAgICAgIGlmIChodG1sRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMub3B0aW9ucy5zaG93SXRlbShodG1sRWxlbWVudCk7XG4gICAgICB0aGlzLmxpc3QuaW5zZXJ0QmVmb3JlKGh0bWxFbGVtZW50LCB0aGlzLmxpc3QuY2hpbGRyZW5bbGFzdEl0ZW1dKTtcbiAgICAgIGxhc3RJdGVtKys7XG4gICAgfVxuXG4gICAgZm9yIChpbmRleCA9IGxhc3RJdGVtOyBpbmRleCA8IHRoaXMubGlzdC5jaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMubGlzdC5jaGlsZE5vZGVzW2luZGV4XTtcbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlSXRlbShjaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLnNob3dMaXN0KHRoaXMubGlzdCk7XG4gICAgdGhpcy5pc1Nob3duID0gdHJ1ZTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9maWx0ZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZmlsdGVyICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLm9wdGlvbnMuZmlsdGVyKFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgdGhpcy5kYXRhLFxuICAgICAgICB0aGlzLm9wdGlvbnMuZXh0cmFjdFZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zb3J0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zb3J0ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLm9wdGlvbnMuc29ydCh2YWx1ZSwgdGhpcy5maWx0ZXJlZCk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2NyZWF0ZUxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMub3B0aW9ucy5kcm9wRG93blRhZyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMub3B0aW9ucy5kcm9wRG93bkNsYXNzZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBhLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmRyb3BEb3duQ2xhc3Nlc1tpbmRleF0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpXTtcbiAgICAgIHZhciBiID0gdGhpcy5jcmVhdGVJdGVtKGl0ZW0pO1xuICAgICAgYS5hcHBlbmRDaGlsZChiKTtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoYSk7XG4gICAgcmV0dXJuIGE7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fY3JlYXRlSXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgLypjcmVhdGUgYSBESVYgZWxlbWVudCBmb3IgZWFjaCBtYXRjaGluZyBlbGVtZW50OiovXG4gICAgdmFyIGh0bWxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcbiAgICAvKm1ha2UgdGhlIG1hdGNoaW5nIGxldHRlcnMgYm9sZDoqL1xuXG4gICAgdmFyIHRleHQgPSBpdGVtLnRleHQ7XG4gICAgdmFyIF91aWQgPSBpdGVtLl91aWQ7XG5cbiAgICBodG1sRWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgdmFyIGF0dHJzID0gaXRlbS5hdHRycyB8fCB7fTtcbiAgICB2YXIgYXR0cnNLZXlzID0gT2JqZWN0LmtleXMoYXR0cnMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhdHRyc0tleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIga2V5ID0gYXR0cnNLZXlzW2luZGV4XTtcbiAgICAgIHZhciB2YWwgPSBhdHRyc1trZXldO1xuICAgICAgaHRtbEVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB9XG5cbiAgICBmb3IgKFxuICAgICAgdmFyIGluZGV4MiA9IDA7XG4gICAgICBpbmRleDIgPCB0aGlzLm9wdGlvbnMuZHJvcERvd25JdGVtQ2xhc3Nlcy5sZW5ndGg7XG4gICAgICBpbmRleDIrK1xuICAgICkge1xuICAgICAgaHRtbEVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuZHJvcERvd25JdGVtQ2xhc3Nlc1tpbmRleDJdKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3Bkb3duSXRlbXNbX3VpZF0gPSBodG1sRWxlbWVudDtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBodG1sRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHNlbGYub3B0aW9ucy5vbkl0ZW1TZWxlY3RlZChzZWxmLmlucHV0LCBpdGVtLCBodG1sRWxlbWVudCwgc2VsZik7XG4gICAgfSk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQgIT09IG51bGwgJiZcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZCAhPT0gdW5kZWZpbmVkXG4gICAgKSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQoaHRtbEVsZW1lbnQsIGl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBodG1sRWxlbWVudDtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZUNsb3Nlc3QgPSBmdW5jdGlvbiAoaW5kZXgsIGRpcikge1xuICAgIGZvciAodmFyIGkgPSBpbmRleDsgaSA8IHRoaXMubGlzdC5jaGlsZE5vZGVzLmxlbmd0aDsgKSB7XG4gICAgICB2YXIgZSA9IHRoaXMubGlzdC5jaGlsZE5vZGVzW2ldO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5pc1Zpc2libGUoZSkpIHtcbiAgICAgICAgZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGRpciA+IDApIHtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9kZWFjdGl2YXRlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhbGwgPSB0aGlzLmxpc3QucXVlcnlTZWxlY3RvckFsbChcIi5cIiArIHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGFsbC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGFsbFtpbmRleF0uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZU5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVhY3RpdmF0ZUFsbCgpO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCsrO1xuICAgIHRoaXMuX2FjdGl2YXRlQ2xvc2VzdCh0aGlzLmFjdGl2ZUVsZW1lbnQsIDEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlUHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWFjdGl2YXRlQWxsKCk7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50LS07XG4gICAgdGhpcy5fYWN0aXZhdGVDbG9zZXN0KHRoaXMuYWN0aXZlRWxlbWVudCwgLTEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NlbGVjdEFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWN0aXZlID0gdGhpcy5saXN0LnF1ZXJ5U2VsZWN0b3IoXCIuXCIgKyB0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIGlmIChhY3RpdmUgIT09IG51bGwgJiYgYWN0aXZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFjdGl2ZS5jbGljaygpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub3B0aW9ucy5oaWRlTGlzdCh0aGlzLmxpc3QpO1xuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlO1xuICB9O1xuXG4gIHJldHVybiBBdXRvY29tcGxldGU7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbmlBdXRvY29tcGxldGU7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBndWlkID0gcmVxdWlyZShcIi4vdXRpbHNcIikuZ3VpZDtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcblxuZnVuY3Rpb24gaW5pdENoaXBzKCkge1xuICB2YXIgREVGQVVMVF9TRVRUSU5HUyA9IHtcbiAgICBjcmVhdGVJbnB1dDogdHJ1ZSxcbiAgICBjaGlwc0NsYXNzOiBcImNoaXBzXCIsXG4gICAgY2hpcENsYXNzOiBcImNoaXBcIixcbiAgICBjbG9zZUNsYXNzOiBcImNoaXAtY2xvc2VcIixcbiAgICBjaGlwSW5wdXRDbGFzczogXCJjaGlwLWlucHV0XCIsXG4gICAgaW1hZ2VXaWR0aDogOTYsXG4gICAgaW1hZ2VIZWlnaHQ6IDk2LFxuICAgIGNsb3NlOiB0cnVlLFxuICAgIG9uY2xpY2s6IG51bGwsXG4gICAgb25jbG9zZTogbnVsbCxcbiAgICBvbmNoYW5nZTogbnVsbCxcbiAgfTtcblxuICB2YXIgY2hpcERhdGEgPSB7XG4gICAgX3VpZDogbnVsbCxcbiAgICB0ZXh0OiBcIlwiLFxuICAgIGltZzogXCJcIixcbiAgICBhdHRyczoge1xuICAgICAgdGFiaW5kZXg6IFwiMFwiLFxuICAgIH0sXG4gICAgY2xvc2VDbGFzc2VzOiBudWxsLFxuICAgIGNsb3NlSFRNTDogbnVsbCxcbiAgICBvbmNsaWNrOiBudWxsLFxuICAgIG9uY2xvc2U6IG51bGwsXG4gIH07XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ2hpbGQodGFnLCBhdHRyaWJ1dGVzLCBjbGFzc2VzLCBwYXJlbnQpIHtcbiAgICB2YXIgZWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIHZhciBhdHRyc0tleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYXR0cnNLZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgZWxlLnNldEF0dHJpYnV0ZShhdHRyc0tleXNbaW5kZXhdLCBhdHRyaWJ1dGVzW2F0dHJzS2V5c1tpbmRleF1dKTtcbiAgICB9XG4gICAgZm9yICh2YXIgY2xhc3NJbmRleCA9IDA7IGNsYXNzSW5kZXggPCBjbGFzc2VzLmxlbmd0aDsgY2xhc3NJbmRleCsrKSB7XG4gICAgICB2YXIga2xzID0gY2xhc3Nlc1tjbGFzc0luZGV4XTtcbiAgICAgIGVsZS5jbGFzc0xpc3QuYWRkKGtscyk7XG4gICAgfVxuICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbGUpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIF9jcmVhdGVfY2hpcCwgVGhpcyBpcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiwgYWNjZXNzZWQgYnkgdGhlIENoaXBzLl9hZGRDaGlwIG1ldGhvZFxuICAgKiBAcGFyYW0geyp9IGRhdGEgVGhlIGNoaXAgZGF0YSB0byBjcmVhdGUsXG4gICAqIEByZXR1cm5zIEhUTUxFbGVtZW50XG4gICAqL1xuICBmdW5jdGlvbiBfY3JlYXRlQ2hpcChkYXRhKSB7XG4gICAgZGF0YSA9IGFzc2lnbih7fSwgY2hpcERhdGEsIGRhdGEpO1xuICAgIHZhciBhdHRycyA9IGFzc2lnbihkYXRhLmF0dHJzLCB7IFwiY2hpcC1pZFwiOiBkYXRhLl91aWQgfSk7XG4gICAgdmFyIGNoaXAgPSBjcmVhdGVDaGlsZChcImRpdlwiLCBhdHRycywgW1wiY2hpcFwiXSwgbnVsbCk7XG5cbiAgICBmdW5jdGlvbiBjbG9zZUNhbGxiYWNrKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBkYXRhLm9uY2xvc2UoZSwgY2hpcCwgZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xpY2tDYWxsYmFjayhlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgaWYgKGRhdGEub25jbGljayAhPT0gbnVsbCAmJiBkYXRhLm9uY2xpY2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhLm9uY2xpY2soZSwgY2hpcCwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuaW1hZ2UpIHtcbiAgICAgIGNyZWF0ZUNoaWxkKFxuICAgICAgICBcImltZ1wiLFxuICAgICAgICB7XG4gICAgICAgICAgd2lkdGg6IGRhdGEuaW1hZ2VXaWR0aCB8fCA5NixcbiAgICAgICAgICBoZWlnaHQ6IGRhdGEuaW1hZ2VIZWlnaHQgfHwgOTYsXG4gICAgICAgICAgc3JjOiBkYXRhLmltYWdlLFxuICAgICAgICB9LFxuICAgICAgICBbXSxcbiAgICAgICAgY2hpcCxcbiAgICAgICAge31cbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChkYXRhLnRleHQpIHtcbiAgICAgIHZhciBzcGFuID0gY3JlYXRlQ2hpbGQoXCJzcGFuXCIsIHt9LCBbXSwgY2hpcCwge30pO1xuICAgICAgc3Bhbi5pbm5lckhUTUwgPSBkYXRhLnRleHQ7XG4gICAgfVxuICAgIGlmIChkYXRhLmNsb3NlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGRhdGEuY2xvc2VDbGFzc2VzIHx8IFtcImNoaXAtY2xvc2VcIl07XG4gICAgICB2YXIgY2xvc2VTcGFuID0gY3JlYXRlQ2hpbGQoXG4gICAgICAgIFwic3BhblwiLFxuICAgICAgICB7fSwgLy8gaWQ6IGRhdGEuY2xvc2VJZFxuICAgICAgICBjbGFzc2VzLFxuICAgICAgICBjaGlwLFxuICAgICAgICB7fVxuICAgICAgKTtcblxuICAgICAgY2xvc2VTcGFuLmlubmVySFRNTCA9IGRhdGEuY2xvc2VIVE1MIHx8IFwiJnRpbWVzXCI7XG4gICAgICBpZiAoZGF0YS5vbmNsb3NlICE9PSBudWxsICYmIGRhdGEub25jbG9zZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb3NlU3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xvc2VDYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICAgIGNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIGNoaXA7XG4gIH1cblxuICBmdW5jdGlvbiBDaGlwcyhlbGVtZW50LCBkYXRhLCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhIHx8IFtdO1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuY2hpcHNDbGFzcyk7XG5cbiAgICB0aGlzLl9zZXRFbGVtZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5pbnB1dCA9IHRoaXMuX3NldElucHV0KCk7XG4gICAgdGhpcy5hZGRDaGlwID0gdGhpcy5fYWRkQ2hpcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlQ2hpcCA9IHRoaXMuX3JlbW92ZUNoaXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLmdldERhdGEgPSB0aGlzLl9nZXREYXRhLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNldEF1dG9jb21wbGV0ZSA9IHRoaXMuX3NldEF1dG9jb21wbGV0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVuZGVyID0gdGhpcy5fcmVuZGVyLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9nZXREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAodGhpcy5fZGF0YVtpbmRleF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9kYXRhW2luZGV4XSAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgdWlkID0gdGhpcy5fZGF0YVtpbmRleF0uX3VpZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldICE9PSBudWxsICYmXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0uX3VpZCA9PT0gdWlkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBvLnB1c2godGhpcy5kYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG87XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHRoaXMuZGF0YVtpbmRleF0uX2luZGV4ID0gaW5kZXg7XG4gICAgICB0aGlzLmFkZENoaXAodGhpcy5kYXRhW2luZGV4XSk7XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0QXV0b2NvbXBsZXRlID0gZnVuY3Rpb24gKGF1dG9jb21wbGV0ZU9iaikge1xuICAgIHRoaXMub3B0aW9ucy5hdXRvY29tcGxldGUgPSBhdXRvY29tcGxldGVPYmo7XG4gIH07XG5cbiAgLyoqXG4gICAqIGFkZCBjaGlwIHRvIGVsZW1lbnQgYnkgcGFzc2VkIGRhdGFcbiAgICogQHBhcmFtIHsqfSBkYXRhIGNoaXAgZGF0YSwgUGxlYXNlIHNlZSBgY2hpcERhdGFgIGRvY3VtbmV0YXRpb25zLlxuICAgKi9cbiAgQ2hpcHMucHJvdG90eXBlLl9hZGRDaGlwID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAvLyBnZXQgaW5wdXQgZWxlbWVudFxuICAgIHZhciBkaXN0RGF0YSA9IGFzc2lnbih7fSwgdGhpcy5vcHRpb25zLCBjaGlwRGF0YSwgZGF0YSk7XG4gICAgZGF0YSA9IGFzc2lnbihcbiAgICAgIHsgb25jbGljazogdGhpcy5vcHRpb25zLm9uY2xpY2ssIG9uY2xvc2U6IHRoaXMub3B0aW9ucy5vbmNsb3NlIH0sXG4gICAgICBkYXRhXG4gICAgKTtcblxuICAgIGlmIChkYXRhLl91aWQgPT09IHVuZGVmaW5lZCB8fCBkYXRhLl91aWQgPT09IG51bGwpIHtcbiAgICAgIHZhciB1aWQgPSBndWlkKCk7XG4gICAgICBkYXRhLl91aWQgPSB1aWQ7XG4gICAgICBkaXN0RGF0YS5fdWlkID0gdWlkO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBkaXN0RGF0YS5vbmNsaWNrID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRpc3REYXRhKSB7XG4gICAgICBzZWxmLl9oYW5kbGVDaGlwQ2xpY2suYXBwbHkoc2VsZiwgW2UsIGNoaXAsIGRhdGFdKTtcbiAgICB9O1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGlzdERhdGEub25jbG9zZSA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkaXN0RGF0YSkge1xuICAgICAgc2VsZi5faGFuZGxlQ2hpcENsb3NlLmFwcGx5KHNlbGYsIFtlLCBjaGlwLCBkYXRhXSk7XG4gICAgfTtcblxuICAgIHZhciBjaGlwID0gX2NyZWF0ZUNoaXAoZGlzdERhdGEpO1xuICAgIHZhciBpbnB1dCA9IHRoaXMuaW5wdXQ7XG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjaGlwKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnBhcmVudEVsZW1lbnQgPT09IHRoaXMuZWxlbWVudCkge1xuICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShjaGlwLCBpbnB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjaGlwKTtcbiAgICB9XG4gICAgLy8gQXZvaWQgaW5maW50ZSBsb29wLCBpZiByZWN1cnNzaXZlbHkgYWRkIGRhdGEgdG8gdGhlIHRoaXMuZGF0YSB3aGlsZSByZW5kZXIgaXMgdGVyYXRpbmdcbiAgICAvLyBvdmVyIGl0LlxuICAgIGlmIChkYXRhLl9pbmRleCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuX2luZGV4ICE9PSBudWxsKSB7XG4gICAgICB2YXIgaW5kZXggPSBkYXRhLl9pbmRleDtcbiAgICAgIGRlbGV0ZSBkYXRhLl9pbmRleDtcbiAgICAgIHRoaXMuZGF0YVtpbmRleF0gPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhLnB1c2goZGlzdERhdGEpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IG51bGwgJiYgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSh0aGlzLmdldERhdGEoKSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0SW5wdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlucHV0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmlucHV0ICE9PSBudWxsICYmIHRoaXMub3B0aW9ucy5pbnB1dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbnB1dCA9IHRoaXMub3B0aW9ucy5pbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGlucHV0cyA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICB0aGlzLm9wdGlvbnMuY2hpcElucHV0Q2xhc3NcbiAgICAgICk7XG4gICAgICBpZiAoaW5wdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW5wdXQgPSBpbnB1dHNbMF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY3JlYXRlSW5wdXQpIHtcbiAgICAgICAgLy8gY3JlYXRlIGlucHV0IGFuZCBhcHBlbmQgdG8gZWxlbWVudFxuICAgICAgICBpbnB1dCA9IGNyZWF0ZUNoaWxkKFxuICAgICAgICAgIFwiaW5wdXRcIixcbiAgICAgICAgICB7IHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgfHwgXCJcIiB9LFxuICAgICAgICAgIFt0aGlzLm9wdGlvbnMuY2hpcElucHV0Q2xhc3NdLFxuICAgICAgICAgIHRoaXMuZWxlbWVudFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gc2V0IGV2ZW50IGxpc3RlbmVyXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3Vzb3V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiZm9jdXNcIik7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNpblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZvY3VzXCIpO1xuICAgIH0pO1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIC8vIGVudGVyXG4gICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAvLyBPdmVycmlkZSBlbnRlciBpZiBhdXRvY29tcGxldGluZy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUgIT09IG51bGwgJiZcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlLmlzU2hvd25cbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgIHNlbGYuYWRkQ2hpcCh7XG4gICAgICAgICAgICB0ZXh0OiBpbnB1dC52YWx1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRFbGVtZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuaW5wdXQuZm9jdXMoKTtcbiAgICB9KTtcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICghZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKHNlbGYub3B0aW9ucy5jaGlwQ2xhc3MpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gOCB8fCBlLmtleUNvZGUgPT09IDQ2KSB7XG4gICAgICAgIHNlbGYuX2hhbmRsZUNoaXBEZWxldGUoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcENsaWNrID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRhdGEpIHtcbiAgICBlLnRhcmdldC5mb2N1cygpO1xuICAgIGlmIChkYXRhLm9uY2xpY2sgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm9uY2xpY2sgIT09IG51bGwpIHtcbiAgICAgIGRhdGEub25jbGljayhlLCBjaGlwLCBkYXRhKTtcbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9kZWxldGVDaGlwRGF0YSA9IGZ1bmN0aW9uICh1aWQpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhW2luZGV4XSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2RhdGFbaW5kZXhdICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh1aWQgPT09IHRoaXMuX2RhdGFbaW5kZXhdLl91aWQpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtpbmRleF07XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcENsb3NlID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRhdGEpIHtcbiAgICBpZiAodGhpcy5fZGVsZXRlQ2hpcERhdGEoZGF0YS5fdWlkKSkge1xuICAgICAgY2hpcC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGNoaXApO1xuICAgICAgaWYgKGRhdGEub25jbG9zZSAhPT0gdW5kZWZpbmVkICYmIGRhdGEub25jbG9zZSAhPT0gbnVsbCkge1xuICAgICAgICBkYXRhLm9uY2xvc2UoZSwgY2hpcCwgZGF0YSk7XG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gbnVsbCAmJlxuICAgICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSh0aGlzLmdldERhdGEoKSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fcmVtb3ZlQ2hpcCA9IGZ1bmN0aW9uIChjaGlwSWQpIHtcbiAgICB2YXIgY2hpcCA9IG51bGw7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZWxlbWVudC5jaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50LmNoaWxkcmVuW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5vcHRpb25zLmNoaXBDbGFzcylcbiAgICAgICkge1xuICAgICAgICBpZiAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpID09PSBjaGlwSWQpIHtcbiAgICAgICAgICBjaGlwID0gZWxlbWVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpbmRleDIgPSAwOyBpbmRleDIgPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleDIrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLmRhdGFbaW5kZXgyXTtcbiAgICAgIGlmIChpdGVtICE9PSB1bmRlZmluZWQgJiYgaXRlbSAhPT0gbnVsbCAmJiBpdGVtLl91aWQgPT09IGNoaXBJZCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVDaGlwQ2xvc2UobnVsbCwgY2hpcCwgaXRlbSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBEZWxldGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBjaGlwID0gZS50YXJnZXQ7XG4gICAgdmFyIGNoaXBJZCA9IGNoaXAuZ2V0QXR0cmlidXRlKFwiY2hpcC1pZFwiKTtcbiAgICBpZiAoY2hpcElkID09PSB1bmRlZmluZWQgfHwgY2hpcElkID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBFcnJvcihcIllvdSAgc2hvdWxkIHByb3ZpZGUgY2hpcElkXCIpO1xuICAgIH1cbiAgICB2YXIgZGF0YSA9IHt9O1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IHRoaXMuZGF0YVtpbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIGVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBlbGVtZW50ICE9PSBudWxsICYmXG4gICAgICAgIGVsZW1lbnQuX3VpZCA9PT0gY2hpcElkXG4gICAgICApIHtcbiAgICAgICAgZGF0YSA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBFcnJvcihcImNhbid0IGZpbmQgZGF0YSB3aXRoIGlkOiBcIiArIGNoaXBJZCwgdGhpcy5kYXRhKTtcbiAgfTtcblxuICByZXR1cm4gQ2hpcHM7XG59XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0gaW5pdENoaXBzO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxudmFyIGluaXRDaGlwcyA9IHJlcXVpcmUoXCIuL2NoaXBzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxudmFyIGluaXRBdXRvY29tcGxldGUgPSByZXF1aXJlKFwiLi9hdXRvY29tcGxldGVcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW50TVNGID0gcmVxdWlyZShcIi4vbXNmXCIpO1xuXG52YXIganVpcyA9IHt9O1xuanVpcy5DaGlwcyA9IGluaXRDaGlwcygpO1xuanVpcy5BdXRvY29tcGxldGUgPSBpbml0QXV0b2NvbXBsZXRlKCk7XG5qdWlzLk11bHRpU3RlcEZvcm0gPSBpbnRNU0YoKTtcbmp1aXMuTVNGID0ganVpcy5NdWx0aVN0ZXBGb3JtO1xuXG5pZiAod2luZG93ICE9PSB1bmRlZmluZWQgJiYgd2luZG93ICE9PSBudWxsKSB7XG4gIHdpbmRvdy5qdWlzID0ganVpcyB8fCB7fTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBqdWlzO1xuIiwiLyoqXG4gKiBAbmFtZXNwYWNlIG1zZlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG5cbi8qKlxuICogaW5pdCBtdWx0aSBzdGVwIGZvcm1cbiAqIEBtZW1iZXJvZiBtc2ZcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtFbGVtZW50fSAgLSB0aGUgZm9ybSBIVE1MRWxlbWVudFxuICogQHBhcmFtIHtvYmplY3R9IC0gdGhlIG9wdGlvbnMge0BsaW5rIG1zZi5kZWZhdWx0c31cbiAqIEByZXR1cm4ge21zZi5NdWx0aVN0ZXBGb3JtfVxuICovXG5mdW5jdGlvbiBpbml0TVNGKCkge1xuICAvKiogZGVmYXVsdHMgXG4gICAqIEBtZW1iZXJvZiBtc2ZcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9ICBkZWZhdWx0cy5mb3JtU3RlcENsYXNzICAgICAgICAgLSB0aGUgY2xhc3MgbmFtZSB0aGF0IGlkZW50aWZ5IHRoZSBmb3JtIHN0ZXAgZWxlbWVudFxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSAgZGVmYXVsdHMuZ2V0Q3VycmVudFN0ZXAgICAgICAtIGZ1bmN0aW9uIHRvIGdldCB0aGUgY3VycmVudCBzdGVwLCBpdCBzaG91bGQgcmV0dXJuIGBpbnRgXG4gICAgIC0gZGVhZnVsdCBpcyB0aGUgYE11bHRpU3RlcEZvcm0uX2RlZmF1bHRHZXRDdXJyZW50U3RlcGAgdGhhdCByZXR1cm5zIGBNdWx0aVN0ZXBGb3JtLmN1cnJlbnRTdGVwYCBwcm9wZXJ0eS5cbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gIGRlZmF1bHRzLnN0b3JlQ3VycmVudFN0ZXAgIC0gU3RvcmUgdGhlIGN1cnJlbnQgc3RlcCB2YWx1ZS5cbiAgICAgLSBkZWZhdWx0IGlzIGBNdWx0aVN0ZXBGb3JtLl9kZWZhdWx0U3RvcmVDdXJyZW50U3RlcGAgdGhhdCBzdG9yZXMgdGhlIHZhbHVlIGluIHRoZSBgTXVsdGlTdGVwRm9ybS5jdXVyZW50U3RlcGBcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMub25TdGVwU2hvd24gIC0gZnVuY3Rpb24gdGhhdCBjYWxsZWQgYWZ0ZXIgdGhlIHN0ZXAgc2hvd24sIHJlY2lldmVzIHRoZSBzaG93biBzdGVwIGluZGV4LlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5vblN0ZXBIaWRlICAgLSBmdW5jdGlvbiB0aGF0IGNhbGxlZCBhZnRlciB0aGUgc3RlcCBoaWRkZW4sIHJlY2lldmVzIHRoZSBoaWRkZW4gc3RlcCBpbmRleC5cbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMuaGlkZUZ1biAgLSBUaGUgZnVuY3Rpb24gdGhhdCBhY3R1YWxseSBoaWRlIHN0ZXAgZWxlbWV0cywgcmVjaWV2ZXMgdGhlIEhUTUwgZWxlbWVudCBhcyBzaW5nbGUgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gZGVmYXVsdCBhY3Rpb24gaXMgZG9uZSBieSBhcHBseWluZyBcImRpc3BsYXk6J25vbmUnXCJcIiAgXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGRlZmF1bHRzLnNob3dGdW4gLSAgVGhlIGZ1bmN0aW9uIHRoYXQgYWN0dWFsbHkgc2hvdyBzdGVwIGVsZW1ldHMsIHJlY2lldmVzIHRoZSBIVE1MIGVsZW1lbnQgYXMgc2luZ2xlIHBhcmFtZXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIGRlZmF1bHQgYWN0aW9uIGlzIGRvbmUgYnkgYXBwbHlpbmcgXCJkaXNwbGF5OidibG9jaydcIlwiXG4gICAgKiBAcHJvcGVydHkge2Z1bmN0aW9uIH0gZGVmYXVsdHMuc3VibWl0RnVuICAgLSAgVGhlIGZ1bmN0aW9uIHRoYXQgYWN1dHVhbGx5IHN1Ym1pdCB0aGUgZm9ybSBhZnRlciB0aGUgbGFzdCBzdGVwLlxuICAgLSBJdCByZWNpZXZlcyBubyBwYXJhbWV0ZXJzLlxuICAgLSBkZWZhdWx0IGlzIGBmb3JtLnN1Ym1pdCgpYCBcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMuYWZ0ZXJMYXN0U3RlcCAgXG4gICAtICogVGhlIGZ1bmN0aW9uIHRoYXQgd2lsbCBydW4gYWZ0ZXIgcmVhY2hpbmcgdGhlIGxhc3Qgc3RlcCAmIG5leHQgc3RlcCBpcyByZXF1ZXN0ZWQuXG4gICAqIGRlZmF1bHQgaXMgIHN1Ym1pdHRpbmcgdGhlIGZvcm0uXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGRlZmF1bHRzLmFsdGVyU3VibWl0QnRuICAtICogSWYgeW91IGNyZWF0ZSBzdWJtaXQgYnV0dG9uIGluIHlvdXIgZm9ybSwgWW91IHNob3VsZCBzcGVjaWZ5IHZhbGlkIHZhbHVlIGZvciB0aGlzIG9wdGlvbi5cbiAgICogQ2hvaWNlcyBhcmU6ICduZXh0JywgbnVsbCwgJ2hpZGUnXG4gICAqIC0gbmV4dDogbWVhbnMgdGhhdCBjbGlja2luZyB0aGUgc3VibWl0IGJ1dHRvbiB3aWxsIHNob3cgdGhlIG5leHQgc3RlcC5cbiAgICogLSBoaWRlOiBtZWFucyB0aGF0IHRoZSBzdWJtaXQgYnV0dG9uIHdpbGwgYmUgaGlkZGVuXG4gICAqIC0gbnVsbDogdGhlIHN1Ym1pdCBidXR0b24gd2lsbCBiZSBsZWZ0IHVuY2hhZ2VkLlxuICAgKiBAcHJvcGVydHkge29iamVjdH0gZGVmYXVsdHMuZXh0cmFWYWxpZGF0b3JzICAtICogIHRoaXMgb2JqZWN0IG1hcCBmb3JtIGZpZWxkIGlkIHRvIGEgc2luZ2xlIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIHZhbGlkYXRlIGl0LlxuICAgICAgdGhlIGZ1bmN0aW9uIHdpbGwgcmVjaWV2ZSB0aGUgSFRNTEVsZW1lbnQgYXMgc2luZ2xlIGFyZ3VtZW50ICYgc2hvdWxkIHJldHVybiBgdHJ1ZWBcbiAgICAgIGlmIHZhbGlkYXRpb24gc3VjY2VzcyBvciBgZmFsc2VgIGlmIGZhaWxlZC5cbiAgKiBAcHJvcGVydHkge2FycmF5fSBkZWZhdWx0cy52YWxpZGF0YWJsZVRhZ3MgIC1saXN0IG9mIGVsZW1lbnQgVEFHcyB0aGF0IGNhbiBiZSB2YWxpZGF0ZWQsIGRlZmF1bHQgaXMgWydpbnB1dCcsICd0ZXh0YXJlYScsICdzZWxlY3QnXS5cbiAgKiBAcHJvcGVydHkge2FycmF5fSBkZWZhdWx0cy52YWxpZGF0ZUVhY2hTdGVwICAtIFdoZXRoZXIgZWFjaCBzdGVwIHNob3VsZCBiZSB2YWxpZGF0ZWQgYmVmb3JlIG1vdmluZyB0byB0aGUgbmV4dCBzdGVwIG9yIG5vdC5cbiAgKiBAcHJvcGVydHkge2Z1bmN0aW9uIH0gZGVmYXVsdHMudmFsaWRhdGVGdW4gIC0gKiBUaGUgdXN1YWwgdmFsaWRhdG9yIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIHJ1biBvbiBhbGwgZWxlbWVudHMgdGhhdCBhcmUgdmFsaWRhdGFibGVzLCBleGNsdWRpbmcgdGhvc2Ugd2l0aCBgZm9ybW5vdmFsaWRhdGVgIGF0dHJpYnV0ZS5cbiAgICogVGhpcyBmdW5jdGlvbiByZWNpZXZlcyB0aGUgZWxlbWVudCB0byB2YWxpZGF0ZS4sIGRlZmF1bHQgaXMgJ2ZhbHNlJy5cbiAgICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gd2lsbCBuZXZlciBiZSBjYWxsZWQgaWYgdGhlIGZvcm0gaGFzIGBub3ZhbGlkYXRlYCBhdHRyaWJ1dGUuXG4gICAqIGRlZmF1bHQgaXMgYGVsZW1lbnQucmVwb3J0VmFsaWRpdHkoKWBcbiAgICogIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGRlZmF1bHRzLm9uaW52YWxpZCB0aGUgZnVuY3Rpb24gdGhhdCBydW5zIGlmIHRoZSBmb3JtIGlzIGludmFsaWQsIGl0IHJ1bnMgYWZ0ZXIgZm9ybSB2YWxpZGF0aW9uLlxuICAgKiBUaGlzIG1lYW5zIHRoYXQgaXQgaWYgYGRlZmF1bHRzLnZhbGlkYXRlRWFjaFN0ZXBgIGlzIGB0cnVlYCAsIGl0IHdpbGwgcnVuIGFmdGVyIGVhY2ggc3RlcCwgdW5sZXNzIGl0IHdpbGwgcnVuIG9uY2UgYWZ0ZXIgdGhlIGxhc3Qgc3RlcFxuICAgKiBUaGlzIGZ1bmN0aW9uIHJlY2lldmVzIG5vIGFyZ3VtZW50cy4gYnV0IHlvdSBjYW4gYWNjZXNzIHRoZSBmb3JtIGVycm9ycyBmcm9tIHRoZSBgZXJyb3JzYCBhdHRyaWJ1dGUgb2YgdGhlIGZvcm0gb2JqZWN0LiBcbiAgICovXG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBmb3JtU3RlcENsYXNzOiBcImZvcm0tc3RlcFwiLFxuICAgIGdldEN1cnJlbnRTdGVwOiBudWxsLFxuICAgIHN0b3JlQ3VycmVudFN0ZXA6IG51bGwsXG4gICAgb25TdGVwU2hvd246IG51bGwsXG4gICAgb25TdGVwSGlkZTogbnVsbCxcbiAgICBoaWRlRnVuOiBudWxsLFxuICAgIHNob3dGdW46IG51bGwsXG4gICAgc3VibWl0RnVuOiBudWxsLFxuICAgIGFsdGVyU3VibWl0QnRuOiBudWxsLCAvLyBbICduZXh0JywgJ251bGwnLiBudWxsLCAnaGlkZSddXG4gICAgYWZ0ZXJMYXN0U3RlcDogbnVsbCxcbiAgICBleHRyYVZhbGlkYXRvcnM6IHt9LFxuICAgIHZhbGlkYXRhYmxlVGFnczogW1wiaW5wdXRcIiwgXCJzZWxlY3RcIiwgXCJ0ZXh0YXJlYVwiXSxcbiAgICB2YWxpZGF0ZUVhY2hTdGVwOiB0cnVlLFxuICAgIHZhbGlkYXRlRnVuOiBudWxsLFxuICAgIG9uaW52YWxpZDogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBjYWxsKGZuKSB7XG4gICAgaWYgKGZuID09PSB1bmRlZmluZWQgfHwgZm4gPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWx0ZXJTdWJtaXRCdG4oZm9ybSwgc3RyYXRlZ3ksIGNhbGxiYWNrKSB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSBudWxsIHx8IHN0cmF0ZWd5ID09PSBcIm51bGxcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaW5wdXRFbGVtZW50cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKTtcbiAgICB2YXIgYnV0dG9uRWxlbWVudHMgPSBmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xuICAgIHZhciBzdWJtaXRCdG4gPSB1bmRlZmluZWQ7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGlucHV0RWxlbWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoaW5wdXRFbGVtZW50c1tpbmRleF0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSA9PSBcInN1Ym1pdFwiKSB7XG4gICAgICAgIHN1Ym1pdEJ0biA9IGlucHV0RWxlbWVudHNbaW5kZXhdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN1Ym1pdEJ0biA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IGJ1dHRvbkVsZW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBpZiAoYnV0dG9uRWxlbWVudHNbaW5kZXhdLmdldEF0dHJpYnV0ZShcInR5cGVcIikgPT0gXCJzdWJtaXRcIikge1xuICAgICAgICAgIHN1Ym1pdEJ0biA9IGJ1dHRvbkVsZW1lbnRzW2luZGV4XTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RyYXRlZ3kgPT0gXCJuZXh0XCIpIHtcbiAgICAgIGlmIChzdWJtaXRCdG4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1Ym1pdEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuICAgICAgICBzdWJtaXRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzdHJhdGVneSA9PSBcImhpZGVcIikge1xuICAgICAgc3VibWl0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICAvKiogTXVsdGlTdGVwRm9ybVxuICAgKiBAY2xhc3NcbiAgICogQG1lbWJlcm9mIG1zZlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGZvcm0gdGhlIGZvcm0gZWxlbWVudFxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBvcHRpb25zLCBzZWUgYHtAbGluayBtc2YuZGVmYXVsdHN9YCBkb2N1bWVudGF0aW9ucy5cbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IGN1cnJlbnRTdGVwIC0gdGhlIGN1cnJlbnQgc3RlcFxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBzdWJtaXQgLSBUaGUgc3VibWl0IG1ldGhvZFxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBtb3ZlVG8gLSBtb3ZlIHRvIG1ldGhvZCwgYWNjZXB0IHRoZSBzdGVwIGluZGV4IHRvIG1vdmUgdG8gaXQuXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IHNob3dOZXh0IC0gbW92ZSB0byB0aGUgbmV4dCBzdGVwLlxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBzaG93UHJldiAtIG1vdmUgdG8gdGhlIHByZXZpb3VzIHN0ZXAuXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IHNob3dGaXJzdCAtIG1vdmUgdG8gdGhlIGZpcnN0IHN0ZXAuXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGdldEN1cnJlbnRTdGVwIC0gcmV0dXJucyB0aGUgY3VycmVudCBzdGVwIGluZGV4LlxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBpc0xhc3RTdGVwIC0gcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGN1cnJlbnQgc3RlcCBpcyB0aGUgbGFzdCBvbmUuXG4gICAqIE5vdGVzOlxuICAgKiAtIGlmIHRoZSBmb3JtIGhhcyBgbm92YWxpZGF0ZWAgYXR0cmlidXRlLCBubyB2YWxpZGF0aW9uIHdpbGwgcnVuLlxuICAgKiAtIGBlcnJvcnNgIGNvbnRhaW5zIGFsbCBmb3JtIGVycm9ycyAmIHVwZGF0ZWQgYWZ0ZXIgZWFjaCB2YWxpZGF0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gTXVsdGlTdGVwRm9ybShmb3JtLCBvcHRpb25zKSB7XG4gICAgdGhpcy5mb3JtID0gZm9ybTtcbiAgICB0aGlzLmN1cnJlbnRTdGVwID0gMDtcbiAgICB0aGlzLmluaXRpYWwgPSB0aGlzLl9pbml0aWFsLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdWJtaXQgPSB0aGlzLl9zdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlcG9ydFZhbGlkaXR5ID0gdGhpcy5fcmVwb3J0VmFsaWRpdHkuYmluZCh0aGlzKTtcbiAgICB0aGlzLm1vdmVUbyA9IHRoaXMuX21vdmVUby5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd05leHQgPSB0aGlzLl9zaG93TmV4dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd1ByZXYgPSB0aGlzLl9zaG93UHJldi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd0ZpcnN0ID0gdGhpcy5fc2hvd0ZpcnN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXRDdXJyZW50U3RlcCA9IHRoaXMuX2dldEN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5pc0xhc3RTdGVwID0gdGhpcy5faXNMYXN0U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZml4T3B0aW9ucyA9IHRoaXMuX2ZpeE9wdGlvbnMuYmluZCh0aGlzKTtcbiAgICB0aGlzLnRyeVRvVmFsaWRhdGUgPSB0aGlzLl90cnlUb1ZhbGlkYXRlLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLmZpeE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5mb3JtU3RlcHMgPSB0aGlzLmZvcm0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgKTtcbiAgICB0aGlzLnN0ZXBMZW5ndGggPSB0aGlzLmZvcm1TdGVwcy5sZW5ndGg7XG4gICAgdGhpcy5ub3ZhbGlkYXRlID0gdGhpcy5mb3JtLmdldEF0dHJpYnV0ZShcIm5vdmFsaWRhdGVcIikgIT09IG51bGw7XG4gICAgdGhpcy5lcnJvcnMgPSB7fTtcblxuICAgIGlmICh0aGlzLmZvcm1TdGVwcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBcIllvdXIgZm9ybSBoYXMgbm8gc3RlcCBkZWZpbmVkIGJ5IGNsYXNzOiBcIiArIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMuaW5pdGlhbCgpO1xuICAgIHRoaXMuc2hvd0ZpcnN0KCk7XG4gIH1cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2ZpeE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCA9XG4gICAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdEdldEN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdFN0b3JlQ3VycmVudFN0ZXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4gfHwgdGhpcy5fZGVmYXVsdFN1Ym1pdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zaG93RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zaG93RnVuIHx8IHRoaXMuX2RlZmF1bHRTaG93RnVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gPVxuICAgICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gfHwgdGhpcy5fZGVmYXVsdEhpZGVGdW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMudmFsaWRhdGVGdW4gPVxuICAgICAgdGhpcy5vcHRpb25zLnZhbGlkYXRlRnVuIHx8IHRoaXMuX2RlZmF1bHRWYWxpZGF0ZUZ1bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5hZnRlckxhc3RTdGVwID1cbiAgICAgIHRoaXMub3B0aW9ucy5hZnRlckxhc3RTdGVwIHx8IHRoaXMuX2FmdGVyTGFzdFN0ZXAuYmluZCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9pbml0aWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBIaWRlIGFsbFxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5mb3JtU3RlcHMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW3hdKTtcbiAgICB9XG5cbiAgICBhbHRlclN1Ym1pdEJ0bih0aGlzLmZvcm0sIHRoaXMub3B0aW9ucy5hbHRlclN1Ym1pdEJ0biwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2VsZi5zaG93TmV4dCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4oKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFZhbGlkYXRlRnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQucmVwb3J0VmFsaWRpdHkoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH1cbiAgfTtcbiAgLyoqIHJlcG9ydCB2YWxpZGl0eSBvZiB0aGUgZWxlbWVudCwgaXQgcnVucyB0aGUgYG9wdGlvbnMudmFsaWRhdGVGdW5gIG9uIGFsbCBlbGVtZW50IHdpdGggYG9wdGlvbnMudmFsaWRhdGFibGVUYWdzYCAmIGFsc28gdGhlIGBvcHRpb25zLmV4dHJhdmFsaWRhdG9yc2BcbiAgICogQHBhcmFtIHsqfSBlbGUgdGhlIGVsZW1lbnQgdG8gdmFsaWRhdGUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgbm8gZXJyb3JzXG4gICAqL1xuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fcmVwb3J0VmFsaWRpdHkgPSBmdW5jdGlvbiAoZWxlKSB7XG4gICAgZnVuY3Rpb24gY2FsbEV4dHJhVmFsaWRhdG9yKF9lbGVtZW50LCB2YWxpZGF0b3JzKSB7XG4gICAgICBpZiAoXG4gICAgICAgIF9lbGVtZW50ID09IHVuZGVmaW5lZCB8fFxuICAgICAgICB0eXBlb2YgX2VsZW1lbnQuZ2V0QXR0cmlidXRlID09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICAgdmFsaWRhdG9ycyA9PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBuYW1lID0gX2VsZW1lbnQuZ2V0QXR0cmlidXRlKFwibmFtZVwiKTtcbiAgICAgIGlmIChuYW1lID09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciB2YWxpZGF0b3IgPSB2YWxpZGF0b3JzW25hbWVdO1xuICAgICAgaWYgKHZhbGlkYXRvciA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsaWRhdG9yKF9lbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIHJ2ID0gdHJ1ZTtcbiAgICB2YXIgdmFsaWRhdGFibGVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMudmFsaWRhdGFibGVUYWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcXVlcnlTdHJpbmcgPVxuICAgICAgICB0aGlzLm9wdGlvbnMudmFsaWRhdGFibGVUYWdzW2ldICsgXCJbbmFtZV06bm90KFtmb3Jtbm92YWxpZGF0ZV0pXCI7XG4gICAgICBlbGUucXVlcnlTZWxlY3RvckFsbChxdWVyeVN0cmluZykuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YWxpZGF0YWJsZXMucHVzaChlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdmFsaWRhdGFibGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW0gPSB2YWxpZGF0YWJsZXNbaW5kZXhdO1xuICAgICAgdmFyIG5hbWUgPSBlbGVtLmdldEF0dHJpYnV0ZShcIm5hbWVcIik7XG4gICAgICB2YXIgaXNWYWxpZCA9IHRydWU7XG4gICAgICBpc1ZhbGlkID0gdGhpcy5vcHRpb25zLnZhbGlkYXRlRnVuKGVsZW0pO1xuICAgICAgaXNWYWxpZCA9XG4gICAgICAgIGlzVmFsaWQgJiYgY2FsbEV4dHJhVmFsaWRhdG9yKGVsZW0sIHRoaXMub3B0aW9ucy5leHRyYVZhbGlkYXRvcnMpO1xuICAgICAgaWYgKGlzVmFsaWQpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbGlkYXRpb25PYmogPSBlbGVtLnZhbGlkaXR5O1xuICAgICAgICB2YWxpZGF0aW9uT2JqLnZhbGlkYXRpb25NZXNzYWdlID0gZWxlbS52YWxpZGF0aW9uTWVzc2FnZTtcbiAgICAgICAgdmFsaWRhdGlvbk9iai5zdGVwID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgICAgICB0aGlzLmVycm9yc1tuYW1lXSA9IHZhbGlkYXRpb25PYmo7XG4gICAgICB9XG4gICAgICBydiA9IHJ2ICYmIGlzVmFsaWQ7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fdHJ5VG9WYWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5ub3ZhbGlkYXRlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRTdGVwID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudmFsaWRhdGVFYWNoU3RlcCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVwb3J0VmFsaWRpdHkodGhpcy5mb3JtU3RlcHNbY3VycmVudFN0ZXBdKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNMYXN0U3RlcCgpKSB7XG4gICAgICAvLyBpZiBgb3B0aW9ucy52YWxpZGF0ZUVhY2hTdGVwYCBpcyBgZmFsc2VgLCB3ZSBzaG91bGQgcnVuIHZhbGlkYXRpb24gYXQgbGVhc3Qgb25lIHRpbWUgYmVmb3Igc3VibWl0LlxuICAgICAgLy8gaWYgdGhlcmUgaXMgZXJyb3IgaW4gdmFsaWRhdGlvbiwgd2Ugc2hvdWxkbid0IHN1Ym1pdC5cbiAgICAgIHJldHVybiB0aGlzLnJlcG9ydFZhbGlkaXR5KHRoaXMuZm9ybSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fbW92ZVRvID0gZnVuY3Rpb24gKHRhcmdldFN0ZXApIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgZmlndXJlIG91dCB3aGljaCBmb3JtLXN0ZXAgdG8gZGlzcGxheVxuICAgIGlmICh0YXJnZXRTdGVwIDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFN0ZXAgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgLy8gRXhpdCB0aGUgZnVuY3Rpb24gaWYgYW55IGZpZWxkIGluIHRoZSBjdXJyZW50IGZvcm0tc3RlcCBpcyBpbnZhbGlkOlxuICAgIC8vIGFuZCB3YW50cyB0byBnbyBuZXh0XG4gICAgaWYgKHRhcmdldFN0ZXAgPiBjdXJyZW50U3RlcCAmJiAhdGhpcy50cnlUb1ZhbGlkYXRlKCkpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub25pbnZhbGlkICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmludmFsaWQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gaWYgeW91IGhhdmUgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBmb3JtLi4uXG4gICAgaWYgKHRhcmdldFN0ZXAgPiBjdXJyZW50U3RlcCAmJiB0aGlzLmlzTGFzdFN0ZXAoKSkge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hZnRlckxhc3RTdGVwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50U3RlcCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRTdGVwICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW2N1cnJlbnRTdGVwXSk7XG4gICAgICAgIGNhbGwodGhpcy5vcHRpb25zLm9uU3RlcEhpZGUsIGN1cnJlbnRTdGVwKTtcbiAgICAgIH1cbiAgICAgIC8vIFNob3cgY3VycmVudFxuICAgICAgdGhpcy5vcHRpb25zLnNob3dGdW4odGhpcy5mb3JtU3RlcHNbdGFyZ2V0U3RlcF0pO1xuICAgICAgLy8gc3RvcmUgdGhlIGNvcnJlY3QgY3VycmVudFN0ZXBcbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwKHRhcmdldFN0ZXApO1xuICAgICAgY2FsbCh0aGlzLm9wdGlvbnMub25TdGVwU2hvd24sIHRhcmdldFN0ZXApO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgdGhpcy5tb3ZlVG8oY3VycmVudCArIDEpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93Rmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tb3ZlVG8oMCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIHRoaXMubW92ZVRvKGN1cnJlbnQgLSAxKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZ2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0R2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN0ZXA7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICB0aGlzLmN1cnJlbnRTdGVwID0gc3RlcDtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZvcm0uc3VibWl0KCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0SGlkZUZ1biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTaG93RnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2lzTGFzdFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpID09PSB0aGlzLnN0ZXBMZW5ndGggLSAxO1xuICB9O1xuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fYWZ0ZXJMYXN0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdWJtaXQoKTtcbiAgfTtcblxuICByZXR1cm4gTXVsdGlTdGVwRm9ybTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRNU0Y7XG4iLCIvKipcbiAqIGdlbmVyYXRlIHVuaXF1ZSBpZFxuICovXG5mdW5jdGlvbiBndWlkKCkge1xuICBmdW5jdGlvbiBzNCgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgIC50b1N0cmluZygxNilcbiAgICAgIC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgZnVuY3Rpb24gX2d1aWQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIF9ndWlkKCk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHtcbiAgICAgIC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBuZXh0U291cmNlKSB7XG4gICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0bztcbn1cblxuZnVuY3Rpb24gc2ltaWxhcml0eVNjb3JlKHN0ciwgc3RyaW5nLCBzbGljZSkge1xuICBpZiAoc2xpY2UgPT09IHVuZGVmaW5lZCB8fCBzbGljZSA9PT0gbnVsbCkge1xuICAgIHNsaWNlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghc2xpY2UpIHtcbiAgICBzdHIgPSBzdHIudHJpbSgpO1xuICAgIHN0cmluZyA9IHN0cmluZy50cmltKCk7XG4gIH1cblxuICBzdHIgPSBzdHIudG9Mb3dlckNhc2UoKTtcblxuICBzdHJpbmcgPSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblxuICBmdW5jdGlvbiBlcXVhbHMoczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxID09IHMyO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9TdWJzdHJpbmdzKHMpIHtcbiAgICB2YXIgc3Vic3RycyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgc3Vic3Rycy5wdXNoKHMuc2xpY2UoaW5kZXgsIHMubGVuZ3RoKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJzdHJzO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJhY3Rpb24oczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aCAvIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmIChlcXVhbHMoc3RyLCBzdHJpbmcpKSB7XG4gICAgc2NvcmUgPSAxMDA7XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29yZSA9IDA7XG4gICAgdmFyIGluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc3RyKTtcbiAgICB2YXIgZiA9IGZyYWN0aW9uKHN0ciwgc3RyaW5nKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIC8vIHN0cmF0c1dpdGggKClcbiAgICAgIHNjb3JlID0gZiAqIDEwMDtcbiAgICB9XG4gICAgLy8gY29udGFpbnMoKVxuICAgIGVsc2UgaWYgKGluZGV4ICE9IC0xKSB7XG4gICAgICBzY29yZSA9IGYgKiAoKHN0cmluZy5sZW5ndGggLSBpbmRleCkgLyBzdHJpbmcubGVuZ3RoKSAqIDEwMDtcbiAgICB9XG5cbiAgICAvL1xuICAgIGlmICghc2xpY2UpIHtcbiAgICAgIHJldHVybiBzY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN1YnN0cnMgPSB0b1N1YnN0cmluZ3Moc3RyKTtcbiAgICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHN1YnN0cnMubGVuZ3RoIC0gMTsgaW5kZXgyKyspIHtcbiAgICAgICAgdmFyIHN1YnNjb3JlID0gc2ltaWxhcml0eVNjb3JlKHN1YnN0cnNbaW5kZXgyXSwgc3RyaW5nLCBmYWxzZSk7XG4gICAgICAgIHNjb3JlID0gc2NvcmUgKyBzdWJzY29yZSAvIHN1YnN0cnMubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2NvcmU7IC8vIC8gc3Vic3Rycy5sZW5ndGhcbiAgICB9XG4gIH1cbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ3VpZDogZ3VpZCxcbiAgYXNzaWduOiBhc3NpZ24sXG4gIHNpbWlsYXJpdHlTY29yZTogc2ltaWxhcml0eVNjb3JlLFxufTtcbiJdfQ==

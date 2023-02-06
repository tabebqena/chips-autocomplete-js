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
      var id = _element.getAttribute("id");
      if (id == undefined) {
        return true;
      }
      var validator = validators[id];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgZ3VpZCA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmd1aWQ7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBzaW1pbGFyaXR5U2NvcmUgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5zaW1pbGFyaXR5U2NvcmU7XG5cbmZ1bmN0aW9uIGluaUF1dG9jb21wbGV0ZSgpIHtcbiAgdmFyIERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBmaWx0ZXI6IGZpbHRlcixcblxuICAgIGV4dHJhY3RWYWx1ZTogX2V4dHJhY3RWYWx1ZSxcbiAgICBzb3J0OiBudWxsLFxuICAgIGRyb3BEb3duQ2xhc3NlczogW1wiZHJvcGRvd25cIl0sXG4gICAgZHJvcERvd25JdGVtQ2xhc3NlczogW10sXG4gICAgZHJvcERvd25UYWc6IFwiZGl2XCIsXG4gICAgaGlkZUl0ZW06IGhpZGVJdGVtLFxuICAgIHNob3dJdGVtOiBzaG93SXRlbSxcbiAgICBzaG93TGlzdDogc2hvd0xpc3QsXG4gICAgaGlkZUxpc3Q6IGhpZGVMaXN0LFxuICAgIG9uSXRlbVNlbGVjdGVkOiBvbkl0ZW1TZWxlY3RlZCxcbiAgICBhY3RpdmVDbGFzczogXCJhY3RpdmVcIixcbiAgICBpc1Zpc2libGU6IGlzVmlzaWJsZSxcbiAgICBvbkxpc3RJdGVtQ3JlYXRlZDogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBpc1Zpc2libGUoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBvbkl0ZW1TZWxlY3RlZChpbnB1dCwgaXRlbSwgaHRtbEVsZW1lbnQsIGF1dGNvbXBsZXRlKSB7XG4gICAgaW5wdXQudmFsdWUgPSBpdGVtLnRleHQ7XG4gICAgYXV0Y29tcGxldGUuaGlkZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0xpc3QobCkge1xuICAgIGwuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTGlzdChsKSB7XG4gICAgbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlSXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIGZ1bmN0aW9uIHNvcnQodmFsdWUsIGRhdGEpIHtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9leHRyYWN0VmFsdWUob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdC50ZXh0IHx8IG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcih2YWx1ZSwgZGF0YSwgZXh0cmFjdFZhbHVlKSB7XG4gICAgaWYgKGV4dHJhY3RWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGV4dHJhY3RWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgZXh0cmFjdFZhbHVlID0gX2V4dHJhY3RWYWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgc2NvcmVzID0ge307XG4gICAgdmFyIF9kYXRhID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgaXRlbVZhbHVlID0gZXh0cmFjdFZhbHVlKGRhdGFbaW5kZXhdKTtcbiAgICAgIHZhciBzY29yZSA9IHNpbWlsYXJpdHlTY29yZSh2YWx1ZSwgaXRlbVZhbHVlKTtcbiAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgX2RhdGEucHVzaChkYXRhW2luZGV4XSk7XG4gICAgICAgIHNjb3Jlc1tpdGVtVmFsdWVdID0gc2NvcmU7XG4gICAgICB9XG4gICAgfVxuICAgIF9kYXRhID0gX2RhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgdmFyIHNjb3JlQSA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYSldO1xuICAgICAgdmFyIHNjb3JlQiA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYildO1xuICAgICAgcmV0dXJuIHNjb3JlQiAtIHNjb3JlQTtcbiAgICB9KTtcbiAgICByZXR1cm4gX2RhdGE7XG4gIH1cblxuICAvLyBnZW5lcmF0ZSB1bmlxdWUgaWRcblxuICBmdW5jdGlvbiBBdXRvY29tcGxldGUoaW5wdXQsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5maXhEYXRhKGRhdGEpO1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gLTE7XG5cbiAgICB0aGlzLmRyb3Bkb3duSXRlbXMgPSBbXTtcblxuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9PUFRJT05TLCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLnBhcmVudE5vZGUgPSBpbnB1dC5wYXJlbnROb2RlO1xuICAgIHRoaXMuY3JlYXRlTGlzdCA9IHRoaXMuX2NyZWF0ZUxpc3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNyZWF0ZUl0ZW0gPSB0aGlzLl9jcmVhdGVJdGVtLmJpbmQodGhpcyk7XG4gICAgdGhpcy51cGRhdGVEYXRhID0gdGhpcy5fdXBkYXRlRGF0YS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvdyA9IHRoaXMuX3Nob3cuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhpZGUgPSB0aGlzLl9oaWRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5maWx0ZXIgPSB0aGlzLl9maWx0ZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNvcnQgPSB0aGlzLl9zb3J0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5hY3RpdmF0ZU5leHQgPSB0aGlzLl9hY3RpdmF0ZU5leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFjdGl2YXRlUHJldiA9IHRoaXMuX2FjdGl2YXRlUHJldi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2VsZWN0QWN0aXZlID0gdGhpcy5fc2VsZWN0QWN0aXZlLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcnMgPSB0aGlzLl9zZXR1cF9saXN0ZW5lcnM7XG4gICAgdGhpcy5saXN0ID0gdGhpcy5jcmVhdGVMaXN0KCk7XG4gICAgdGhpcy5oaWRlKCk7XG4gICAgdGhpcy5zZXR1cExpc3RlbmVycygpO1xuICB9XG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuZml4RGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IGRhdGFbaW5kZXhdO1xuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZWxlbWVudCA9IHsgdGV4dDogZWxlbWVudCB9O1xuICAgICAgfVxuICAgICAgZWxlbWVudC5fdWlkID0gZ3VpZCgpO1xuICAgICAgcnYucHVzaChlbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NldHVwX2xpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBpbnB1dCA9IHNlbGYuaW5wdXQ7XG4gICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgfVxuICAgICAgc2VsZi5maWx0ZXIoaW5wdXQudmFsdWUpO1xuICAgICAgc2VsZi5zb3J0KGlucHV0LnZhbHVlKTtcbiAgICAgIHNlbGYuc2hvdygpO1xuICAgIH0pO1xuXG4gICAgLypleGVjdXRlIGEgZnVuY3Rpb24gcHJlc3NlcyBhIGtleSBvbiB0aGUga2V5Ym9hcmQ6Ki9cbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIXNlbGYuaXNTaG93bikge1xuICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gNDApIHtcbiAgICAgICAgLy8gZG93biBrZXlcbiAgICAgICAgc2VsZi5hY3RpdmF0ZU5leHQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM4KSB7XG4gICAgICAgIC8vIHVwIGtleVxuICAgICAgICBzZWxmLmFjdGl2YXRlUHJldigpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgc2VsZi5zZWxlY3RBY3RpdmUoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDI3KSB7XG4gICAgICAgIC8vIGVzY2FwZVxuICAgICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl91cGRhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmZpeERhdGEoZGF0YSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdEl0ZW0gPSAwO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmZpbHRlcmVkLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGh0bWxFbGVtZW50ID0gdGhpcy5kcm9wZG93bkl0ZW1zW3RoaXMuZmlsdGVyZWRbaW5kZXhdLl91aWRdO1xuICAgICAgaWYgKGh0bWxFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRpb25zLnNob3dJdGVtKGh0bWxFbGVtZW50KTtcbiAgICAgIHRoaXMubGlzdC5pbnNlcnRCZWZvcmUoaHRtbEVsZW1lbnQsIHRoaXMubGlzdC5jaGlsZHJlbltsYXN0SXRlbV0pO1xuICAgICAgbGFzdEl0ZW0rKztcbiAgICB9XG5cbiAgICBmb3IgKGluZGV4ID0gbGFzdEl0ZW07IGluZGV4IDwgdGhpcy5saXN0LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaW5kZXhdO1xuICAgICAgdGhpcy5vcHRpb25zLmhpZGVJdGVtKGNoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2hvd0xpc3QodGhpcy5saXN0KTtcbiAgICB0aGlzLmlzU2hvd24gPSB0cnVlO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2ZpbHRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5maWx0ZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5maWx0ZXIoXG4gICAgICAgIHZhbHVlLFxuICAgICAgICB0aGlzLmRhdGEsXG4gICAgICAgIHRoaXMub3B0aW9ucy5leHRyYWN0VmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NvcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNvcnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5zb3J0KHZhbHVlLCB0aGlzLmZpbHRlcmVkKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fY3JlYXRlTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5vcHRpb25zLmRyb3BEb3duVGFnKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb25zLmRyb3BEb3duQ2xhc3Nlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGEuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuZHJvcERvd25DbGFzc2VzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gdGhpcy5kYXRhW2ldO1xuICAgICAgdmFyIGIgPSB0aGlzLmNyZWF0ZUl0ZW0oaXRlbSk7XG4gICAgICBhLmFwcGVuZENoaWxkKGIpO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChhKTtcbiAgICByZXR1cm4gYTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9jcmVhdGVJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAvKmNyZWF0ZSBhIERJViBlbGVtZW50IGZvciBlYWNoIG1hdGNoaW5nIGVsZW1lbnQ6Ki9cbiAgICB2YXIgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgIC8qbWFrZSB0aGUgbWF0Y2hpbmcgbGV0dGVycyBib2xkOiovXG5cbiAgICB2YXIgdGV4dCA9IGl0ZW0udGV4dDtcbiAgICB2YXIgX3VpZCA9IGl0ZW0uX3VpZDtcblxuICAgIGh0bWxFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICB2YXIgYXR0cnMgPSBpdGVtLmF0dHJzIHx8IHt9O1xuICAgIHZhciBhdHRyc0tleXMgPSBPYmplY3Qua2V5cyhhdHRycyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBhdHRyc0tleXNbaW5kZXhdO1xuICAgICAgdmFyIHZhbCA9IGF0dHJzW2tleV07XG4gICAgICBodG1sRWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIH1cblxuICAgIGZvciAoXG4gICAgICB2YXIgaW5kZXgyID0gMDtcbiAgICAgIGluZGV4MiA8IHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzLmxlbmd0aDtcbiAgICAgIGluZGV4MisrXG4gICAgKSB7XG4gICAgICBodG1sRWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzW2luZGV4Ml0pO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcGRvd25JdGVtc1tfdWlkXSA9IGh0bWxFbGVtZW50O1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGh0bWxFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgc2VsZi5vcHRpb25zLm9uSXRlbVNlbGVjdGVkKHNlbGYuaW5wdXQsIGl0ZW0sIGh0bWxFbGVtZW50LCBzZWxmKTtcbiAgICB9KTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZCAhPT0gbnVsbCAmJlxuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkICE9PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZChodG1sRWxlbWVudCwgaXRlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh0bWxFbGVtZW50O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlQ2xvc2VzdCA9IGZ1bmN0aW9uIChpbmRleCwgZGlyKSB7XG4gICAgZm9yICh2YXIgaSA9IGluZGV4OyBpIDwgdGhpcy5saXN0LmNoaWxkTm9kZXMubGVuZ3RoOyApIHtcbiAgICAgIHZhciBlID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaV07XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlzVmlzaWJsZShlKSkge1xuICAgICAgICBlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2RlYWN0aXZhdGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFsbCA9IHRoaXMubGlzdC5xdWVyeVNlbGVjdG9yQWxsKFwiLlwiICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYWxsLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgYWxsW2luZGV4XS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWFjdGl2YXRlQWxsKCk7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50Kys7XG4gICAgdGhpcy5fYWN0aXZhdGVDbG9zZXN0KHRoaXMuYWN0aXZlRWxlbWVudCwgMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQtLTtcbiAgICB0aGlzLl9hY3RpdmF0ZUNsb3Nlc3QodGhpcy5hY3RpdmVFbGVtZW50LCAtMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2VsZWN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY3RpdmUgPSB0aGlzLmxpc3QucXVlcnlTZWxlY3RvcihcIi5cIiArIHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgaWYgKGFjdGl2ZSAhPT0gbnVsbCAmJiBhY3RpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWN0aXZlLmNsaWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2hpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVMaXN0KHRoaXMubGlzdCk7XG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2U7XG4gIH07XG5cbiAgcmV0dXJuIEF1dG9jb21wbGV0ZTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaUF1dG9jb21wbGV0ZTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGd1aWQgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ndWlkO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuXG5mdW5jdGlvbiBpbml0Q2hpcHMoKSB7XG4gIHZhciBERUZBVUxUX1NFVFRJTkdTID0ge1xuICAgIGNyZWF0ZUlucHV0OiB0cnVlLFxuICAgIGNoaXBzQ2xhc3M6IFwiY2hpcHNcIixcbiAgICBjaGlwQ2xhc3M6IFwiY2hpcFwiLFxuICAgIGNsb3NlQ2xhc3M6IFwiY2hpcC1jbG9zZVwiLFxuICAgIGNoaXBJbnB1dENsYXNzOiBcImNoaXAtaW5wdXRcIixcbiAgICBpbWFnZVdpZHRoOiA5NixcbiAgICBpbWFnZUhlaWdodDogOTYsXG4gICAgY2xvc2U6IHRydWUsXG4gICAgb25jbGljazogbnVsbCxcbiAgICBvbmNsb3NlOiBudWxsLFxuICAgIG9uY2hhbmdlOiBudWxsLFxuICB9O1xuXG4gIHZhciBjaGlwRGF0YSA9IHtcbiAgICBfdWlkOiBudWxsLFxuICAgIHRleHQ6IFwiXCIsXG4gICAgaW1nOiBcIlwiLFxuICAgIGF0dHJzOiB7XG4gICAgICB0YWJpbmRleDogXCIwXCIsXG4gICAgfSxcbiAgICBjbG9zZUNsYXNzZXM6IG51bGwsXG4gICAgY2xvc2VIVE1MOiBudWxsLFxuICAgIG9uY2xpY2s6IG51bGwsXG4gICAgb25jbG9zZTogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVDaGlsZCh0YWcsIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIHBhcmVudCkge1xuICAgIHZhciBlbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgdmFyIGF0dHJzS2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhdHRyc0tleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBlbGUuc2V0QXR0cmlidXRlKGF0dHJzS2V5c1tpbmRleF0sIGF0dHJpYnV0ZXNbYXR0cnNLZXlzW2luZGV4XV0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBjbGFzc0luZGV4ID0gMDsgY2xhc3NJbmRleCA8IGNsYXNzZXMubGVuZ3RoOyBjbGFzc0luZGV4KyspIHtcbiAgICAgIHZhciBrbHMgPSBjbGFzc2VzW2NsYXNzSW5kZXhdO1xuICAgICAgZWxlLmNsYXNzTGlzdC5hZGQoa2xzKTtcbiAgICB9XG4gICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkICYmIHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVsZSk7XG4gICAgfVxuICAgIHJldHVybiBlbGU7XG4gIH1cblxuICAvKipcbiAgICogX2NyZWF0ZV9jaGlwLCBUaGlzIGlzIGFuIGludGVybmFsIGZ1bmN0aW9uLCBhY2Nlc3NlZCBieSB0aGUgQ2hpcHMuX2FkZENoaXAgbWV0aG9kXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSBUaGUgY2hpcCBkYXRhIHRvIGNyZWF0ZSxcbiAgICogQHJldHVybnMgSFRNTEVsZW1lbnRcbiAgICovXG4gIGZ1bmN0aW9uIF9jcmVhdGVDaGlwKGRhdGEpIHtcbiAgICBkYXRhID0gYXNzaWduKHt9LCBjaGlwRGF0YSwgZGF0YSk7XG4gICAgdmFyIGF0dHJzID0gYXNzaWduKGRhdGEuYXR0cnMsIHsgXCJjaGlwLWlkXCI6IGRhdGEuX3VpZCB9KTtcbiAgICB2YXIgY2hpcCA9IGNyZWF0ZUNoaWxkKFwiZGl2XCIsIGF0dHJzLCBbXCJjaGlwXCJdLCBudWxsKTtcblxuICAgIGZ1bmN0aW9uIGNsb3NlQ2FsbGJhY2soZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGRhdGEub25jbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGlja0NhbGxiYWNrKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpZiAoZGF0YS5vbmNsaWNrICE9PSBudWxsICYmIGRhdGEub25jbGljayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRhdGEub25jbGljayhlLCBjaGlwLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGF0YS5pbWFnZSkge1xuICAgICAgY3JlYXRlQ2hpbGQoXG4gICAgICAgIFwiaW1nXCIsXG4gICAgICAgIHtcbiAgICAgICAgICB3aWR0aDogZGF0YS5pbWFnZVdpZHRoIHx8IDk2LFxuICAgICAgICAgIGhlaWdodDogZGF0YS5pbWFnZUhlaWdodCB8fCA5NixcbiAgICAgICAgICBzcmM6IGRhdGEuaW1hZ2UsXG4gICAgICAgIH0sXG4gICAgICAgIFtdLFxuICAgICAgICBjaGlwLFxuICAgICAgICB7fVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGRhdGEudGV4dCkge1xuICAgICAgdmFyIHNwYW4gPSBjcmVhdGVDaGlsZChcInNwYW5cIiwge30sIFtdLCBjaGlwLCB7fSk7XG4gICAgICBzcGFuLmlubmVySFRNTCA9IGRhdGEudGV4dDtcbiAgICB9XG4gICAgaWYgKGRhdGEuY2xvc2UpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gZGF0YS5jbG9zZUNsYXNzZXMgfHwgW1wiY2hpcC1jbG9zZVwiXTtcbiAgICAgIHZhciBjbG9zZVNwYW4gPSBjcmVhdGVDaGlsZChcbiAgICAgICAgXCJzcGFuXCIsXG4gICAgICAgIHt9LCAvLyBpZDogZGF0YS5jbG9zZUlkXG4gICAgICAgIGNsYXNzZXMsXG4gICAgICAgIGNoaXAsXG4gICAgICAgIHt9XG4gICAgICApO1xuXG4gICAgICBjbG9zZVNwYW4uaW5uZXJIVE1MID0gZGF0YS5jbG9zZUhUTUwgfHwgXCImdGltZXNcIjtcbiAgICAgIGlmIChkYXRhLm9uY2xvc2UgIT09IG51bGwgJiYgZGF0YS5vbmNsb3NlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvc2VTcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2hpcC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xpY2tDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gY2hpcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIENoaXBzKGVsZW1lbnQsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwgW107XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5jaGlwc0NsYXNzKTtcblxuICAgIHRoaXMuX3NldEVsZW1lbnRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmlucHV0ID0gdGhpcy5fc2V0SW5wdXQoKTtcbiAgICB0aGlzLmFkZENoaXAgPSB0aGlzLl9hZGRDaGlwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVDaGlwID0gdGhpcy5fcmVtb3ZlQ2hpcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0RGF0YSA9IHRoaXMuX2dldERhdGEuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2V0QXV0b2NvbXBsZXRlID0gdGhpcy5fc2V0QXV0b2NvbXBsZXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW5kZXIgPSB0aGlzLl9yZW5kZXIuYmluZCh0aGlzKTtcblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBDaGlwcy5wcm90b3R5cGUuX2dldERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG8gPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhW2luZGV4XSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2RhdGFbaW5kZXhdICE9PSBudWxsKSB7XG4gICAgICAgIHZhciB1aWQgPSB0aGlzLl9kYXRhW2luZGV4XS5fdWlkO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXS5fdWlkID09PSB1aWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG8ucHVzaCh0aGlzLmRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbztcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3JlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdGhpcy5kYXRhW2luZGV4XS5faW5kZXggPSBpbmRleDtcbiAgICAgIHRoaXMuYWRkQ2hpcCh0aGlzLmRhdGFbaW5kZXhdKTtcbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRBdXRvY29tcGxldGUgPSBmdW5jdGlvbiAoYXV0b2NvbXBsZXRlT2JqKSB7XG4gICAgdGhpcy5vcHRpb25zLmF1dG9jb21wbGV0ZSA9IGF1dG9jb21wbGV0ZU9iajtcbiAgfTtcblxuICAvKipcbiAgICogYWRkIGNoaXAgdG8gZWxlbWVudCBieSBwYXNzZWQgZGF0YVxuICAgKiBAcGFyYW0geyp9IGRhdGEgY2hpcCBkYXRhLCBQbGVhc2Ugc2VlIGBjaGlwRGF0YWAgZG9jdW1uZXRhdGlvbnMuXG4gICAqL1xuICBDaGlwcy5wcm90b3R5cGUuX2FkZENoaXAgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIC8vIGdldCBpbnB1dCBlbGVtZW50XG4gICAgdmFyIGRpc3REYXRhID0gYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMsIGNoaXBEYXRhLCBkYXRhKTtcbiAgICBkYXRhID0gYXNzaWduKFxuICAgICAgeyBvbmNsaWNrOiB0aGlzLm9wdGlvbnMub25jbGljaywgb25jbG9zZTogdGhpcy5vcHRpb25zLm9uY2xvc2UgfSxcbiAgICAgIGRhdGFcbiAgICApO1xuXG4gICAgaWYgKGRhdGEuX3VpZCA9PT0gdW5kZWZpbmVkIHx8IGRhdGEuX3VpZCA9PT0gbnVsbCkge1xuICAgICAgdmFyIHVpZCA9IGd1aWQoKTtcbiAgICAgIGRhdGEuX3VpZCA9IHVpZDtcbiAgICAgIGRpc3REYXRhLl91aWQgPSB1aWQ7XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRpc3REYXRhLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGlzdERhdGEpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUNoaXBDbGljay5hcHBseShzZWxmLCBbZSwgY2hpcCwgZGF0YV0pO1xuICAgIH07XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBkaXN0RGF0YS5vbmNsb3NlID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRpc3REYXRhKSB7XG4gICAgICBzZWxmLl9oYW5kbGVDaGlwQ2xvc2UuYXBwbHkoc2VsZiwgW2UsIGNoaXAsIGRhdGFdKTtcbiAgICB9O1xuXG4gICAgdmFyIGNoaXAgPSBfY3JlYXRlQ2hpcChkaXN0RGF0YSk7XG4gICAgdmFyIGlucHV0ID0gdGhpcy5pbnB1dDtcbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucGFyZW50RWxlbWVudCA9PT0gdGhpcy5lbGVtZW50KSB7XG4gICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoaXAsIGlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH1cbiAgICAvLyBBdm9pZCBpbmZpbnRlIGxvb3AsIGlmIHJlY3Vyc3NpdmVseSBhZGQgZGF0YSB0byB0aGUgdGhpcy5kYXRhIHdoaWxlIHJlbmRlciBpcyB0ZXJhdGluZ1xuICAgIC8vIG92ZXIgaXQuXG4gICAgaWYgKGRhdGEuX2luZGV4ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5faW5kZXggIT09IG51bGwpIHtcbiAgICAgIHZhciBpbmRleCA9IGRhdGEuX2luZGV4O1xuICAgICAgZGVsZXRlIGRhdGEuX2luZGV4O1xuICAgICAgdGhpcy5kYXRhW2luZGV4XSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGEucHVzaChkaXN0RGF0YSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gbnVsbCAmJiB0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlKHRoaXMuZ2V0RGF0YSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaW5wdXQgIT09IG51bGwgJiYgdGhpcy5vcHRpb25zLmlucHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5wdXRzID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc1xuICAgICAgKTtcbiAgICAgIGlmIChpbnB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgICBpbnB1dCA9IGlucHV0c1swXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jcmVhdGVJbnB1dCkge1xuICAgICAgICAvLyBjcmVhdGUgaW5wdXQgYW5kIGFwcGVuZCB0byBlbGVtZW50XG4gICAgICAgIGlucHV0ID0gY3JlYXRlQ2hpbGQoXG4gICAgICAgICAgXCJpbnB1dFwiLFxuICAgICAgICAgIHsgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciB8fCBcIlwiIH0sXG4gICAgICAgICAgW3RoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc10sXG4gICAgICAgICAgdGhpcy5lbGVtZW50XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBzZXQgZXZlbnQgbGlzdGVuZXJcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNvdXRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJmb2N1c1wiKTtcbiAgICB9KTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c2luXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZm9jdXNcIik7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgLy8gZW50ZXJcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIC8vIE92ZXJyaWRlIGVudGVyIGlmIGF1dG9jb21wbGV0aW5nLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUuaXNTaG93blxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgc2VsZi5hZGRDaGlwKHtcbiAgICAgICAgICAgIHRleHQ6IGlucHV0LnZhbHVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEVsZW1lbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5pbnB1dC5mb2N1cygpO1xuICAgIH0pO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoc2VsZi5vcHRpb25zLmNoaXBDbGFzcykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZS5rZXlDb2RlID09PSA4IHx8IGUua2V5Q29kZSA9PT0gNDYpIHtcbiAgICAgICAgc2VsZi5faGFuZGxlQ2hpcERlbGV0ZShlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xpY2sgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGUudGFyZ2V0LmZvY3VzKCk7XG4gICAgaWYgKGRhdGEub25jbGljayAhPT0gdW5kZWZpbmVkICYmIGRhdGEub25jbGljayAhPT0gbnVsbCkge1xuICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2RlbGV0ZUNoaXBEYXRhID0gZnVuY3Rpb24gKHVpZCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHVpZCA9PT0gdGhpcy5fZGF0YVtpbmRleF0uX3VpZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW2luZGV4XTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGlmICh0aGlzLl9kZWxldGVDaGlwRGF0YShkYXRhLl91aWQpKSB7XG4gICAgICBjaGlwLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpcCk7XG4gICAgICBpZiAoZGF0YS5vbmNsb3NlICE9PSB1bmRlZmluZWQgJiYgZGF0YS5vbmNsb3NlICE9PSBudWxsKSB7XG4gICAgICAgIGRhdGEub25jbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSBudWxsICYmXG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlKHRoaXMuZ2V0RGF0YSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW1vdmVDaGlwID0gZnVuY3Rpb24gKGNoaXBJZCkge1xuICAgIHZhciBjaGlwID0gbnVsbDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICBlbGVtZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZWxlbWVudCAhPT0gbnVsbCAmJlxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLm9wdGlvbnMuY2hpcENsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZShcImNoaXAtaWRcIikgPT09IGNoaXBJZCkge1xuICAgICAgICAgIGNoaXAgPSBlbGVtZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4MisrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpbmRleDJdO1xuICAgICAgaWYgKGl0ZW0gIT09IHVuZGVmaW5lZCAmJiBpdGVtICE9PSBudWxsICYmIGl0ZW0uX3VpZCA9PT0gY2hpcElkKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShudWxsLCBjaGlwLCBpdGVtKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcERlbGV0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGNoaXAgPSBlLnRhcmdldDtcbiAgICB2YXIgY2hpcElkID0gY2hpcC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpO1xuICAgIGlmIChjaGlwSWQgPT09IHVuZGVmaW5lZCB8fCBjaGlwSWQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKFwiWW91ICBzaG91bGQgcHJvdmlkZSBjaGlwSWRcIik7XG4gICAgfVxuICAgIHZhciBkYXRhID0ge307XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5kYXRhW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5fdWlkID09PSBjaGlwSWRcbiAgICAgICkge1xuICAgICAgICBkYXRhID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5faGFuZGxlQ2hpcENsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IEVycm9yKFwiY2FuJ3QgZmluZCBkYXRhIHdpdGggaWQ6IFwiICsgY2hpcElkLCB0aGlzLmRhdGEpO1xuICB9O1xuXG4gIHJldHVybiBDaGlwcztcbn1cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2hpcHM7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdENoaXBzID0gcmVxdWlyZShcIi4vY2hpcHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdEF1dG9jb21wbGV0ZSA9IHJlcXVpcmUoXCIuL2F1dG9jb21wbGV0ZVwiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbnRNU0YgPSByZXF1aXJlKFwiLi9tc2ZcIik7XG5cbnZhciBqdWlzID0ge307XG5qdWlzLkNoaXBzID0gaW5pdENoaXBzKCk7XG5qdWlzLkF1dG9jb21wbGV0ZSA9IGluaXRBdXRvY29tcGxldGUoKTtcbmp1aXMuTXVsdGlTdGVwRm9ybSA9IGludE1TRigpO1xuanVpcy5NU0YgPSBqdWlzLk11bHRpU3RlcEZvcm07XG5cbmlmICh3aW5kb3cgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgd2luZG93Lmp1aXMgPSBqdWlzIHx8IHt9O1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGp1aXM7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgbXNmXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcblxuLyoqXG4gKiBpbml0IG11bHRpIHN0ZXAgZm9ybVxuICogQG1lbWJlcm9mIG1zZlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VsZW1lbnR9ICAtIHRoZSBmb3JtIEhUTUxFbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gLSB0aGUgb3B0aW9ucyB7QGxpbmsgbXNmLmRlZmF1bHRzfVxuICogQHJldHVybiB7bXNmLk11bHRpU3RlcEZvcm19XG4gKi9cbmZ1bmN0aW9uIGluaXRNU0YoKSB7XG4gIC8qKiBkZWZhdWx0cyBcbiAgICogQG1lbWJlcm9mIG1zZlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gIGRlZmF1bHRzLmZvcm1TdGVwQ2xhc3MgICAgICAgICAtIHRoZSBjbGFzcyBuYW1lIHRoYXQgaWRlbnRpZnkgdGhlIGZvcm0gc3RlcCBlbGVtZW50XG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259ICBkZWZhdWx0cy5nZXRDdXJyZW50U3RlcCAgICAgIC0gZnVuY3Rpb24gdG8gZ2V0IHRoZSBjdXJyZW50IHN0ZXAsIGl0IHNob3VsZCByZXR1cm4gYGludGBcbiAgICAgLSBkZWFmdWx0IGlzIHRoZSBgTXVsdGlTdGVwRm9ybS5fZGVmYXVsdEdldEN1cnJlbnRTdGVwYCB0aGF0IHJldHVybnMgYE11bHRpU3RlcEZvcm0uY3VycmVudFN0ZXBgIHByb3BlcnR5LlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSAgZGVmYXVsdHMuc3RvcmVDdXJyZW50U3RlcCAgLSBTdG9yZSB0aGUgY3VycmVudCBzdGVwIHZhbHVlLlxuICAgICAtIGRlZmF1bHQgaXMgYE11bHRpU3RlcEZvcm0uX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwYCB0aGF0IHN0b3JlcyB0aGUgdmFsdWUgaW4gdGhlIGBNdWx0aVN0ZXBGb3JtLmN1dXJlbnRTdGVwYFxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5vblN0ZXBTaG93biAgLSBmdW5jdGlvbiB0aGF0IGNhbGxlZCBhZnRlciB0aGUgc3RlcCBzaG93biwgcmVjaWV2ZXMgdGhlIHNob3duIHN0ZXAgaW5kZXguXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGRlZmF1bHRzLm9uU3RlcEhpZGUgICAtIGZ1bmN0aW9uIHRoYXQgY2FsbGVkIGFmdGVyIHRoZSBzdGVwIGhpZGRlbiwgcmVjaWV2ZXMgdGhlIGhpZGRlbiBzdGVwIGluZGV4LlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5oaWRlRnVuICAtIFRoZSBmdW5jdGlvbiB0aGF0IGFjdHVhbGx5IGhpZGUgc3RlcCBlbGVtZXRzLCByZWNpZXZlcyB0aGUgSFRNTCBlbGVtZW50IGFzIHNpbmdsZSBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBkZWZhdWx0IGFjdGlvbiBpcyBkb25lIGJ5IGFwcGx5aW5nIFwiZGlzcGxheTonbm9uZSdcIlwiICBcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMuc2hvd0Z1biAtICBUaGUgZnVuY3Rpb24gdGhhdCBhY3R1YWxseSBzaG93IHN0ZXAgZWxlbWV0cywgcmVjaWV2ZXMgdGhlIEhUTUwgZWxlbWVudCBhcyBzaW5nbGUgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gZGVmYXVsdCBhY3Rpb24gaXMgZG9uZSBieSBhcHBseWluZyBcImRpc3BsYXk6J2Jsb2NrJ1wiXCJcbiAgICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24gfSBkZWZhdWx0cy5zdWJtaXRGdW4gICAtICBUaGUgZnVuY3Rpb24gdGhhdCBhY3V0dWFsbHkgc3VibWl0IHRoZSBmb3JtIGFmdGVyIHRoZSBsYXN0IHN0ZXAuXG4gICAtIEl0IHJlY2lldmVzIG5vIHBhcmFtZXRlcnMuXG4gICAtIGRlZmF1bHQgaXMgYGZvcm0uc3VibWl0KClgIFxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5hZnRlckxhc3RTdGVwICBcbiAgIC0gKiBUaGUgZnVuY3Rpb24gdGhhdCB3aWxsIHJ1biBhZnRlciByZWFjaGluZyB0aGUgbGFzdCBzdGVwICYgbmV4dCBzdGVwIGlzIHJlcXVlc3RlZC5cbiAgICogZGVmYXVsdCBpcyAgc3VibWl0dGluZyB0aGUgZm9ybS5cbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMuYWx0ZXJTdWJtaXRCdG4gIC0gKiBJZiB5b3UgY3JlYXRlIHN1Ym1pdCBidXR0b24gaW4geW91ciBmb3JtLCBZb3Ugc2hvdWxkIHNwZWNpZnkgdmFsaWQgdmFsdWUgZm9yIHRoaXMgb3B0aW9uLlxuICAgKiBDaG9pY2VzIGFyZTogJ25leHQnLCBudWxsLCAnaGlkZSdcbiAgICogLSBuZXh0OiBtZWFucyB0aGF0IGNsaWNraW5nIHRoZSBzdWJtaXQgYnV0dG9uIHdpbGwgc2hvdyB0aGUgbmV4dCBzdGVwLlxuICAgKiAtIGhpZGU6IG1lYW5zIHRoYXQgdGhlIHN1Ym1pdCBidXR0b24gd2lsbCBiZSBoaWRkZW5cbiAgICogLSBudWxsOiB0aGUgc3VibWl0IGJ1dHRvbiB3aWxsIGJlIGxlZnQgdW5jaGFnZWQuXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBkZWZhdWx0cy5leHRyYVZhbGlkYXRvcnMgIC0gKiAgdGhpcyBvYmplY3QgbWFwIGZvcm0gZmllbGQgaWQgdG8gYSBzaW5nbGUgZnVuY3Rpb24gdGhhdCBzaG91bGQgdmFsaWRhdGUgaXQuXG4gICAgICB0aGUgZnVuY3Rpb24gd2lsbCByZWNpZXZlIHRoZSBIVE1MRWxlbWVudCBhcyBzaW5nbGUgYXJndW1lbnQgJiBzaG91bGQgcmV0dXJuIGB0cnVlYFxuICAgICAgaWYgdmFsaWRhdGlvbiBzdWNjZXNzIG9yIGBmYWxzZWAgaWYgZmFpbGVkLlxuICAqIEBwcm9wZXJ0eSB7YXJyYXl9IGRlZmF1bHRzLnZhbGlkYXRhYmxlVGFncyAgLWxpc3Qgb2YgZWxlbWVudCBUQUdzIHRoYXQgY2FuIGJlIHZhbGlkYXRlZCwgZGVmYXVsdCBpcyBbJ2lucHV0JywgJ3RleHRhcmVhJywgJ3NlbGVjdCddLlxuICAqIEBwcm9wZXJ0eSB7YXJyYXl9IGRlZmF1bHRzLnZhbGlkYXRlRWFjaFN0ZXAgIC0gV2hldGhlciBlYWNoIHN0ZXAgc2hvdWxkIGJlIHZhbGlkYXRlZCBiZWZvcmUgbW92aW5nIHRvIHRoZSBuZXh0IHN0ZXAgb3Igbm90LlxuICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24gfSBkZWZhdWx0cy52YWxpZGF0ZUZ1biAgLSAqIFRoZSB1c3VhbCB2YWxpZGF0b3IgZnVuY3Rpb24gdGhhdCBzaG91bGQgcnVuIG9uIGFsbCBlbGVtZW50cyB0aGF0IGFyZSB2YWxpZGF0YWJsZXMsIGV4Y2x1ZGluZyB0aG9zZSB3aXRoIGBmb3Jtbm92YWxpZGF0ZWAgYXR0cmlidXRlLlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJlY2lldmVzIHRoZSBlbGVtZW50IHRvIHZhbGlkYXRlLiwgZGVmYXVsdCBpcyAnZmFsc2UnLlxuICAgKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiB3aWxsIG5ldmVyIGJlIGNhbGxlZCBpZiB0aGUgZm9ybSBoYXMgYG5vdmFsaWRhdGVgIGF0dHJpYnV0ZS5cbiAgICogZGVmYXVsdCBpcyBgZWxlbWVudC5yZXBvcnRWYWxpZGl0eSgpYFxuICAgKiAgQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMub25pbnZhbGlkIHRoZSBmdW5jdGlvbiB0aGF0IHJ1bnMgaWYgdGhlIGZvcm0gaXMgaW52YWxpZCwgaXQgcnVucyBhZnRlciBmb3JtIHZhbGlkYXRpb24uXG4gICAqIFRoaXMgbWVhbnMgdGhhdCBpdCBpZiBgZGVmYXVsdHMudmFsaWRhdGVFYWNoU3RlcGAgaXMgYHRydWVgICwgaXQgd2lsbCBydW4gYWZ0ZXIgZWFjaCBzdGVwLCB1bmxlc3MgaXQgd2lsbCBydW4gb25jZSBhZnRlciB0aGUgbGFzdCBzdGVwXG4gICAqIFRoaXMgZnVuY3Rpb24gcmVjaWV2ZXMgbm8gYXJndW1lbnRzLiBidXQgeW91IGNhbiBhY2Nlc3MgdGhlIGZvcm0gZXJyb3JzIGZyb20gdGhlIGBlcnJvcnNgIGF0dHJpYnV0ZSBvZiB0aGUgZm9ybSBvYmplY3QuIFxuICAgKi9cbiAgdmFyIGRlZmF1bHRzID0ge1xuICAgIGZvcm1TdGVwQ2xhc3M6IFwiZm9ybS1zdGVwXCIsXG4gICAgZ2V0Q3VycmVudFN0ZXA6IG51bGwsXG4gICAgc3RvcmVDdXJyZW50U3RlcDogbnVsbCxcbiAgICBvblN0ZXBTaG93bjogbnVsbCxcbiAgICBvblN0ZXBIaWRlOiBudWxsLFxuICAgIGhpZGVGdW46IG51bGwsXG4gICAgc2hvd0Z1bjogbnVsbCxcbiAgICBzdWJtaXRGdW46IG51bGwsXG4gICAgYWx0ZXJTdWJtaXRCdG46IG51bGwsIC8vIFsgJ25leHQnLCAnbnVsbCcuIG51bGwsICdoaWRlJ11cbiAgICBhZnRlckxhc3RTdGVwOiBudWxsLFxuICAgIGV4dHJhVmFsaWRhdG9yczoge30sXG4gICAgdmFsaWRhdGFibGVUYWdzOiBbXCJpbnB1dFwiLCBcInNlbGVjdFwiLCBcInRleHRhcmVhXCJdLFxuICAgIHZhbGlkYXRlRWFjaFN0ZXA6IHRydWUsXG4gICAgdmFsaWRhdGVGdW46IG51bGwsXG4gIH07XG5cbiAgZnVuY3Rpb24gY2FsbChmbikge1xuICAgIGlmIChmbiA9PT0gdW5kZWZpbmVkIHx8IGZuID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFsdGVyU3VibWl0QnRuKGZvcm0sIHN0cmF0ZWd5LCBjYWxsYmFjaykge1xuICAgIGlmIChzdHJhdGVneSA9PT0gbnVsbCB8fCBzdHJhdGVneSA9PT0gXCJudWxsXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGlucHV0RWxlbWVudHMgPSBmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIik7XG4gICAgdmFyIGJ1dHRvbkVsZW1lbnRzID0gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJ1dHRvblwiKTtcbiAgICB2YXIgc3VibWl0QnRuID0gdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBpbnB1dEVsZW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKGlucHV0RWxlbWVudHNbaW5kZXhdLmdldEF0dHJpYnV0ZShcInR5cGVcIikgPT0gXCJzdWJtaXRcIikge1xuICAgICAgICBzdWJtaXRCdG4gPSBpbnB1dEVsZW1lbnRzW2luZGV4XTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdWJtaXRCdG4gPT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBidXR0b25FbGVtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgaWYgKGJ1dHRvbkVsZW1lbnRzW2luZGV4XS5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpID09IFwic3VibWl0XCIpIHtcbiAgICAgICAgICBzdWJtaXRCdG4gPSBidXR0b25FbGVtZW50c1tpbmRleF07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0cmF0ZWd5ID09IFwibmV4dFwiKSB7XG4gICAgICBpZiAoc3VibWl0QnRuICE9IHVuZGVmaW5lZCkge1xuICAgICAgICBzdWJtaXRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgc3VibWl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc3RyYXRlZ3kgPT0gXCJoaWRlXCIpIHtcbiAgICAgIHN1Ym1pdEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxuICB9XG5cbiAgLyoqIE11bHRpU3RlcEZvcm1cbiAgICogQGNsYXNzXG4gICAqIEBtZW1iZXJvZiBtc2ZcbiAgICogQHBhcmFtIHtFbGVtZW50fSBmb3JtIHRoZSBmb3JtIGVsZW1lbnRcbiAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgb3B0aW9ucywgc2VlIGB7QGxpbmsgbXNmLmRlZmF1bHRzfWAgZG9jdW1lbnRhdGlvbnMuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBjdXJyZW50U3RlcCAtIHRoZSBjdXJyZW50IHN0ZXBcbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gc3VibWl0IC0gVGhlIHN1Ym1pdCBtZXRob2RcbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gbW92ZVRvIC0gbW92ZSB0byBtZXRob2QsIGFjY2VwdCB0aGUgc3RlcCBpbmRleCB0byBtb3ZlIHRvIGl0LlxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBzaG93TmV4dCAtIG1vdmUgdG8gdGhlIG5leHQgc3RlcC5cbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gc2hvd1ByZXYgLSBtb3ZlIHRvIHRoZSBwcmV2aW91cyBzdGVwLlxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBzaG93Rmlyc3QgLSBtb3ZlIHRvIHRoZSBmaXJzdCBzdGVwLlxuICAgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBnZXRDdXJyZW50U3RlcCAtIHJldHVybnMgdGhlIGN1cnJlbnQgc3RlcCBpbmRleC5cbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gaXNMYXN0U3RlcCAtIHJldHVybnMgYHRydWVgIGlmIHRoZSBjdXJyZW50IHN0ZXAgaXMgdGhlIGxhc3Qgb25lLlxuICAgKiBOb3RlczpcbiAgICogLSBpZiB0aGUgZm9ybSBoYXMgYG5vdmFsaWRhdGVgIGF0dHJpYnV0ZSwgbm8gdmFsaWRhdGlvbiB3aWxsIHJ1bi5cbiAgICogLSBgZXJyb3JzYCBjb250YWlucyBhbGwgZm9ybSBlcnJvcnMgJiB1cGRhdGVkIGFmdGVyIGVhY2ggdmFsaWRhdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIE11bHRpU3RlcEZvcm0oZm9ybSwgb3B0aW9ucykge1xuICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgdGhpcy5jdXJyZW50U3RlcCA9IDA7XG4gICAgdGhpcy5pbml0aWFsID0gdGhpcy5faW5pdGlhbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc3VibWl0ID0gdGhpcy5fc3VibWl0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXBvcnRWYWxpZGl0eSA9IHRoaXMuX3JlcG9ydFZhbGlkaXR5LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tb3ZlVG8gPSB0aGlzLl9tb3ZlVG8uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dOZXh0ID0gdGhpcy5fc2hvd05leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dQcmV2ID0gdGhpcy5fc2hvd1ByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dGaXJzdCA9IHRoaXMuX3Nob3dGaXJzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0Q3VycmVudFN0ZXAgPSB0aGlzLl9nZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaXNMYXN0U3RlcCA9IHRoaXMuX2lzTGFzdFN0ZXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLmZpeE9wdGlvbnMgPSB0aGlzLl9maXhPcHRpb25zLmJpbmQodGhpcyk7XG4gICAgdGhpcy50cnlUb1ZhbGlkYXRlID0gdGhpcy5fdHJ5VG9WYWxpZGF0ZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy5maXhPcHRpb25zKG9wdGlvbnMpO1xuICAgIHRoaXMuZm9ybVN0ZXBzID0gdGhpcy5mb3JtLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICB0aGlzLm9wdGlvbnMuZm9ybVN0ZXBDbGFzc1xuICAgICk7XG4gICAgdGhpcy5zdGVwTGVuZ3RoID0gdGhpcy5mb3JtU3RlcHMubGVuZ3RoO1xuICAgIHRoaXMubm92YWxpZGF0ZSA9IHRoaXMuZm9ybS5nZXRBdHRyaWJ1dGUoXCJub3ZhbGlkYXRlXCIpICE9PSBudWxsO1xuICAgIHRoaXMuZXJyb3JzID0ge307XG5cbiAgICBpZiAodGhpcy5mb3JtU3RlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgXCJZb3VyIGZvcm0gaGFzIG5vIHN0ZXAgZGVmaW5lZCBieSBjbGFzczogXCIgKyB0aGlzLm9wdGlvbnMuZm9ybVN0ZXBDbGFzc1xuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRpYWwoKTtcbiAgICB0aGlzLnNob3dGaXJzdCgpO1xuICB9XG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9maXhPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRHZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN1Ym1pdEZ1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuIHx8IHRoaXMuX2RlZmF1bHRTdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biB8fCB0aGlzLl9kZWZhdWx0U2hvd0Z1bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuIHx8IHRoaXMuX2RlZmF1bHRIaWRlRnVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnZhbGlkYXRlRnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy52YWxpZGF0ZUZ1biB8fCB0aGlzLl9kZWZhdWx0VmFsaWRhdGVGdW4uYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuYWZ0ZXJMYXN0U3RlcCA9XG4gICAgICB0aGlzLm9wdGlvbnMuYWZ0ZXJMYXN0U3RlcCB8fCB0aGlzLl9hZnRlckxhc3RTdGVwLmJpbmQodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5faW5pdGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gSGlkZSBhbGxcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuZm9ybVN0ZXBzLmxlbmd0aDsgeCsrKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaGlkZUZ1bih0aGlzLmZvcm1TdGVwc1t4XSk7XG4gICAgfVxuXG4gICAgYWx0ZXJTdWJtaXRCdG4odGhpcy5mb3JtLCB0aGlzLm9wdGlvbnMuYWx0ZXJTdWJtaXRCdG4sIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNlbGYuc2hvd05leHQoKTtcbiAgICB9KTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc3VibWl0RnVuKCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRWYWxpZGF0ZUZ1biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBlbGVtZW50LnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG4gIH07XG4gIC8qKiByZXBvcnQgdmFsaWRpdHkgb2YgdGhlIGVsZW1lbnQsIGl0IHJ1bnMgdGhlIGBvcHRpb25zLnZhbGlkYXRlRnVuYCBvbiBhbGwgZWxlbWVudCB3aXRoIGBvcHRpb25zLnZhbGlkYXRhYmxlVGFnc2AgJiBhbHNvIHRoZSBgb3B0aW9ucy5leHRyYXZhbGlkYXRvcnNgXG4gICAqIEBwYXJhbSB7Kn0gZWxlIHRoZSBlbGVtZW50IHRvIHZhbGlkYXRlLlxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIG5vIGVycm9yc1xuICAgKi9cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3JlcG9ydFZhbGlkaXR5ID0gZnVuY3Rpb24gKGVsZSkge1xuICAgIGZ1bmN0aW9uIGNhbGxFeHRyYVZhbGlkYXRvcihfZWxlbWVudCwgdmFsaWRhdG9ycykge1xuICAgICAgaWYgKFxuICAgICAgICBfZWxlbWVudCA9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIF9lbGVtZW50LmdldEF0dHJpYnV0ZSA9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgIHZhbGlkYXRvcnMgPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgaWQgPSBfZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIGlmIChpZCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1tpZF07XG4gICAgICBpZiAodmFsaWRhdG9yID09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxpZGF0b3IoX2VsZW1lbnQpO1xuICAgIH1cbiAgICB2YXIgcnYgPSB0cnVlO1xuICAgIHZhciB2YWxpZGF0YWJsZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3B0aW9ucy52YWxpZGF0YWJsZVRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBxdWVyeVN0cmluZyA9XG4gICAgICAgIHRoaXMub3B0aW9ucy52YWxpZGF0YWJsZVRhZ3NbaV0gKyBcIltuYW1lXTpub3QoW2Zvcm1ub3ZhbGlkYXRlXSlcIjtcbiAgICAgIGVsZS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5U3RyaW5nKS5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhbGlkYXRhYmxlcy5wdXNoKGUpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB2YWxpZGF0YWJsZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbSA9IHZhbGlkYXRhYmxlc1tpbmRleF07XG4gICAgICB2YXIgbmFtZSA9IGVsZW0uZ2V0QXR0cmlidXRlKFwibmFtZVwiKTtcbiAgICAgIHZhciBpc1ZhbGlkID0gdHJ1ZTtcbiAgICAgIGlzVmFsaWQgPSB0aGlzLm9wdGlvbnMudmFsaWRhdGVGdW4oZWxlbSk7XG4gICAgICBpc1ZhbGlkID1cbiAgICAgICAgaXNWYWxpZCAmJiBjYWxsRXh0cmFWYWxpZGF0b3IoZWxlbSwgdGhpcy5vcHRpb25zLmV4dHJhVmFsaWRhdG9ycyk7XG4gICAgICBpZiAoaXNWYWxpZCkge1xuICAgICAgICBkZWxldGUgdGhpcy5lcnJvcnNbbmFtZV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdmFsaWRhdGlvbk9iaiA9IGVsZW0udmFsaWRpdHk7XG4gICAgICAgIHZhbGlkYXRpb25PYmoudmFsaWRhdGlvbk1lc3NhZ2UgPSBlbGVtLnZhbGlkYXRpb25NZXNzYWdlO1xuICAgICAgICB0aGlzLmVycm9yc1tuYW1lXSA9IHZhbGlkYXRpb25PYmo7XG4gICAgICB9XG4gICAgICBydiA9IHJ2ICYmIGlzVmFsaWQ7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fdHJ5VG9WYWxpZGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5ub3ZhbGlkYXRlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRTdGVwID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudmFsaWRhdGVFYWNoU3RlcCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVwb3J0VmFsaWRpdHkodGhpcy5mb3JtU3RlcHNbY3VycmVudFN0ZXBdKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNMYXN0U3RlcCgpKSB7XG4gICAgICAvLyBpZiBgb3B0aW9ucy52YWxpZGF0ZUVhY2hTdGVwYCBpcyBgZmFsc2VgLCB3ZSBzaG91bGQgcnVuIHZhbGlkYXRpb24gYXQgbGVhc3Qgb25lIHRpbWUgYmVmb3Igc3VibWl0LlxuICAgICAgLy8gaWYgdGhlcmUgaXMgZXJyb3IgaW4gdmFsaWRhdGlvbiwgd2Ugc2hvdWxkbid0IHN1Ym1pdC5cbiAgICAgIHJldHVybiB0aGlzLnJlcG9ydFZhbGlkaXR5KHRoaXMuZm9ybSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fbW92ZVRvID0gZnVuY3Rpb24gKHRhcmdldFN0ZXApIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgZmlndXJlIG91dCB3aGljaCBmb3JtLXN0ZXAgdG8gZGlzcGxheVxuICAgIGlmICh0YXJnZXRTdGVwIDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFN0ZXAgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgLy8gRXhpdCB0aGUgZnVuY3Rpb24gaWYgYW55IGZpZWxkIGluIHRoZSBjdXJyZW50IGZvcm0tc3RlcCBpcyBpbnZhbGlkOlxuICAgIC8vIGFuZCB3YW50cyB0byBnbyBuZXh0XG4gICAgaWYgKHRhcmdldFN0ZXAgPiBjdXJyZW50U3RlcCAmJiAhdGhpcy50cnlUb1ZhbGlkYXRlKCkpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub25pbnZhbGlkICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmludmFsaWQoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gaWYgeW91IGhhdmUgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBmb3JtLi4uXG4gICAgaWYgKHRhcmdldFN0ZXAgPiBjdXJyZW50U3RlcCAmJiB0aGlzLmlzTGFzdFN0ZXAoKSkge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hZnRlckxhc3RTdGVwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50U3RlcCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRTdGVwICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW2N1cnJlbnRTdGVwXSk7XG4gICAgICAgIGNhbGwodGhpcy5vcHRpb25zLm9uU3RlcEhpZGUsIGN1cnJlbnRTdGVwKTtcbiAgICAgIH1cbiAgICAgIC8vIFNob3cgY3VycmVudFxuICAgICAgdGhpcy5vcHRpb25zLnNob3dGdW4odGhpcy5mb3JtU3RlcHNbdGFyZ2V0U3RlcF0pO1xuICAgICAgLy8gc3RvcmUgdGhlIGNvcnJlY3QgY3VycmVudFN0ZXBcbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwKHRhcmdldFN0ZXApO1xuICAgICAgY2FsbCh0aGlzLm9wdGlvbnMub25TdGVwU2hvd24sIHRhcmdldFN0ZXApO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgdGhpcy5tb3ZlVG8oY3VycmVudCArIDEpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93Rmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tb3ZlVG8oMCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIHRoaXMubW92ZVRvKGN1cnJlbnQgLSAxKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZ2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0R2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN0ZXA7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICB0aGlzLmN1cnJlbnRTdGVwID0gc3RlcDtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZvcm0uc3VibWl0KCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0SGlkZUZ1biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTaG93RnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2lzTGFzdFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpID09PSB0aGlzLnN0ZXBMZW5ndGggLSAxO1xuICB9O1xuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fYWZ0ZXJMYXN0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdWJtaXQoKTtcbiAgfTtcblxuICByZXR1cm4gTXVsdGlTdGVwRm9ybTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRNU0Y7XG4iLCIvKipcbiAqIGdlbmVyYXRlIHVuaXF1ZSBpZFxuICovXG5mdW5jdGlvbiBndWlkKCkge1xuICBmdW5jdGlvbiBzNCgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgIC50b1N0cmluZygxNilcbiAgICAgIC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgZnVuY3Rpb24gX2d1aWQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIF9ndWlkKCk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHtcbiAgICAgIC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBuZXh0U291cmNlKSB7XG4gICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0bztcbn1cblxuZnVuY3Rpb24gc2ltaWxhcml0eVNjb3JlKHN0ciwgc3RyaW5nLCBzbGljZSkge1xuICBpZiAoc2xpY2UgPT09IHVuZGVmaW5lZCB8fCBzbGljZSA9PT0gbnVsbCkge1xuICAgIHNsaWNlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghc2xpY2UpIHtcbiAgICBzdHIgPSBzdHIudHJpbSgpO1xuICAgIHN0cmluZyA9IHN0cmluZy50cmltKCk7XG4gIH1cblxuICBzdHIgPSBzdHIudG9Mb3dlckNhc2UoKTtcblxuICBzdHJpbmcgPSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblxuICBmdW5jdGlvbiBlcXVhbHMoczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxID09IHMyO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9TdWJzdHJpbmdzKHMpIHtcbiAgICB2YXIgc3Vic3RycyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgc3Vic3Rycy5wdXNoKHMuc2xpY2UoaW5kZXgsIHMubGVuZ3RoKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJzdHJzO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJhY3Rpb24oczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aCAvIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmIChlcXVhbHMoc3RyLCBzdHJpbmcpKSB7XG4gICAgc2NvcmUgPSAxMDA7XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29yZSA9IDA7XG4gICAgdmFyIGluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc3RyKTtcbiAgICB2YXIgZiA9IGZyYWN0aW9uKHN0ciwgc3RyaW5nKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIC8vIHN0cmF0c1dpdGggKClcbiAgICAgIHNjb3JlID0gZiAqIDEwMDtcbiAgICB9XG4gICAgLy8gY29udGFpbnMoKVxuICAgIGVsc2UgaWYgKGluZGV4ICE9IC0xKSB7XG4gICAgICBzY29yZSA9IGYgKiAoKHN0cmluZy5sZW5ndGggLSBpbmRleCkgLyBzdHJpbmcubGVuZ3RoKSAqIDEwMDtcbiAgICB9XG5cbiAgICAvL1xuICAgIGlmICghc2xpY2UpIHtcbiAgICAgIHJldHVybiBzY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN1YnN0cnMgPSB0b1N1YnN0cmluZ3Moc3RyKTtcbiAgICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHN1YnN0cnMubGVuZ3RoIC0gMTsgaW5kZXgyKyspIHtcbiAgICAgICAgdmFyIHN1YnNjb3JlID0gc2ltaWxhcml0eVNjb3JlKHN1YnN0cnNbaW5kZXgyXSwgc3RyaW5nLCBmYWxzZSk7XG4gICAgICAgIHNjb3JlID0gc2NvcmUgKyBzdWJzY29yZSAvIHN1YnN0cnMubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2NvcmU7IC8vIC8gc3Vic3Rycy5sZW5ndGhcbiAgICB9XG4gIH1cbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ3VpZDogZ3VpZCxcbiAgYXNzaWduOiBhc3NpZ24sXG4gIHNpbWlsYXJpdHlTY29yZTogc2ltaWxhcml0eVNjb3JlLFxufTtcbiJdfQ==

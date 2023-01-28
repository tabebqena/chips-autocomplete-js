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
   * @property {function} defaults.submitOnEnd  - * whether to submit the form if showNext is called on the last step or not.
   * This will be beneficial if you have "alterSubmitBtn='next'"
   * If this option is `false` (default) & the `showNext()` method called, exception will be thrown.
   * @property {function} defaults.alterSubmitBtn  - * If you create submit button in your form, You should specify valid value for this option.
   * Choices are: 'next', null, 'hide'
   * - next: means that clicking the submit button will show the next step.
   * - hide: means that the submit button will be hidden
   * - null: the submit button will be left unchaged.
   * @property {object} defaults.extraValidators  - *  this object map form field id to a single function that should validate it.
      the function will recieve the HTMLElement as single argument & should return `true`
      if validation success or `false` if failed.
  * @property {array} defaults.noValidate  -list of element id`s that will escape from validation.
  * @property {function } defaults.validateFun  - * The usual validator function that should run on all elements that thir id`s not in `noValidate`
   * This function recieves the element to validate.
   * default is `element.reportValidity()`
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
    submitOnEnd: false,
    extraValidators: {},
    noValidate: [],
    validatableTags: ["input", "select", "textarea"],
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

    this.options = this.fixOptions(options);
    this.formSteps = this.form.getElementsByClassName(
      this.options.formStepClass
    );
    this.stepLength = this.formSteps.length;

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

  MultiStepForm.prototype._reportValidity = function (ele) {
    // report validity of the current step & its children

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
      var elems = ele.querySelectorAll(this.options.validatableTags[i]);
      for (var i2 = 0; i2 < elems.length; i2++) {
        validatables.push(elems[i2]);
      }
    }
    for (var index = 0; index < validatables.length; index++) {
      var elem = validatables[index];
      rv = rv && callExtraValidator(elem, this.options.extraValidators);
      if (this.options.noValidate.indexOf(elem.getAttribute("id")) === -1) {
        rv = rv && this.options.validateFun(elem);
      }
    }

    return rv;
  };

  MultiStepForm.prototype._moveTo = function (targetStep) {
    // This function will figure out which form-step to display
    if (targetStep < 0) {
      return false;
    }
    var currentStep = this.getCurrentStep();
    // Exit the function if any field in the current form-step is invalid:
    // and wants to go next
    if (
      targetStep > currentStep &&
      !this.reportValidity(this.formSteps[currentStep])
    )
      return false;
    // if you have reached the end of the form...
    if (targetStep >= this.stepLength) {
      if (this.options.submitOnEnd) {
        return this.submit();
      } else {
        throw Error(
          "Nothing to do, This is the last step & you pass `options.submitOnEnd`== false"
        );
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgZ3VpZCA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmd1aWQ7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBzaW1pbGFyaXR5U2NvcmUgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5zaW1pbGFyaXR5U2NvcmU7XG5cbmZ1bmN0aW9uIGluaUF1dG9jb21wbGV0ZSgpIHtcbiAgdmFyIERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBmaWx0ZXI6IGZpbHRlcixcblxuICAgIGV4dHJhY3RWYWx1ZTogX2V4dHJhY3RWYWx1ZSxcbiAgICBzb3J0OiBudWxsLFxuICAgIGRyb3BEb3duQ2xhc3NlczogW1wiZHJvcGRvd25cIl0sXG4gICAgZHJvcERvd25JdGVtQ2xhc3NlczogW10sXG4gICAgZHJvcERvd25UYWc6IFwiZGl2XCIsXG4gICAgaGlkZUl0ZW06IGhpZGVJdGVtLFxuICAgIHNob3dJdGVtOiBzaG93SXRlbSxcbiAgICBzaG93TGlzdDogc2hvd0xpc3QsXG4gICAgaGlkZUxpc3Q6IGhpZGVMaXN0LFxuICAgIG9uSXRlbVNlbGVjdGVkOiBvbkl0ZW1TZWxlY3RlZCxcbiAgICBhY3RpdmVDbGFzczogXCJhY3RpdmVcIixcbiAgICBpc1Zpc2libGU6IGlzVmlzaWJsZSxcbiAgICBvbkxpc3RJdGVtQ3JlYXRlZDogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBpc1Zpc2libGUoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBvbkl0ZW1TZWxlY3RlZChpbnB1dCwgaXRlbSwgaHRtbEVsZW1lbnQsIGF1dGNvbXBsZXRlKSB7XG4gICAgaW5wdXQudmFsdWUgPSBpdGVtLnRleHQ7XG4gICAgYXV0Y29tcGxldGUuaGlkZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0xpc3QobCkge1xuICAgIGwuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTGlzdChsKSB7XG4gICAgbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlSXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIGZ1bmN0aW9uIHNvcnQodmFsdWUsIGRhdGEpIHtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9leHRyYWN0VmFsdWUob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdC50ZXh0IHx8IG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcih2YWx1ZSwgZGF0YSwgZXh0cmFjdFZhbHVlKSB7XG4gICAgaWYgKGV4dHJhY3RWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGV4dHJhY3RWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgZXh0cmFjdFZhbHVlID0gX2V4dHJhY3RWYWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgc2NvcmVzID0ge307XG4gICAgdmFyIF9kYXRhID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgaXRlbVZhbHVlID0gZXh0cmFjdFZhbHVlKGRhdGFbaW5kZXhdKTtcbiAgICAgIHZhciBzY29yZSA9IHNpbWlsYXJpdHlTY29yZSh2YWx1ZSwgaXRlbVZhbHVlKTtcbiAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgX2RhdGEucHVzaChkYXRhW2luZGV4XSk7XG4gICAgICAgIHNjb3Jlc1tpdGVtVmFsdWVdID0gc2NvcmU7XG4gICAgICB9XG4gICAgfVxuICAgIF9kYXRhID0gX2RhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgdmFyIHNjb3JlQSA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYSldO1xuICAgICAgdmFyIHNjb3JlQiA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYildO1xuICAgICAgcmV0dXJuIHNjb3JlQiAtIHNjb3JlQTtcbiAgICB9KTtcbiAgICByZXR1cm4gX2RhdGE7XG4gIH1cblxuICAvLyBnZW5lcmF0ZSB1bmlxdWUgaWRcblxuICBmdW5jdGlvbiBBdXRvY29tcGxldGUoaW5wdXQsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5maXhEYXRhKGRhdGEpO1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gLTE7XG5cbiAgICB0aGlzLmRyb3Bkb3duSXRlbXMgPSBbXTtcblxuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9PUFRJT05TLCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLnBhcmVudE5vZGUgPSBpbnB1dC5wYXJlbnROb2RlO1xuICAgIHRoaXMuY3JlYXRlTGlzdCA9IHRoaXMuX2NyZWF0ZUxpc3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNyZWF0ZUl0ZW0gPSB0aGlzLl9jcmVhdGVJdGVtLmJpbmQodGhpcyk7XG4gICAgdGhpcy51cGRhdGVEYXRhID0gdGhpcy5fdXBkYXRlRGF0YS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvdyA9IHRoaXMuX3Nob3cuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhpZGUgPSB0aGlzLl9oaWRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5maWx0ZXIgPSB0aGlzLl9maWx0ZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNvcnQgPSB0aGlzLl9zb3J0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5hY3RpdmF0ZU5leHQgPSB0aGlzLl9hY3RpdmF0ZU5leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFjdGl2YXRlUHJldiA9IHRoaXMuX2FjdGl2YXRlUHJldi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2VsZWN0QWN0aXZlID0gdGhpcy5fc2VsZWN0QWN0aXZlLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcnMgPSB0aGlzLl9zZXR1cF9saXN0ZW5lcnM7XG4gICAgdGhpcy5saXN0ID0gdGhpcy5jcmVhdGVMaXN0KCk7XG4gICAgdGhpcy5oaWRlKCk7XG4gICAgdGhpcy5zZXR1cExpc3RlbmVycygpO1xuICB9XG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuZml4RGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IGRhdGFbaW5kZXhdO1xuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZWxlbWVudCA9IHsgdGV4dDogZWxlbWVudCB9O1xuICAgICAgfVxuICAgICAgZWxlbWVudC5fdWlkID0gZ3VpZCgpO1xuICAgICAgcnYucHVzaChlbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NldHVwX2xpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBpbnB1dCA9IHNlbGYuaW5wdXQ7XG4gICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgfVxuICAgICAgc2VsZi5maWx0ZXIoaW5wdXQudmFsdWUpO1xuICAgICAgc2VsZi5zb3J0KGlucHV0LnZhbHVlKTtcbiAgICAgIHNlbGYuc2hvdygpO1xuICAgIH0pO1xuXG4gICAgLypleGVjdXRlIGEgZnVuY3Rpb24gcHJlc3NlcyBhIGtleSBvbiB0aGUga2V5Ym9hcmQ6Ki9cbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIXNlbGYuaXNTaG93bikge1xuICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gNDApIHtcbiAgICAgICAgLy8gZG93biBrZXlcbiAgICAgICAgc2VsZi5hY3RpdmF0ZU5leHQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM4KSB7XG4gICAgICAgIC8vIHVwIGtleVxuICAgICAgICBzZWxmLmFjdGl2YXRlUHJldigpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgc2VsZi5zZWxlY3RBY3RpdmUoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDI3KSB7XG4gICAgICAgIC8vIGVzY2FwZVxuICAgICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl91cGRhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmZpeERhdGEoZGF0YSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdEl0ZW0gPSAwO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmZpbHRlcmVkLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGh0bWxFbGVtZW50ID0gdGhpcy5kcm9wZG93bkl0ZW1zW3RoaXMuZmlsdGVyZWRbaW5kZXhdLl91aWRdO1xuICAgICAgaWYgKGh0bWxFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRpb25zLnNob3dJdGVtKGh0bWxFbGVtZW50KTtcbiAgICAgIHRoaXMubGlzdC5pbnNlcnRCZWZvcmUoaHRtbEVsZW1lbnQsIHRoaXMubGlzdC5jaGlsZHJlbltsYXN0SXRlbV0pO1xuICAgICAgbGFzdEl0ZW0rKztcbiAgICB9XG5cbiAgICBmb3IgKGluZGV4ID0gbGFzdEl0ZW07IGluZGV4IDwgdGhpcy5saXN0LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaW5kZXhdO1xuICAgICAgdGhpcy5vcHRpb25zLmhpZGVJdGVtKGNoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2hvd0xpc3QodGhpcy5saXN0KTtcbiAgICB0aGlzLmlzU2hvd24gPSB0cnVlO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2ZpbHRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5maWx0ZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5maWx0ZXIoXG4gICAgICAgIHZhbHVlLFxuICAgICAgICB0aGlzLmRhdGEsXG4gICAgICAgIHRoaXMub3B0aW9ucy5leHRyYWN0VmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NvcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNvcnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5zb3J0KHZhbHVlLCB0aGlzLmZpbHRlcmVkKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fY3JlYXRlTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5vcHRpb25zLmRyb3BEb3duVGFnKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb25zLmRyb3BEb3duQ2xhc3Nlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGEuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuZHJvcERvd25DbGFzc2VzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gdGhpcy5kYXRhW2ldO1xuICAgICAgdmFyIGIgPSB0aGlzLmNyZWF0ZUl0ZW0oaXRlbSk7XG4gICAgICBhLmFwcGVuZENoaWxkKGIpO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChhKTtcbiAgICByZXR1cm4gYTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9jcmVhdGVJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAvKmNyZWF0ZSBhIERJViBlbGVtZW50IGZvciBlYWNoIG1hdGNoaW5nIGVsZW1lbnQ6Ki9cbiAgICB2YXIgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgIC8qbWFrZSB0aGUgbWF0Y2hpbmcgbGV0dGVycyBib2xkOiovXG5cbiAgICB2YXIgdGV4dCA9IGl0ZW0udGV4dDtcbiAgICB2YXIgX3VpZCA9IGl0ZW0uX3VpZDtcblxuICAgIGh0bWxFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICB2YXIgYXR0cnMgPSBpdGVtLmF0dHJzIHx8IHt9O1xuICAgIHZhciBhdHRyc0tleXMgPSBPYmplY3Qua2V5cyhhdHRycyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBhdHRyc0tleXNbaW5kZXhdO1xuICAgICAgdmFyIHZhbCA9IGF0dHJzW2tleV07XG4gICAgICBodG1sRWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIH1cblxuICAgIGZvciAoXG4gICAgICB2YXIgaW5kZXgyID0gMDtcbiAgICAgIGluZGV4MiA8IHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzLmxlbmd0aDtcbiAgICAgIGluZGV4MisrXG4gICAgKSB7XG4gICAgICBodG1sRWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzW2luZGV4Ml0pO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcGRvd25JdGVtc1tfdWlkXSA9IGh0bWxFbGVtZW50O1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGh0bWxFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgc2VsZi5vcHRpb25zLm9uSXRlbVNlbGVjdGVkKHNlbGYuaW5wdXQsIGl0ZW0sIGh0bWxFbGVtZW50LCBzZWxmKTtcbiAgICB9KTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZCAhPT0gbnVsbCAmJlxuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkICE9PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZChodG1sRWxlbWVudCwgaXRlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh0bWxFbGVtZW50O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlQ2xvc2VzdCA9IGZ1bmN0aW9uIChpbmRleCwgZGlyKSB7XG4gICAgZm9yICh2YXIgaSA9IGluZGV4OyBpIDwgdGhpcy5saXN0LmNoaWxkTm9kZXMubGVuZ3RoOyApIHtcbiAgICAgIHZhciBlID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaV07XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlzVmlzaWJsZShlKSkge1xuICAgICAgICBlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2RlYWN0aXZhdGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFsbCA9IHRoaXMubGlzdC5xdWVyeVNlbGVjdG9yQWxsKFwiLlwiICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYWxsLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgYWxsW2luZGV4XS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWFjdGl2YXRlQWxsKCk7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50Kys7XG4gICAgdGhpcy5fYWN0aXZhdGVDbG9zZXN0KHRoaXMuYWN0aXZlRWxlbWVudCwgMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQtLTtcbiAgICB0aGlzLl9hY3RpdmF0ZUNsb3Nlc3QodGhpcy5hY3RpdmVFbGVtZW50LCAtMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2VsZWN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY3RpdmUgPSB0aGlzLmxpc3QucXVlcnlTZWxlY3RvcihcIi5cIiArIHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgaWYgKGFjdGl2ZSAhPT0gbnVsbCAmJiBhY3RpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWN0aXZlLmNsaWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2hpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVMaXN0KHRoaXMubGlzdCk7XG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2U7XG4gIH07XG5cbiAgcmV0dXJuIEF1dG9jb21wbGV0ZTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaUF1dG9jb21wbGV0ZTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGd1aWQgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ndWlkO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuXG5mdW5jdGlvbiBpbml0Q2hpcHMoKSB7XG4gIHZhciBERUZBVUxUX1NFVFRJTkdTID0ge1xuICAgIGNyZWF0ZUlucHV0OiB0cnVlLFxuICAgIGNoaXBzQ2xhc3M6IFwiY2hpcHNcIixcbiAgICBjaGlwQ2xhc3M6IFwiY2hpcFwiLFxuICAgIGNsb3NlQ2xhc3M6IFwiY2hpcC1jbG9zZVwiLFxuICAgIGNoaXBJbnB1dENsYXNzOiBcImNoaXAtaW5wdXRcIixcbiAgICBpbWFnZVdpZHRoOiA5NixcbiAgICBpbWFnZUhlaWdodDogOTYsXG4gICAgY2xvc2U6IHRydWUsXG4gICAgb25jbGljazogbnVsbCxcbiAgICBvbmNsb3NlOiBudWxsLFxuICAgIG9uY2hhbmdlOiBudWxsLFxuICB9O1xuXG4gIHZhciBjaGlwRGF0YSA9IHtcbiAgICBfdWlkOiBudWxsLFxuICAgIHRleHQ6IFwiXCIsXG4gICAgaW1nOiBcIlwiLFxuICAgIGF0dHJzOiB7XG4gICAgICB0YWJpbmRleDogXCIwXCIsXG4gICAgfSxcbiAgICBjbG9zZUNsYXNzZXM6IG51bGwsXG4gICAgY2xvc2VIVE1MOiBudWxsLFxuICAgIG9uY2xpY2s6IG51bGwsXG4gICAgb25jbG9zZTogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBjcmVhdGVDaGlsZCh0YWcsIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIHBhcmVudCkge1xuICAgIHZhciBlbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgdmFyIGF0dHJzS2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhdHRyc0tleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBlbGUuc2V0QXR0cmlidXRlKGF0dHJzS2V5c1tpbmRleF0sIGF0dHJpYnV0ZXNbYXR0cnNLZXlzW2luZGV4XV0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBjbGFzc0luZGV4ID0gMDsgY2xhc3NJbmRleCA8IGNsYXNzZXMubGVuZ3RoOyBjbGFzc0luZGV4KyspIHtcbiAgICAgIHZhciBrbHMgPSBjbGFzc2VzW2NsYXNzSW5kZXhdO1xuICAgICAgZWxlLmNsYXNzTGlzdC5hZGQoa2xzKTtcbiAgICB9XG4gICAgaWYgKHBhcmVudCAhPT0gdW5kZWZpbmVkICYmIHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVsZSk7XG4gICAgfVxuICAgIHJldHVybiBlbGU7XG4gIH1cblxuICAvKipcbiAgICogX2NyZWF0ZV9jaGlwLCBUaGlzIGlzIGFuIGludGVybmFsIGZ1bmN0aW9uLCBhY2Nlc3NlZCBieSB0aGUgQ2hpcHMuX2FkZENoaXAgbWV0aG9kXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSBUaGUgY2hpcCBkYXRhIHRvIGNyZWF0ZSxcbiAgICogQHJldHVybnMgSFRNTEVsZW1lbnRcbiAgICovXG4gIGZ1bmN0aW9uIF9jcmVhdGVDaGlwKGRhdGEpIHtcbiAgICBkYXRhID0gYXNzaWduKHt9LCBjaGlwRGF0YSwgZGF0YSk7XG4gICAgdmFyIGF0dHJzID0gYXNzaWduKGRhdGEuYXR0cnMsIHsgXCJjaGlwLWlkXCI6IGRhdGEuX3VpZCB9KTtcbiAgICB2YXIgY2hpcCA9IGNyZWF0ZUNoaWxkKFwiZGl2XCIsIGF0dHJzLCBbXCJjaGlwXCJdLCBudWxsKTtcblxuICAgIGZ1bmN0aW9uIGNsb3NlQ2FsbGJhY2soZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGRhdGEub25jbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGlja0NhbGxiYWNrKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpZiAoZGF0YS5vbmNsaWNrICE9PSBudWxsICYmIGRhdGEub25jbGljayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRhdGEub25jbGljayhlLCBjaGlwLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGF0YS5pbWFnZSkge1xuICAgICAgY3JlYXRlQ2hpbGQoXG4gICAgICAgIFwiaW1nXCIsXG4gICAgICAgIHtcbiAgICAgICAgICB3aWR0aDogZGF0YS5pbWFnZVdpZHRoIHx8IDk2LFxuICAgICAgICAgIGhlaWdodDogZGF0YS5pbWFnZUhlaWdodCB8fCA5NixcbiAgICAgICAgICBzcmM6IGRhdGEuaW1hZ2UsXG4gICAgICAgIH0sXG4gICAgICAgIFtdLFxuICAgICAgICBjaGlwLFxuICAgICAgICB7fVxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGRhdGEudGV4dCkge1xuICAgICAgdmFyIHNwYW4gPSBjcmVhdGVDaGlsZChcInNwYW5cIiwge30sIFtdLCBjaGlwLCB7fSk7XG4gICAgICBzcGFuLmlubmVySFRNTCA9IGRhdGEudGV4dDtcbiAgICB9XG4gICAgaWYgKGRhdGEuY2xvc2UpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gZGF0YS5jbG9zZUNsYXNzZXMgfHwgW1wiY2hpcC1jbG9zZVwiXTtcbiAgICAgIHZhciBjbG9zZVNwYW4gPSBjcmVhdGVDaGlsZChcbiAgICAgICAgXCJzcGFuXCIsXG4gICAgICAgIHt9LCAvLyBpZDogZGF0YS5jbG9zZUlkXG4gICAgICAgIGNsYXNzZXMsXG4gICAgICAgIGNoaXAsXG4gICAgICAgIHt9XG4gICAgICApO1xuXG4gICAgICBjbG9zZVNwYW4uaW5uZXJIVE1MID0gZGF0YS5jbG9zZUhUTUwgfHwgXCImdGltZXNcIjtcbiAgICAgIGlmIChkYXRhLm9uY2xvc2UgIT09IG51bGwgJiYgZGF0YS5vbmNsb3NlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvc2VTcGFuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY2hpcC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xpY2tDYWxsYmFjayk7XG5cbiAgICByZXR1cm4gY2hpcDtcbiAgfVxuXG4gIGZ1bmN0aW9uIENoaXBzKGVsZW1lbnQsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMuZGF0YSA9IGRhdGEgfHwgW107XG4gICAgdGhpcy5fZGF0YSA9IFtdO1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5jaGlwc0NsYXNzKTtcblxuICAgIHRoaXMuX3NldEVsZW1lbnRMaXN0ZW5lcnMoKTtcbiAgICB0aGlzLmlucHV0ID0gdGhpcy5fc2V0SW5wdXQoKTtcbiAgICB0aGlzLmFkZENoaXAgPSB0aGlzLl9hZGRDaGlwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVDaGlwID0gdGhpcy5fcmVtb3ZlQ2hpcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0RGF0YSA9IHRoaXMuX2dldERhdGEuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuc2V0QXV0b2NvbXBsZXRlID0gdGhpcy5fc2V0QXV0b2NvbXBsZXRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZW5kZXIgPSB0aGlzLl9yZW5kZXIuYmluZCh0aGlzKTtcblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBDaGlwcy5wcm90b3R5cGUuX2dldERhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG8gPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhW2luZGV4XSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2RhdGFbaW5kZXhdICE9PSBudWxsKSB7XG4gICAgICAgIHZhciB1aWQgPSB0aGlzLl9kYXRhW2luZGV4XS5fdWlkO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXS5fdWlkID09PSB1aWRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG8ucHVzaCh0aGlzLmRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbztcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3JlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdGhpcy5kYXRhW2luZGV4XS5faW5kZXggPSBpbmRleDtcbiAgICAgIHRoaXMuYWRkQ2hpcCh0aGlzLmRhdGFbaW5kZXhdKTtcbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRBdXRvY29tcGxldGUgPSBmdW5jdGlvbiAoYXV0b2NvbXBsZXRlT2JqKSB7XG4gICAgdGhpcy5vcHRpb25zLmF1dG9jb21wbGV0ZSA9IGF1dG9jb21wbGV0ZU9iajtcbiAgfTtcblxuICAvKipcbiAgICogYWRkIGNoaXAgdG8gZWxlbWVudCBieSBwYXNzZWQgZGF0YVxuICAgKiBAcGFyYW0geyp9IGRhdGEgY2hpcCBkYXRhLCBQbGVhc2Ugc2VlIGBjaGlwRGF0YWAgZG9jdW1uZXRhdGlvbnMuXG4gICAqL1xuICBDaGlwcy5wcm90b3R5cGUuX2FkZENoaXAgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIC8vIGdldCBpbnB1dCBlbGVtZW50XG4gICAgdmFyIGRpc3REYXRhID0gYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMsIGNoaXBEYXRhLCBkYXRhKTtcbiAgICBkYXRhID0gYXNzaWduKFxuICAgICAgeyBvbmNsaWNrOiB0aGlzLm9wdGlvbnMub25jbGljaywgb25jbG9zZTogdGhpcy5vcHRpb25zLm9uY2xvc2UgfSxcbiAgICAgIGRhdGFcbiAgICApO1xuXG4gICAgaWYgKGRhdGEuX3VpZCA9PT0gdW5kZWZpbmVkIHx8IGRhdGEuX3VpZCA9PT0gbnVsbCkge1xuICAgICAgdmFyIHVpZCA9IGd1aWQoKTtcbiAgICAgIGRhdGEuX3VpZCA9IHVpZDtcbiAgICAgIGRpc3REYXRhLl91aWQgPSB1aWQ7XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRpc3REYXRhLm9uY2xpY2sgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGlzdERhdGEpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUNoaXBDbGljay5hcHBseShzZWxmLCBbZSwgY2hpcCwgZGF0YV0pO1xuICAgIH07XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBkaXN0RGF0YS5vbmNsb3NlID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRpc3REYXRhKSB7XG4gICAgICBzZWxmLl9oYW5kbGVDaGlwQ2xvc2UuYXBwbHkoc2VsZiwgW2UsIGNoaXAsIGRhdGFdKTtcbiAgICB9O1xuXG4gICAgdmFyIGNoaXAgPSBfY3JlYXRlQ2hpcChkaXN0RGF0YSk7XG4gICAgdmFyIGlucHV0ID0gdGhpcy5pbnB1dDtcbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH0gZWxzZSBpZiAoaW5wdXQucGFyZW50RWxlbWVudCA9PT0gdGhpcy5lbGVtZW50KSB7XG4gICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoaXAsIGlucHV0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaXApO1xuICAgIH1cbiAgICAvLyBBdm9pZCBpbmZpbnRlIGxvb3AsIGlmIHJlY3Vyc3NpdmVseSBhZGQgZGF0YSB0byB0aGUgdGhpcy5kYXRhIHdoaWxlIHJlbmRlciBpcyB0ZXJhdGluZ1xuICAgIC8vIG92ZXIgaXQuXG4gICAgaWYgKGRhdGEuX2luZGV4ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5faW5kZXggIT09IG51bGwpIHtcbiAgICAgIHZhciBpbmRleCA9IGRhdGEuX2luZGV4O1xuICAgICAgZGVsZXRlIGRhdGEuX2luZGV4O1xuICAgICAgdGhpcy5kYXRhW2luZGV4XSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGEucHVzaChkaXN0RGF0YSk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gbnVsbCAmJiB0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlKHRoaXMuZ2V0RGF0YSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaW5wdXQgIT09IG51bGwgJiYgdGhpcy5vcHRpb25zLmlucHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5wdXRzID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc1xuICAgICAgKTtcbiAgICAgIGlmIChpbnB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgICBpbnB1dCA9IGlucHV0c1swXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jcmVhdGVJbnB1dCkge1xuICAgICAgICAvLyBjcmVhdGUgaW5wdXQgYW5kIGFwcGVuZCB0byBlbGVtZW50XG4gICAgICAgIGlucHV0ID0gY3JlYXRlQ2hpbGQoXG4gICAgICAgICAgXCJpbnB1dFwiLFxuICAgICAgICAgIHsgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciB8fCBcIlwiIH0sXG4gICAgICAgICAgW3RoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc10sXG4gICAgICAgICAgdGhpcy5lbGVtZW50XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBzZXQgZXZlbnQgbGlzdGVuZXJcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNvdXRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJmb2N1c1wiKTtcbiAgICB9KTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c2luXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZm9jdXNcIik7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgLy8gZW50ZXJcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIC8vIE92ZXJyaWRlIGVudGVyIGlmIGF1dG9jb21wbGV0aW5nLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUuaXNTaG93blxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgc2VsZi5hZGRDaGlwKHtcbiAgICAgICAgICAgIHRleHQ6IGlucHV0LnZhbHVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEVsZW1lbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5pbnB1dC5mb2N1cygpO1xuICAgIH0pO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoc2VsZi5vcHRpb25zLmNoaXBDbGFzcykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZS5rZXlDb2RlID09PSA4IHx8IGUua2V5Q29kZSA9PT0gNDYpIHtcbiAgICAgICAgc2VsZi5faGFuZGxlQ2hpcERlbGV0ZShlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xpY2sgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGUudGFyZ2V0LmZvY3VzKCk7XG4gICAgaWYgKGRhdGEub25jbGljayAhPT0gdW5kZWZpbmVkICYmIGRhdGEub25jbGljayAhPT0gbnVsbCkge1xuICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2RlbGV0ZUNoaXBEYXRhID0gZnVuY3Rpb24gKHVpZCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHVpZCA9PT0gdGhpcy5fZGF0YVtpbmRleF0uX3VpZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW2luZGV4XTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGlmICh0aGlzLl9kZWxldGVDaGlwRGF0YShkYXRhLl91aWQpKSB7XG4gICAgICBjaGlwLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpcCk7XG4gICAgICBpZiAoZGF0YS5vbmNsb3NlICE9PSB1bmRlZmluZWQgJiYgZGF0YS5vbmNsb3NlICE9PSBudWxsKSB7XG4gICAgICAgIGRhdGEub25jbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICAgIH1cbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSBudWxsICYmXG4gICAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlKHRoaXMuZ2V0RGF0YSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW1vdmVDaGlwID0gZnVuY3Rpb24gKGNoaXBJZCkge1xuICAgIHZhciBjaGlwID0gbnVsbDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICBlbGVtZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZWxlbWVudCAhPT0gbnVsbCAmJlxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLm9wdGlvbnMuY2hpcENsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZShcImNoaXAtaWRcIikgPT09IGNoaXBJZCkge1xuICAgICAgICAgIGNoaXAgPSBlbGVtZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4MisrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpbmRleDJdO1xuICAgICAgaWYgKGl0ZW0gIT09IHVuZGVmaW5lZCAmJiBpdGVtICE9PSBudWxsICYmIGl0ZW0uX3VpZCA9PT0gY2hpcElkKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShudWxsLCBjaGlwLCBpdGVtKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcERlbGV0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGNoaXAgPSBlLnRhcmdldDtcbiAgICB2YXIgY2hpcElkID0gY2hpcC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpO1xuICAgIGlmIChjaGlwSWQgPT09IHVuZGVmaW5lZCB8fCBjaGlwSWQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKFwiWW91ICBzaG91bGQgcHJvdmlkZSBjaGlwSWRcIik7XG4gICAgfVxuICAgIHZhciBkYXRhID0ge307XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5kYXRhW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5fdWlkID09PSBjaGlwSWRcbiAgICAgICkge1xuICAgICAgICBkYXRhID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5faGFuZGxlQ2hpcENsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IEVycm9yKFwiY2FuJ3QgZmluZCBkYXRhIHdpdGggaWQ6IFwiICsgY2hpcElkLCB0aGlzLmRhdGEpO1xuICB9O1xuXG4gIHJldHVybiBDaGlwcztcbn1cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2hpcHM7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdENoaXBzID0gcmVxdWlyZShcIi4vY2hpcHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdEF1dG9jb21wbGV0ZSA9IHJlcXVpcmUoXCIuL2F1dG9jb21wbGV0ZVwiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbnRNU0YgPSByZXF1aXJlKFwiLi9tc2ZcIik7XG5cbnZhciBqdWlzID0ge307XG5qdWlzLkNoaXBzID0gaW5pdENoaXBzKCk7XG5qdWlzLkF1dG9jb21wbGV0ZSA9IGluaXRBdXRvY29tcGxldGUoKTtcbmp1aXMuTXVsdGlTdGVwRm9ybSA9IGludE1TRigpO1xuanVpcy5NU0YgPSBqdWlzLk11bHRpU3RlcEZvcm07XG5cbmlmICh3aW5kb3cgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgd2luZG93Lmp1aXMgPSBqdWlzIHx8IHt9O1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGp1aXM7XG4iLCIvKipcbiAqIEBuYW1lc3BhY2UgbXNmXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcblxuLyoqXG4gKiBpbml0IG11bHRpIHN0ZXAgZm9ybVxuICogQG1lbWJlcm9mIG1zZlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge0VsZW1lbnR9ICAtIHRoZSBmb3JtIEhUTUxFbGVtZW50XG4gKiBAcGFyYW0ge29iamVjdH0gLSB0aGUgb3B0aW9ucyB7QGxpbmsgbXNmLmRlZmF1bHRzfVxuICogQHJldHVybiB7bXNmLk11bHRpU3RlcEZvcm19XG4gKi9cbmZ1bmN0aW9uIGluaXRNU0YoKSB7XG4gIC8qKiBkZWZhdWx0cyBcbiAgICogQG1lbWJlcm9mIG1zZlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gIGRlZmF1bHRzLmZvcm1TdGVwQ2xhc3MgICAgICAgICAtIHRoZSBjbGFzcyBuYW1lIHRoYXQgaWRlbnRpZnkgdGhlIGZvcm0gc3RlcCBlbGVtZW50XG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259ICBkZWZhdWx0cy5nZXRDdXJyZW50U3RlcCAgICAgIC0gZnVuY3Rpb24gdG8gZ2V0IHRoZSBjdXJyZW50IHN0ZXAsIGl0IHNob3VsZCByZXR1cm4gYGludGBcbiAgICAgLSBkZWFmdWx0IGlzIHRoZSBgTXVsdGlTdGVwRm9ybS5fZGVmYXVsdEdldEN1cnJlbnRTdGVwYCB0aGF0IHJldHVybnMgYE11bHRpU3RlcEZvcm0uY3VycmVudFN0ZXBgIHByb3BlcnR5LlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSAgZGVmYXVsdHMuc3RvcmVDdXJyZW50U3RlcCAgLSBTdG9yZSB0aGUgY3VycmVudCBzdGVwIHZhbHVlLlxuICAgICAtIGRlZmF1bHQgaXMgYE11bHRpU3RlcEZvcm0uX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwYCB0aGF0IHN0b3JlcyB0aGUgdmFsdWUgaW4gdGhlIGBNdWx0aVN0ZXBGb3JtLmN1dXJlbnRTdGVwYFxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5vblN0ZXBTaG93biAgLSBmdW5jdGlvbiB0aGF0IGNhbGxlZCBhZnRlciB0aGUgc3RlcCBzaG93biwgcmVjaWV2ZXMgdGhlIHNob3duIHN0ZXAgaW5kZXguXG4gICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGRlZmF1bHRzLm9uU3RlcEhpZGUgICAtIGZ1bmN0aW9uIHRoYXQgY2FsbGVkIGFmdGVyIHRoZSBzdGVwIGhpZGRlbiwgcmVjaWV2ZXMgdGhlIGhpZGRlbiBzdGVwIGluZGV4LlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5oaWRlRnVuICAtIFRoZSBmdW5jdGlvbiB0aGF0IGFjdHVhbGx5IGhpZGUgc3RlcCBlbGVtZXRzLCByZWNpZXZlcyB0aGUgSFRNTCBlbGVtZW50IGFzIHNpbmdsZSBwYXJhbWV0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBkZWZhdWx0IGFjdGlvbiBpcyBkb25lIGJ5IGFwcGx5aW5nIFwiZGlzcGxheTonbm9uZSdcIlwiICBcbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gZGVmYXVsdHMuc2hvd0Z1biAtICBUaGUgZnVuY3Rpb24gdGhhdCBhY3R1YWxseSBzaG93IHN0ZXAgZWxlbWV0cywgcmVjaWV2ZXMgdGhlIEhUTUwgZWxlbWVudCBhcyBzaW5nbGUgcGFyYW1ldGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gZGVmYXVsdCBhY3Rpb24gaXMgZG9uZSBieSBhcHBseWluZyBcImRpc3BsYXk6J2Jsb2NrJ1wiXCJcbiAgICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24gfSBkZWZhdWx0cy5zdWJtaXRGdW4gICAtICBUaGUgZnVuY3Rpb24gdGhhdCBhY3V0dWFsbHkgc3VibWl0IHRoZSBmb3JtIGFmdGVyIHRoZSBsYXN0IHN0ZXAuXG4gICAtIEl0IHJlY2lldmVzIG5vIHBhcmFtZXRlcnMuXG4gICAtIGRlZmF1bHQgaXMgYGZvcm0uc3VibWl0KClgIFxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5zdWJtaXRPbkVuZCAgLSAqIHdoZXRoZXIgdG8gc3VibWl0IHRoZSBmb3JtIGlmIHNob3dOZXh0IGlzIGNhbGxlZCBvbiB0aGUgbGFzdCBzdGVwIG9yIG5vdC5cbiAgICogVGhpcyB3aWxsIGJlIGJlbmVmaWNpYWwgaWYgeW91IGhhdmUgXCJhbHRlclN1Ym1pdEJ0bj0nbmV4dCdcIlxuICAgKiBJZiB0aGlzIG9wdGlvbiBpcyBgZmFsc2VgIChkZWZhdWx0KSAmIHRoZSBgc2hvd05leHQoKWAgbWV0aG9kIGNhbGxlZCwgZXhjZXB0aW9uIHdpbGwgYmUgdGhyb3duLlxuICAgKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBkZWZhdWx0cy5hbHRlclN1Ym1pdEJ0biAgLSAqIElmIHlvdSBjcmVhdGUgc3VibWl0IGJ1dHRvbiBpbiB5b3VyIGZvcm0sIFlvdSBzaG91bGQgc3BlY2lmeSB2YWxpZCB2YWx1ZSBmb3IgdGhpcyBvcHRpb24uXG4gICAqIENob2ljZXMgYXJlOiAnbmV4dCcsIG51bGwsICdoaWRlJ1xuICAgKiAtIG5leHQ6IG1lYW5zIHRoYXQgY2xpY2tpbmcgdGhlIHN1Ym1pdCBidXR0b24gd2lsbCBzaG93IHRoZSBuZXh0IHN0ZXAuXG4gICAqIC0gaGlkZTogbWVhbnMgdGhhdCB0aGUgc3VibWl0IGJ1dHRvbiB3aWxsIGJlIGhpZGRlblxuICAgKiAtIG51bGw6IHRoZSBzdWJtaXQgYnV0dG9uIHdpbGwgYmUgbGVmdCB1bmNoYWdlZC5cbiAgICogQHByb3BlcnR5IHtvYmplY3R9IGRlZmF1bHRzLmV4dHJhVmFsaWRhdG9ycyAgLSAqICB0aGlzIG9iamVjdCBtYXAgZm9ybSBmaWVsZCBpZCB0byBhIHNpbmdsZSBmdW5jdGlvbiB0aGF0IHNob3VsZCB2YWxpZGF0ZSBpdC5cbiAgICAgIHRoZSBmdW5jdGlvbiB3aWxsIHJlY2lldmUgdGhlIEhUTUxFbGVtZW50IGFzIHNpbmdsZSBhcmd1bWVudCAmIHNob3VsZCByZXR1cm4gYHRydWVgXG4gICAgICBpZiB2YWxpZGF0aW9uIHN1Y2Nlc3Mgb3IgYGZhbHNlYCBpZiBmYWlsZWQuXG4gICogQHByb3BlcnR5IHthcnJheX0gZGVmYXVsdHMubm9WYWxpZGF0ZSAgLWxpc3Qgb2YgZWxlbWVudCBpZGBzIHRoYXQgd2lsbCBlc2NhcGUgZnJvbSB2YWxpZGF0aW9uLlxuICAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb24gfSBkZWZhdWx0cy52YWxpZGF0ZUZ1biAgLSAqIFRoZSB1c3VhbCB2YWxpZGF0b3IgZnVuY3Rpb24gdGhhdCBzaG91bGQgcnVuIG9uIGFsbCBlbGVtZW50cyB0aGF0IHRoaXIgaWRgcyBub3QgaW4gYG5vVmFsaWRhdGVgXG4gICAqIFRoaXMgZnVuY3Rpb24gcmVjaWV2ZXMgdGhlIGVsZW1lbnQgdG8gdmFsaWRhdGUuXG4gICAqIGRlZmF1bHQgaXMgYGVsZW1lbnQucmVwb3J0VmFsaWRpdHkoKWBcbiAgICovXG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBmb3JtU3RlcENsYXNzOiBcImZvcm0tc3RlcFwiLFxuICAgIGdldEN1cnJlbnRTdGVwOiBudWxsLFxuICAgIHN0b3JlQ3VycmVudFN0ZXA6IG51bGwsXG4gICAgb25TdGVwU2hvd246IG51bGwsXG4gICAgb25TdGVwSGlkZTogbnVsbCxcbiAgICBoaWRlRnVuOiBudWxsLFxuICAgIHNob3dGdW46IG51bGwsXG4gICAgc3VibWl0RnVuOiBudWxsLFxuICAgIGFsdGVyU3VibWl0QnRuOiBudWxsLCAvLyBbICduZXh0JywgJ251bGwnLiBudWxsLCAnaGlkZSddXG4gICAgc3VibWl0T25FbmQ6IGZhbHNlLFxuICAgIGV4dHJhVmFsaWRhdG9yczoge30sXG4gICAgbm9WYWxpZGF0ZTogW10sXG4gICAgdmFsaWRhdGFibGVUYWdzOiBbXCJpbnB1dFwiLCBcInNlbGVjdFwiLCBcInRleHRhcmVhXCJdLFxuICAgIHZhbGlkYXRlRnVuOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNhbGwoZm4pIHtcbiAgICBpZiAoZm4gPT09IHVuZGVmaW5lZCB8fCBmbiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH1cblxuICBmdW5jdGlvbiBhbHRlclN1Ym1pdEJ0bihmb3JtLCBzdHJhdGVneSwgY2FsbGJhY2spIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IG51bGwgfHwgc3RyYXRlZ3kgPT09IFwibnVsbFwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBpbnB1dEVsZW1lbnRzID0gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpO1xuICAgIHZhciBidXR0b25FbGVtZW50cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIik7XG4gICAgdmFyIHN1Ym1pdEJ0biA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgaW5wdXRFbGVtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmIChpbnB1dEVsZW1lbnRzW2luZGV4XS5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpID09IFwic3VibWl0XCIpIHtcbiAgICAgICAgc3VibWl0QnRuID0gaW5wdXRFbGVtZW50c1tpbmRleF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3VibWl0QnRuID09IHVuZGVmaW5lZCkge1xuICAgICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgYnV0dG9uRWxlbWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGlmIChidXR0b25FbGVtZW50c1tpbmRleF0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSA9PSBcInN1Ym1pdFwiKSB7XG4gICAgICAgICAgc3VibWl0QnRuID0gYnV0dG9uRWxlbWVudHNbaW5kZXhdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdHJhdGVneSA9PSBcIm5leHRcIikge1xuICAgICAgaWYgKHN1Ym1pdEJ0biAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VibWl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG4gICAgICAgIHN1Ym1pdEJ0bi5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHN0cmF0ZWd5ID09IFwiaGlkZVwiKSB7XG4gICAgICBzdWJtaXRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBNdWx0aVN0ZXBGb3JtXG4gICAqIEBjbGFzc1xuICAgKiBAbWVtYmVyb2YgbXNmXG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZm9ybSB0aGUgZm9ybSBlbGVtZW50XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIG9wdGlvbnMsIHNlZSBge0BsaW5rIG1zZi5kZWZhdWx0c31gIGRvY3VtZW50YXRpb25zLlxuICAgKiBAcHJvcGVydHkge251bWJlcn0gY3VycmVudFN0ZXAgLSB0aGUgY3VycmVudCBzdGVwXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IHN1Ym1pdCAtIFRoZSBzdWJtaXQgbWV0aG9kXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IG1vdmVUbyAtIG1vdmUgdG8gbWV0aG9kLCBhY2NlcHQgdGhlIHN0ZXAgaW5kZXggdG8gbW92ZSB0byBpdC5cbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gc2hvd05leHQgLSBtb3ZlIHRvIHRoZSBuZXh0IHN0ZXAuXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IHNob3dQcmV2IC0gbW92ZSB0byB0aGUgcHJldmlvdXMgc3RlcC5cbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gc2hvd0ZpcnN0IC0gbW92ZSB0byB0aGUgZmlyc3Qgc3RlcC5cbiAgICogQHByb3BlcnR5IHtGdW5jdGlvbn0gZ2V0Q3VycmVudFN0ZXAgLSByZXR1cm5zIHRoZSBjdXJyZW50IHN0ZXAgaW5kZXguXG4gICAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGlzTGFzdFN0ZXAgLSByZXR1cm5zIGB0cnVlYCBpZiB0aGUgY3VycmVudCBzdGVwIGlzIHRoZSBsYXN0IG9uZS5cbiAgICovXG4gIGZ1bmN0aW9uIE11bHRpU3RlcEZvcm0oZm9ybSwgb3B0aW9ucykge1xuICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgdGhpcy5jdXJyZW50U3RlcCA9IDA7XG4gICAgdGhpcy5pbml0aWFsID0gdGhpcy5faW5pdGlhbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc3VibWl0ID0gdGhpcy5fc3VibWl0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXBvcnRWYWxpZGl0eSA9IHRoaXMuX3JlcG9ydFZhbGlkaXR5LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tb3ZlVG8gPSB0aGlzLl9tb3ZlVG8uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dOZXh0ID0gdGhpcy5fc2hvd05leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dQcmV2ID0gdGhpcy5fc2hvd1ByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dGaXJzdCA9IHRoaXMuX3Nob3dGaXJzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0Q3VycmVudFN0ZXAgPSB0aGlzLl9nZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaXNMYXN0U3RlcCA9IHRoaXMuX2lzTGFzdFN0ZXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLmZpeE9wdGlvbnMgPSB0aGlzLl9maXhPcHRpb25zLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLmZpeE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5mb3JtU3RlcHMgPSB0aGlzLmZvcm0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgKTtcbiAgICB0aGlzLnN0ZXBMZW5ndGggPSB0aGlzLmZvcm1TdGVwcy5sZW5ndGg7XG5cbiAgICBpZiAodGhpcy5mb3JtU3RlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgXCJZb3VyIGZvcm0gaGFzIG5vIHN0ZXAgZGVmaW5lZCBieSBjbGFzczogXCIgKyB0aGlzLm9wdGlvbnMuZm9ybVN0ZXBDbGFzc1xuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRpYWwoKTtcbiAgICB0aGlzLnNob3dGaXJzdCgpO1xuICB9XG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9maXhPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRHZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN1Ym1pdEZ1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuIHx8IHRoaXMuX2RlZmF1bHRTdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biB8fCB0aGlzLl9kZWZhdWx0U2hvd0Z1bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuIHx8IHRoaXMuX2RlZmF1bHRIaWRlRnVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnZhbGlkYXRlRnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy52YWxpZGF0ZUZ1biB8fCB0aGlzLl9kZWZhdWx0VmFsaWRhdGVGdW4uYmluZCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9pbml0aWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBIaWRlIGFsbFxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5mb3JtU3RlcHMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW3hdKTtcbiAgICB9XG5cbiAgICBhbHRlclN1Ym1pdEJ0bih0aGlzLmZvcm0sIHRoaXMub3B0aW9ucy5hbHRlclN1Ym1pdEJ0biwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2VsZi5zaG93TmV4dCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4oKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFZhbGlkYXRlRnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGVsZW1lbnQucmVwb3J0VmFsaWRpdHkoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fcmVwb3J0VmFsaWRpdHkgPSBmdW5jdGlvbiAoZWxlKSB7XG4gICAgLy8gcmVwb3J0IHZhbGlkaXR5IG9mIHRoZSBjdXJyZW50IHN0ZXAgJiBpdHMgY2hpbGRyZW5cblxuICAgIGZ1bmN0aW9uIGNhbGxFeHRyYVZhbGlkYXRvcihfZWxlbWVudCwgdmFsaWRhdG9ycykge1xuICAgICAgaWYgKFxuICAgICAgICBfZWxlbWVudCA9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIF9lbGVtZW50LmdldEF0dHJpYnV0ZSA9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgIHZhbGlkYXRvcnMgPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgaWQgPSBfZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIGlmIChpZCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1tpZF07XG4gICAgICBpZiAodmFsaWRhdG9yID09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxpZGF0b3IoX2VsZW1lbnQpO1xuICAgIH1cblxuICAgIHZhciBydiA9IHRydWU7XG4gICAgdmFyIHZhbGlkYXRhYmxlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnZhbGlkYXRhYmxlVGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGVsZW1zID0gZWxlLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLnZhbGlkYXRhYmxlVGFnc1tpXSk7XG4gICAgICBmb3IgKHZhciBpMiA9IDA7IGkyIDwgZWxlbXMubGVuZ3RoOyBpMisrKSB7XG4gICAgICAgIHZhbGlkYXRhYmxlcy5wdXNoKGVsZW1zW2kyXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB2YWxpZGF0YWJsZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbSA9IHZhbGlkYXRhYmxlc1tpbmRleF07XG4gICAgICBydiA9IHJ2ICYmIGNhbGxFeHRyYVZhbGlkYXRvcihlbGVtLCB0aGlzLm9wdGlvbnMuZXh0cmFWYWxpZGF0b3JzKTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMubm9WYWxpZGF0ZS5pbmRleE9mKGVsZW0uZ2V0QXR0cmlidXRlKFwiaWRcIikpID09PSAtMSkge1xuICAgICAgICBydiA9IHJ2ICYmIHRoaXMub3B0aW9ucy52YWxpZGF0ZUZ1bihlbGVtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcnY7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX21vdmVUbyA9IGZ1bmN0aW9uICh0YXJnZXRTdGVwKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiB3aWxsIGZpZ3VyZSBvdXQgd2hpY2ggZm9ybS1zdGVwIHRvIGRpc3BsYXlcbiAgICBpZiAodGFyZ2V0U3RlcCA8IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnRTdGVwID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIC8vIEV4aXQgdGhlIGZ1bmN0aW9uIGlmIGFueSBmaWVsZCBpbiB0aGUgY3VycmVudCBmb3JtLXN0ZXAgaXMgaW52YWxpZDpcbiAgICAvLyBhbmQgd2FudHMgdG8gZ28gbmV4dFxuICAgIGlmIChcbiAgICAgIHRhcmdldFN0ZXAgPiBjdXJyZW50U3RlcCAmJlxuICAgICAgIXRoaXMucmVwb3J0VmFsaWRpdHkodGhpcy5mb3JtU3RlcHNbY3VycmVudFN0ZXBdKVxuICAgIClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICAvLyBpZiB5b3UgaGF2ZSByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIGZvcm0uLi5cbiAgICBpZiAodGFyZ2V0U3RlcCA+PSB0aGlzLnN0ZXBMZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3VibWl0T25FbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VibWl0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBcIk5vdGhpbmcgdG8gZG8sIFRoaXMgaXMgdGhlIGxhc3Qgc3RlcCAmIHlvdSBwYXNzIGBvcHRpb25zLnN1Ym1pdE9uRW5kYD09IGZhbHNlXCJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGN1cnJlbnRTdGVwICE9PSB1bmRlZmluZWQgJiYgY3VycmVudFN0ZXAgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmhpZGVGdW4odGhpcy5mb3JtU3RlcHNbY3VycmVudFN0ZXBdKTtcbiAgICAgICAgY2FsbCh0aGlzLm9wdGlvbnMub25TdGVwSGlkZSwgY3VycmVudFN0ZXApO1xuICAgICAgfVxuICAgICAgLy8gU2hvdyBjdXJyZW50XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1bih0aGlzLmZvcm1TdGVwc1t0YXJnZXRTdGVwXSk7XG4gICAgICAvLyBzdG9yZSB0aGUgY29ycmVjdCBjdXJyZW50U3RlcFxuICAgICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAodGFyZ2V0U3RlcCk7XG4gICAgICBjYWxsKHRoaXMub3B0aW9ucy5vblN0ZXBTaG93biwgdGFyZ2V0U3RlcCk7XG4gICAgfVxuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93TmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3VycmVudCA9IHRoaXMuZ2V0Q3VycmVudFN0ZXAoKTtcbiAgICB0aGlzLm1vdmVUbyhjdXJyZW50ICsgMSk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dGaXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm1vdmVUbygwKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd1ByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgdGhpcy5tb3ZlVG8oY3VycmVudCAtIDEpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9nZXRDdXJyZW50U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwKCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRHZXRDdXJyZW50U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RlcDtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFN0b3JlQ3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgIHRoaXMuY3VycmVudFN0ZXAgPSBzdGVwO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0U3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZm9ybS5zdWJtaXQoKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRIaWRlRnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFNob3dGdW4gPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5faXNMYXN0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwKCkgPT09IHRoaXMuc3RlcExlbmd0aCAtIDE7XG4gIH07XG5cbiAgcmV0dXJuIE11bHRpU3RlcEZvcm07XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0TVNGO1xuIiwiLyoqXG4gKiBnZW5lcmF0ZSB1bmlxdWUgaWRcbiAqL1xuZnVuY3Rpb24gZ3VpZCgpIHtcbiAgZnVuY3Rpb24gczQoKSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApXG4gICAgICAudG9TdHJpbmcoMTYpXG4gICAgICAuc3Vic3RyaW5nKDEpO1xuICB9XG4gIGZ1bmN0aW9uIF9ndWlkKCkge1xuICAgIHJldHVybiAoXG4gICAgICBzNCgpICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBzNCgpICtcbiAgICAgIHM0KClcbiAgICApO1xuICB9XG4gIHJldHVybiBfZ3VpZCgpO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHZhckFyZ3MpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgIC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3RcIik7XG4gIH1cblxuICB2YXIgdG8gPSBPYmplY3QodGFyZ2V0KTtcbiAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdG87XG59XG5cbmZ1bmN0aW9uIHNpbWlsYXJpdHlTY29yZShzdHIsIHN0cmluZywgc2xpY2UpIHtcbiAgaWYgKHNsaWNlID09PSB1bmRlZmluZWQgfHwgc2xpY2UgPT09IG51bGwpIHtcbiAgICBzbGljZSA9IHRydWU7XG4gIH1cblxuICBpZiAoIXNsaWNlKSB7XG4gICAgc3RyID0gc3RyLnRyaW0oKTtcbiAgICBzdHJpbmcgPSBzdHJpbmcudHJpbSgpO1xuICB9XG5cbiAgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XG5cbiAgc3RyaW5nID0gc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG5cbiAgZnVuY3Rpb24gZXF1YWxzKHMxLCBzMikge1xuICAgIHJldHVybiBzMSA9PSBzMjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvU3Vic3RyaW5ncyhzKSB7XG4gICAgdmFyIHN1YnN0cnMgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHN1YnN0cnMucHVzaChzLnNsaWNlKGluZGV4LCBzLmxlbmd0aCkpO1xuICAgIH1cbiAgICByZXR1cm4gc3Vic3RycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZyYWN0aW9uKHMxLCBzMikge1xuICAgIHJldHVybiBzMS5sZW5ndGggLyBzMi5sZW5ndGg7XG4gIH1cblxuICBpZiAoZXF1YWxzKHN0ciwgc3RyaW5nKSkge1xuICAgIHNjb3JlID0gMTAwO1xuICAgIHJldHVybiBzY29yZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcmUgPSAwO1xuICAgIHZhciBpbmRleCA9IHN0cmluZy5pbmRleE9mKHN0cik7XG4gICAgdmFyIGYgPSBmcmFjdGlvbihzdHIsIHN0cmluZyk7XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAvLyBzdHJhdHNXaXRoICgpXG4gICAgICBzY29yZSA9IGYgKiAxMDA7XG4gICAgfVxuICAgIC8vIGNvbnRhaW5zKClcbiAgICBlbHNlIGlmIChpbmRleCAhPSAtMSkge1xuICAgICAgc2NvcmUgPSBmICogKChzdHJpbmcubGVuZ3RoIC0gaW5kZXgpIC8gc3RyaW5nLmxlbmd0aCkgKiAxMDA7XG4gICAgfVxuXG4gICAgLy9cbiAgICBpZiAoIXNsaWNlKSB7XG4gICAgICByZXR1cm4gc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzdWJzdHJzID0gdG9TdWJzdHJpbmdzKHN0cik7XG4gICAgICBmb3IgKHZhciBpbmRleDIgPSAwOyBpbmRleDIgPCBzdWJzdHJzLmxlbmd0aCAtIDE7IGluZGV4MisrKSB7XG4gICAgICAgIHZhciBzdWJzY29yZSA9IHNpbWlsYXJpdHlTY29yZShzdWJzdHJzW2luZGV4Ml0sIHN0cmluZywgZmFsc2UpO1xuICAgICAgICBzY29yZSA9IHNjb3JlICsgc3Vic2NvcmUgLyBzdWJzdHJzLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjb3JlOyAvLyAvIHN1YnN0cnMubGVuZ3RoXG4gICAgfVxuICB9XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGd1aWQ6IGd1aWQsXG4gIGFzc2lnbjogYXNzaWduLFxuICBzaW1pbGFyaXR5U2NvcmU6IHNpbWlsYXJpdHlTY29yZSxcbn07XG4iXX0=

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
    // Avoid infinte loop, if recurssively add data to thethis.data while render is terating
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
      this.options.onchange(this.data);
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
        this.options.onchange(this.data);
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
/*
To use this multi step form
- divide your form into steps, each one is a HTMLElement with `form-step` 
  class (You can customize this by `options.formStepClass`).
- Avoid creating "submit btn" inside the form.
- If you create submit button. give one of the valid alterSubmitBtn strategies. Valid values include [null, 'next', 'hide']
  Default is `next`, This means that, The submit button `onclick` & `onsubmit` events will work as `showNext()`
- Use the external API:
  var msf = toMultiStepForm(form);
  msf.showFirst();
  msf.showNext();
  msf.showPrev();
  msf.moveTo();
  
- Listen to events:
  options.onStepShown() // receives msf as first argument & step index as second argument.
  options.onStepHide() // receives msf as first argument & step index as second argument.

- Customize how your form steps are defined:
  By default, each form step should have `form-step` class, You can provide your 
  custom class by `options.formStepClass`

- Customize the element show & hide methods:
  options.hideFun() // recrives msf as first argument & the element to hide as second one.
  options.showFun() // receives msf as first argument & the element to show as second one.
  By default, We toggle the element.style.display attribute, 'none' || 'block'

- Customize the way to store & get the current step :
  options.getCurrentStep() // receives msf as first argument.
  options.storeCurrentStep() // receives msf as first argument and the current step index as second one.
  This functions are useful if you want to store step index somewhere like: session, query strings etc.

- Customize the form submit:
  - toggle submit form on the last step:
    options.submitOnEnd  // default is true which means that the msf will submit the form after the last step.
    options.submitFun()  // The function to be executed as the form submission function. It recieves the msf as first 
                         // argument & you can acccess the form element by `msf.form`.
                         // By default, We use `form.submit()`
                         // But you can change this if you need. For example:. show message before or submit by `ajax`.
  
- Provide extra form validators:
  - `options.extravalidators` : this object map form field id to a single function that should validate it.
                                the function will recieve the HTMLElement as single argument & should return `true`
                                if validation success or `false` if failed.
  */

// eslint-disable-next-line no-undef
var assign = require("./utils").assign;

function initMSF() {
  var DEFAULT = {
    formStepClass: "form-step",
    //
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

  function MultiStepForm(form, options) {
    this.form = form;
    this.options = this._fixOptions(options);
    this.formSteps = this.form.getElementsByClassName(
      this.options.formStepClass
    );
    this.stepLength = this.formSteps.length;

    if (this.formSteps.length === 0) {
      throw Error(
        "Your form has no step defined by class: " + this.options.formStepClass
      );
    }
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

    this.initial();
    this.showFirst();
  }

  MultiStepForm.prototype._fixOptions = function (options) {
    options = options || {};
    this.options = assign({}, DEFAULT, options);
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

  MultiStepForm.prototype._reportValidity = function (ele) {
    // report validity of the current step & its children
    var rv = true;

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

    for (var i = 0; i < ele.childNodes.length; i++) {
      var child = ele.childNodes[i];
      rv =
        rv &&
        this.reportValidity(child) &&
        callExtraValidator(child, this.options.extraValidators);
    }
    if (ele.reportValidity != undefined) {
      rv =
        rv &&
        ele.reportValidity() &&
        callExtraValidator(ele, this.options.extraValidators);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBndWlkID0gcmVxdWlyZShcIi4vdXRpbHNcIikuZ3VpZDtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIHNpbWlsYXJpdHlTY29yZSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLnNpbWlsYXJpdHlTY29yZTtcblxuZnVuY3Rpb24gaW5pQXV0b2NvbXBsZXRlKCkge1xuICB2YXIgREVGQVVMVF9PUFRJT05TID0ge1xuICAgIGZpbHRlcjogZmlsdGVyLFxuXG4gICAgZXh0cmFjdFZhbHVlOiBfZXh0cmFjdFZhbHVlLFxuICAgIHNvcnQ6IG51bGwsXG4gICAgZHJvcERvd25DbGFzc2VzOiBbXCJkcm9wZG93blwiXSxcbiAgICBkcm9wRG93bkl0ZW1DbGFzc2VzOiBbXSxcbiAgICBkcm9wRG93blRhZzogXCJkaXZcIixcbiAgICBoaWRlSXRlbTogaGlkZUl0ZW0sXG4gICAgc2hvd0l0ZW06IHNob3dJdGVtLFxuICAgIHNob3dMaXN0OiBzaG93TGlzdCxcbiAgICBoaWRlTGlzdDogaGlkZUxpc3QsXG4gICAgb25JdGVtU2VsZWN0ZWQ6IG9uSXRlbVNlbGVjdGVkLFxuICAgIGFjdGl2ZUNsYXNzOiBcImFjdGl2ZVwiLFxuICAgIGlzVmlzaWJsZTogaXNWaXNpYmxlLFxuICAgIG9uTGlzdEl0ZW1DcmVhdGVkOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzVmlzaWJsZShlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uSXRlbVNlbGVjdGVkKGlucHV0LCBpdGVtLCBodG1sRWxlbWVudCwgYXV0Y29tcGxldGUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IGl0ZW0udGV4dDtcbiAgICBhdXRjb21wbGV0ZS5oaWRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93TGlzdChsKSB7XG4gICAgbC5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVMaXN0KGwpIHtcbiAgICBsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVJdGVtKGUpIHtcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJdGVtKGUpIHtcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgZnVuY3Rpb24gc29ydCh2YWx1ZSwgZGF0YSkge1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgZnVuY3Rpb24gX2V4dHJhY3RWYWx1ZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0LnRleHQgfHwgb2JqZWN0O1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyKHZhbHVlLCBkYXRhLCBleHRyYWN0VmFsdWUpIHtcbiAgICBpZiAoZXh0cmFjdFZhbHVlID09PSB1bmRlZmluZWQgfHwgZXh0cmFjdFZhbHVlID09PSBudWxsKSB7XG4gICAgICBleHRyYWN0VmFsdWUgPSBfZXh0cmFjdFZhbHVlO1xuICAgIH1cblxuICAgIHZhciBzY29yZXMgPSB7fTtcbiAgICB2YXIgX2RhdGEgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBpdGVtVmFsdWUgPSBleHRyYWN0VmFsdWUoZGF0YVtpbmRleF0pO1xuICAgICAgdmFyIHNjb3JlID0gc2ltaWxhcml0eVNjb3JlKHZhbHVlLCBpdGVtVmFsdWUpO1xuICAgICAgaWYgKHNjb3JlID4gMCkge1xuICAgICAgICBfZGF0YS5wdXNoKGRhdGFbaW5kZXhdKTtcbiAgICAgICAgc2NvcmVzW2l0ZW1WYWx1ZV0gPSBzY29yZTtcbiAgICAgIH1cbiAgICB9XG4gICAgX2RhdGEgPSBfZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICB2YXIgc2NvcmVBID0gc2NvcmVzW2V4dHJhY3RWYWx1ZShhKV07XG4gICAgICB2YXIgc2NvcmVCID0gc2NvcmVzW2V4dHJhY3RWYWx1ZShiKV07XG4gICAgICByZXR1cm4gc2NvcmVCIC0gc2NvcmVBO1xuICAgIH0pO1xuICAgIHJldHVybiBfZGF0YTtcbiAgfVxuXG4gIC8vIGdlbmVyYXRlIHVuaXF1ZSBpZFxuXG4gIGZ1bmN0aW9uIEF1dG9jb21wbGV0ZShpbnB1dCwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmZpeERhdGEoZGF0YSk7XG4gICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMuZGF0YTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQgPSAtMTtcblxuICAgIHRoaXMuZHJvcGRvd25JdGVtcyA9IFtdO1xuXG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMucGFyZW50Tm9kZSA9IGlucHV0LnBhcmVudE5vZGU7XG4gICAgdGhpcy5jcmVhdGVMaXN0ID0gdGhpcy5fY3JlYXRlTGlzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY3JlYXRlSXRlbSA9IHRoaXMuX2NyZWF0ZUl0ZW0uYmluZCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZURhdGEgPSB0aGlzLl91cGRhdGVEYXRhLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zaG93ID0gdGhpcy5fc2hvdy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGlkZSA9IHRoaXMuX2hpZGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmZpbHRlciA9IHRoaXMuX2ZpbHRlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc29ydCA9IHRoaXMuX3NvcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFjdGl2YXRlTmV4dCA9IHRoaXMuX2FjdGl2YXRlTmV4dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWN0aXZhdGVQcmV2ID0gdGhpcy5fYWN0aXZhdGVQcmV2LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZWxlY3RBY3RpdmUgPSB0aGlzLl9zZWxlY3RBY3RpdmUuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlO1xuXG4gICAgdGhpcy5zZXR1cExpc3RlbmVycyA9IHRoaXMuX3NldHVwX2xpc3RlbmVycztcbiAgICB0aGlzLmxpc3QgPSB0aGlzLmNyZWF0ZUxpc3QoKTtcbiAgICB0aGlzLmhpZGUoKTtcbiAgICB0aGlzLnNldHVwTGlzdGVuZXJzKCk7XG4gIH1cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5maXhEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gZGF0YVtpbmRleF07XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbGVtZW50ID0geyB0ZXh0OiBlbGVtZW50IH07XG4gICAgICB9XG4gICAgICBlbGVtZW50Ll91aWQgPSBndWlkKCk7XG4gICAgICBydi5wdXNoKGVsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2V0dXBfbGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGlucHV0ID0gc2VsZi5pbnB1dDtcbiAgICAgIGlmIChzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICB9XG4gICAgICBzZWxmLmZpbHRlcihpbnB1dC52YWx1ZSk7XG4gICAgICBzZWxmLnNvcnQoaW5wdXQudmFsdWUpO1xuICAgICAgc2VsZi5zaG93KCk7XG4gICAgfSk7XG5cbiAgICAvKmV4ZWN1dGUgYSBmdW5jdGlvbiBwcmVzc2VzIGEga2V5IG9uIHRoZSBrZXlib2FyZDoqL1xuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICghc2VsZi5pc1Nob3duKSB7XG4gICAgICAgIHNlbGYuc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKGUua2V5Q29kZSA9PSA0MCkge1xuICAgICAgICAvLyBkb3duIGtleVxuICAgICAgICBzZWxmLmFjdGl2YXRlTmV4dCgpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMzgpIHtcbiAgICAgICAgLy8gdXAga2V5XG4gICAgICAgIHNlbGYuYWN0aXZhdGVQcmV2KCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICAvLyBlbnRlclxuICAgICAgICBzZWxmLnNlbGVjdEFjdGl2ZSgpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMjcpIHtcbiAgICAgICAgLy8gZXNjYXBlXG4gICAgICAgIGlmIChzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3VwZGF0ZURhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IHRoaXMuZml4RGF0YShkYXRhKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXN0SXRlbSA9IDA7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZmlsdGVyZWQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgaHRtbEVsZW1lbnQgPSB0aGlzLmRyb3Bkb3duSXRlbXNbdGhpcy5maWx0ZXJlZFtpbmRleF0uX3VpZF07XG4gICAgICBpZiAoaHRtbEVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0l0ZW0oaHRtbEVsZW1lbnQpO1xuICAgICAgdGhpcy5saXN0Lmluc2VydEJlZm9yZShodG1sRWxlbWVudCwgdGhpcy5saXN0LmNoaWxkcmVuW2xhc3RJdGVtXSk7XG4gICAgICBsYXN0SXRlbSsrO1xuICAgIH1cblxuICAgIGZvciAoaW5kZXggPSBsYXN0SXRlbTsgaW5kZXggPCB0aGlzLmxpc3QuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmxpc3QuY2hpbGROb2Rlc1tpbmRleF07XG4gICAgICB0aGlzLm9wdGlvbnMuaGlkZUl0ZW0oY2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5zaG93TGlzdCh0aGlzLmxpc3QpO1xuICAgIHRoaXMuaXNTaG93biA9IHRydWU7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fZmlsdGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMuZGF0YTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpbHRlciAhPSBudWxsKSB7XG4gICAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5vcHRpb25zLmZpbHRlcihcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIHRoaXMuZGF0YSxcbiAgICAgICAgdGhpcy5vcHRpb25zLmV4dHJhY3RWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc29ydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc29ydCAhPSBudWxsKSB7XG4gICAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5vcHRpb25zLnNvcnQodmFsdWUsIHRoaXMuZmlsdGVyZWQpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9jcmVhdGVMaXN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLm9wdGlvbnMuZHJvcERvd25UYWcpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLm9wdGlvbnMuZHJvcERvd25DbGFzc2VzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgYS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5kcm9wRG93bkNsYXNzZXNbaW5kZXhdKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLmRhdGFbaV07XG4gICAgICB2YXIgYiA9IHRoaXMuY3JlYXRlSXRlbShpdGVtKTtcbiAgICAgIGEuYXBwZW5kQ2hpbGQoYik7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGEpO1xuICAgIHJldHVybiBhO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2NyZWF0ZUl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgIC8qY3JlYXRlIGEgRElWIGVsZW1lbnQgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudDoqL1xuICAgIHZhciBodG1sRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgLyptYWtlIHRoZSBtYXRjaGluZyBsZXR0ZXJzIGJvbGQ6Ki9cblxuICAgIHZhciB0ZXh0ID0gaXRlbS50ZXh0O1xuICAgIHZhciBfdWlkID0gaXRlbS5fdWlkO1xuXG4gICAgaHRtbEVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgIHZhciBhdHRycyA9IGl0ZW0uYXR0cnMgfHwge307XG4gICAgdmFyIGF0dHJzS2V5cyA9IE9iamVjdC5rZXlzKGF0dHJzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYXR0cnNLZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGtleSA9IGF0dHJzS2V5c1tpbmRleF07XG4gICAgICB2YXIgdmFsID0gYXR0cnNba2V5XTtcbiAgICAgIGh0bWxFbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgfVxuXG4gICAgZm9yIChcbiAgICAgIHZhciBpbmRleDIgPSAwO1xuICAgICAgaW5kZXgyIDwgdGhpcy5vcHRpb25zLmRyb3BEb3duSXRlbUNsYXNzZXMubGVuZ3RoO1xuICAgICAgaW5kZXgyKytcbiAgICApIHtcbiAgICAgIGh0bWxFbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmRyb3BEb3duSXRlbUNsYXNzZXNbaW5kZXgyXSk7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wZG93bkl0ZW1zW191aWRdID0gaHRtbEVsZW1lbnQ7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgaHRtbEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBzZWxmLm9wdGlvbnMub25JdGVtU2VsZWN0ZWQoc2VsZi5pbnB1dCwgaXRlbSwgaHRtbEVsZW1lbnQsIHNlbGYpO1xuICAgIH0pO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkICE9PSBudWxsICYmXG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQgIT09IHVuZGVmaW5lZFxuICAgICkge1xuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkKGh0bWxFbGVtZW50LCBpdGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaHRtbEVsZW1lbnQ7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVDbG9zZXN0ID0gZnVuY3Rpb24gKGluZGV4LCBkaXIpIHtcbiAgICBmb3IgKHZhciBpID0gaW5kZXg7IGkgPCB0aGlzLmxpc3QuY2hpbGROb2Rlcy5sZW5ndGg7ICkge1xuICAgICAgdmFyIGUgPSB0aGlzLmxpc3QuY2hpbGROb2Rlc1tpXTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaXNWaXNpYmxlKGUpKSB7XG4gICAgICAgIGUuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChkaXIgPiAwKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGktLTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fZGVhY3RpdmF0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWxsID0gdGhpcy5saXN0LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuXCIgKyB0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhbGwubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBhbGxbaW5kZXhdLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQrKztcbiAgICB0aGlzLl9hY3RpdmF0ZUNsb3Nlc3QodGhpcy5hY3RpdmVFbGVtZW50LCAxKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZVByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVhY3RpdmF0ZUFsbCgpO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudC0tO1xuICAgIHRoaXMuX2FjdGl2YXRlQ2xvc2VzdCh0aGlzLmFjdGl2ZUVsZW1lbnQsIC0xKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zZWxlY3RBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjdGl2ZSA9IHRoaXMubGlzdC5xdWVyeVNlbGVjdG9yKFwiLlwiICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICBpZiAoYWN0aXZlICE9PSBudWxsICYmIGFjdGl2ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhY3RpdmUuY2xpY2soKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5faGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9wdGlvbnMuaGlkZUxpc3QodGhpcy5saXN0KTtcbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcbiAgfTtcblxuICByZXR1cm4gQXV0b2NvbXBsZXRlO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0gaW5pQXV0b2NvbXBsZXRlO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgZ3VpZCA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmd1aWQ7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG5cbmZ1bmN0aW9uIGluaXRDaGlwcygpIHtcbiAgdmFyIERFRkFVTFRfU0VUVElOR1MgPSB7XG4gICAgY3JlYXRlSW5wdXQ6IHRydWUsXG4gICAgY2hpcHNDbGFzczogXCJjaGlwc1wiLFxuICAgIGNoaXBDbGFzczogXCJjaGlwXCIsXG4gICAgY2xvc2VDbGFzczogXCJjaGlwLWNsb3NlXCIsXG4gICAgY2hpcElucHV0Q2xhc3M6IFwiY2hpcC1pbnB1dFwiLFxuICAgIGltYWdlV2lkdGg6IDk2LFxuICAgIGltYWdlSGVpZ2h0OiA5NixcbiAgICBjbG9zZTogdHJ1ZSxcbiAgICBvbmNsaWNrOiBudWxsLFxuICAgIG9uY2xvc2U6IG51bGwsXG4gICAgb25jaGFuZ2U6IG51bGwsXG4gIH07XG5cbiAgdmFyIGNoaXBEYXRhID0ge1xuICAgIF91aWQ6IG51bGwsXG4gICAgdGV4dDogXCJcIixcbiAgICBpbWc6IFwiXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIHRhYmluZGV4OiBcIjBcIixcbiAgICB9LFxuICAgIGNsb3NlQ2xhc3NlczogbnVsbCxcbiAgICBjbG9zZUhUTUw6IG51bGwsXG4gICAgb25jbGljazogbnVsbCxcbiAgICBvbmNsb3NlOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoaWxkKHRhZywgYXR0cmlidXRlcywgY2xhc3NlcywgcGFyZW50KSB7XG4gICAgdmFyIGVsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB2YXIgYXR0cnNLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGVsZS5zZXRBdHRyaWJ1dGUoYXR0cnNLZXlzW2luZGV4XSwgYXR0cmlidXRlc1thdHRyc0tleXNbaW5kZXhdXSk7XG4gICAgfVxuICAgIGZvciAodmFyIGNsYXNzSW5kZXggPSAwOyBjbGFzc0luZGV4IDwgY2xhc3Nlcy5sZW5ndGg7IGNsYXNzSW5kZXgrKykge1xuICAgICAgdmFyIGtscyA9IGNsYXNzZXNbY2xhc3NJbmRleF07XG4gICAgICBlbGUuY2xhc3NMaXN0LmFkZChrbHMpO1xuICAgIH1cbiAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBfY3JlYXRlX2NoaXAsIFRoaXMgaXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24sIGFjY2Vzc2VkIGJ5IHRoZSBDaGlwcy5fYWRkQ2hpcCBtZXRob2RcbiAgICogQHBhcmFtIHsqfSBkYXRhIFRoZSBjaGlwIGRhdGEgdG8gY3JlYXRlLFxuICAgKiBAcmV0dXJucyBIVE1MRWxlbWVudFxuICAgKi9cbiAgZnVuY3Rpb24gX2NyZWF0ZUNoaXAoZGF0YSkge1xuICAgIGRhdGEgPSBhc3NpZ24oe30sIGNoaXBEYXRhLCBkYXRhKTtcbiAgICB2YXIgYXR0cnMgPSBhc3NpZ24oZGF0YS5hdHRycywgeyBcImNoaXAtaWRcIjogZGF0YS5fdWlkIH0pO1xuICAgIHZhciBjaGlwID0gY3JlYXRlQ2hpbGQoXCJkaXZcIiwgYXR0cnMsIFtcImNoaXBcIl0sIG51bGwpO1xuXG4gICAgZnVuY3Rpb24gY2xvc2VDYWxsYmFjayhlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZGF0YS5vbmNsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsaWNrQ2FsbGJhY2soZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGlmIChkYXRhLm9uY2xpY2sgIT09IG51bGwgJiYgZGF0YS5vbmNsaWNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLmltYWdlKSB7XG4gICAgICBjcmVhdGVDaGlsZChcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAge1xuICAgICAgICAgIHdpZHRoOiBkYXRhLmltYWdlV2lkdGggfHwgOTYsXG4gICAgICAgICAgaGVpZ2h0OiBkYXRhLmltYWdlSGVpZ2h0IHx8IDk2LFxuICAgICAgICAgIHNyYzogZGF0YS5pbWFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgW10sXG4gICAgICAgIGNoaXAsXG4gICAgICAgIHt9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGF0YS50ZXh0KSB7XG4gICAgICB2YXIgc3BhbiA9IGNyZWF0ZUNoaWxkKFwic3BhblwiLCB7fSwgW10sIGNoaXAsIHt9KTtcbiAgICAgIHNwYW4uaW5uZXJIVE1MID0gZGF0YS50ZXh0O1xuICAgIH1cbiAgICBpZiAoZGF0YS5jbG9zZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBkYXRhLmNsb3NlQ2xhc3NlcyB8fCBbXCJjaGlwLWNsb3NlXCJdO1xuICAgICAgdmFyIGNsb3NlU3BhbiA9IGNyZWF0ZUNoaWxkKFxuICAgICAgICBcInNwYW5cIixcbiAgICAgICAge30sIC8vIGlkOiBkYXRhLmNsb3NlSWRcbiAgICAgICAgY2xhc3NlcyxcbiAgICAgICAgY2hpcCxcbiAgICAgICAge31cbiAgICAgICk7XG5cbiAgICAgIGNsb3NlU3Bhbi5pbm5lckhUTUwgPSBkYXRhLmNsb3NlSFRNTCB8fCBcIiZ0aW1lc1wiO1xuICAgICAgaWYgKGRhdGEub25jbG9zZSAhPT0gbnVsbCAmJiBkYXRhLm9uY2xvc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9zZVNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQ2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbGlja0NhbGxiYWNrKTtcblxuICAgIHJldHVybiBjaGlwO1xuICB9XG5cbiAgZnVuY3Rpb24gQ2hpcHMoZWxlbWVudCwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCBbXTtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmNoaXBzQ2xhc3MpO1xuXG4gICAgdGhpcy5fc2V0RWxlbWVudExpc3RlbmVycygpO1xuICAgIHRoaXMuaW5wdXQgPSB0aGlzLl9zZXRJbnB1dCgpO1xuICAgIHRoaXMuYWRkQ2hpcCA9IHRoaXMuX2FkZENoaXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZUNoaXAgPSB0aGlzLl9yZW1vdmVDaGlwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXREYXRhID0gdGhpcy5fZ2V0RGF0YS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRBdXRvY29tcGxldGUgPSB0aGlzLl9zZXRBdXRvY29tcGxldGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbmRlciA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIENoaXBzLnByb3RvdHlwZS5fZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgdmFyIHVpZCA9IHRoaXMuX2RhdGFbaW5kZXhdLl91aWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldLl91aWQgPT09IHVpZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgby5wdXNoKHRoaXMuZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB0aGlzLmRhdGFbaW5kZXhdLl9pbmRleCA9IGluZGV4O1xuICAgICAgdGhpcy5hZGRDaGlwKHRoaXMuZGF0YVtpbmRleF0pO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEF1dG9jb21wbGV0ZSA9IGZ1bmN0aW9uIChhdXRvY29tcGxldGVPYmopIHtcbiAgICB0aGlzLm9wdGlvbnMuYXV0b2NvbXBsZXRlID0gYXV0b2NvbXBsZXRlT2JqO1xuICB9O1xuXG4gIC8qKlxuICAgKiBhZGQgY2hpcCB0byBlbGVtZW50IGJ5IHBhc3NlZCBkYXRhXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSBjaGlwIGRhdGEsIFBsZWFzZSBzZWUgYGNoaXBEYXRhYCBkb2N1bW5ldGF0aW9ucy5cbiAgICovXG4gIENoaXBzLnByb3RvdHlwZS5fYWRkQ2hpcCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8gZ2V0IGlucHV0IGVsZW1lbnRcbiAgICB2YXIgZGlzdERhdGEgPSBhc3NpZ24oe30sIHRoaXMub3B0aW9ucywgY2hpcERhdGEsIGRhdGEpO1xuICAgIGRhdGEgPSBhc3NpZ24oXG4gICAgICB7IG9uY2xpY2s6IHRoaXMub3B0aW9ucy5vbmNsaWNrLCBvbmNsb3NlOiB0aGlzLm9wdGlvbnMub25jbG9zZSB9LFxuICAgICAgZGF0YVxuICAgICk7XG5cbiAgICBpZiAoZGF0YS5fdWlkID09PSB1bmRlZmluZWQgfHwgZGF0YS5fdWlkID09PSBudWxsKSB7XG4gICAgICB2YXIgdWlkID0gZ3VpZCgpO1xuICAgICAgZGF0YS5fdWlkID0gdWlkO1xuICAgICAgZGlzdERhdGEuX3VpZCA9IHVpZDtcbiAgICB9XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGlzdERhdGEub25jbGljayA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkaXN0RGF0YSkge1xuICAgICAgc2VsZi5faGFuZGxlQ2hpcENsaWNrLmFwcGx5KHNlbGYsIFtlLCBjaGlwLCBkYXRhXSk7XG4gICAgfTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRpc3REYXRhLm9uY2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGlzdERhdGEpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUNoaXBDbG9zZS5hcHBseShzZWxmLCBbZSwgY2hpcCwgZGF0YV0pO1xuICAgIH07XG5cbiAgICB2YXIgY2hpcCA9IF9jcmVhdGVDaGlwKGRpc3REYXRhKTtcbiAgICB2YXIgaW5wdXQgPSB0aGlzLmlucHV0O1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5wYXJlbnRFbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoY2hpcCwgaW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfVxuICAgIC8vIEF2b2lkIGluZmludGUgbG9vcCwgaWYgcmVjdXJzc2l2ZWx5IGFkZCBkYXRhIHRvIHRoZXRoaXMuZGF0YSB3aGlsZSByZW5kZXIgaXMgdGVyYXRpbmdcbiAgICAvLyBvdmVyIGl0LlxuICAgIGlmIChkYXRhLl9pbmRleCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuX2luZGV4ICE9PSBudWxsKSB7XG4gICAgICB2YXIgaW5kZXggPSBkYXRhLl9pbmRleDtcbiAgICAgIGRlbGV0ZSBkYXRhLl9pbmRleDtcbiAgICAgIHRoaXMuZGF0YVtpbmRleF0gPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhLnB1c2goZGlzdERhdGEpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IG51bGwgJiYgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbmNoYW5nZSh0aGlzLmRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldElucHV0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbnB1dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pbnB1dCAhPT0gbnVsbCAmJiB0aGlzLm9wdGlvbnMuaW5wdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuaW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbnB1dHMgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoaXBJbnB1dENsYXNzXG4gICAgICApO1xuICAgICAgaWYgKGlucHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlucHV0ID0gaW5wdXRzWzBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNyZWF0ZUlucHV0KSB7XG4gICAgICAgIC8vIGNyZWF0ZSBpbnB1dCBhbmQgYXBwZW5kIHRvIGVsZW1lbnRcbiAgICAgICAgaW5wdXQgPSBjcmVhdGVDaGlsZChcbiAgICAgICAgICBcImlucHV0XCIsXG4gICAgICAgICAgeyBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyIHx8IFwiXCIgfSxcbiAgICAgICAgICBbdGhpcy5vcHRpb25zLmNoaXBJbnB1dENsYXNzXSxcbiAgICAgICAgICB0aGlzLmVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIHNldCBldmVudCBsaXN0ZW5lclxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c291dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImZvY3VzXCIpO1xuICAgIH0pO1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmb2N1c1wiKTtcbiAgICB9KTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyBlbnRlclxuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgLy8gT3ZlcnJpZGUgZW50ZXIgaWYgYXV0b2NvbXBsZXRpbmcuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlICE9PSBudWxsICYmXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZS5pc1Nob3duXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICBzZWxmLmFkZENoaXAoe1xuICAgICAgICAgICAgdGV4dDogaW5wdXQudmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGlucHV0O1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0RWxlbWVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmlucHV0LmZvY3VzKCk7XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIWUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhzZWxmLm9wdGlvbnMuY2hpcENsYXNzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDggfHwgZS5rZXlDb2RlID09PSA0Nikge1xuICAgICAgICBzZWxmLl9oYW5kbGVDaGlwRGVsZXRlKGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBDbGljayA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkYXRhKSB7XG4gICAgZS50YXJnZXQuZm9jdXMoKTtcbiAgICBpZiAoZGF0YS5vbmNsaWNrICE9PSB1bmRlZmluZWQgJiYgZGF0YS5vbmNsaWNrICE9PSBudWxsKSB7XG4gICAgICBkYXRhLm9uY2xpY2soZSwgY2hpcCwgZGF0YSk7XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fZGVsZXRlQ2hpcERhdGEgPSBmdW5jdGlvbiAodWlkKSB7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAodGhpcy5fZGF0YVtpbmRleF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9kYXRhW2luZGV4XSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodWlkID09PSB0aGlzLl9kYXRhW2luZGV4XS5fdWlkKSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbaW5kZXhdO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBDbG9zZSA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkYXRhKSB7XG4gICAgaWYgKHRoaXMuX2RlbGV0ZUNoaXBEYXRhKGRhdGEuX3VpZCkpIHtcbiAgICAgIGNoaXAucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChjaGlwKTtcbiAgICAgIGlmIChkYXRhLm9uY2xvc2UgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm9uY2xvc2UgIT09IG51bGwpIHtcbiAgICAgICAgZGF0YS5vbmNsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IG51bGwgJiZcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UodGhpcy5kYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW1vdmVDaGlwID0gZnVuY3Rpb24gKGNoaXBJZCkge1xuICAgIHZhciBjaGlwID0gbnVsbDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICBlbGVtZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZWxlbWVudCAhPT0gbnVsbCAmJlxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLm9wdGlvbnMuY2hpcENsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZShcImNoaXAtaWRcIikgPT09IGNoaXBJZCkge1xuICAgICAgICAgIGNoaXAgPSBlbGVtZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4MisrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpbmRleDJdO1xuICAgICAgaWYgKGl0ZW0gIT09IHVuZGVmaW5lZCAmJiBpdGVtICE9PSBudWxsICYmIGl0ZW0uX3VpZCA9PT0gY2hpcElkKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShudWxsLCBjaGlwLCBpdGVtKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcERlbGV0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGNoaXAgPSBlLnRhcmdldDtcbiAgICB2YXIgY2hpcElkID0gY2hpcC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpO1xuICAgIGlmIChjaGlwSWQgPT09IHVuZGVmaW5lZCB8fCBjaGlwSWQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKFwiWW91ICBzaG91bGQgcHJvdmlkZSBjaGlwSWRcIik7XG4gICAgfVxuICAgIHZhciBkYXRhID0ge307XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5kYXRhW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5fdWlkID09PSBjaGlwSWRcbiAgICAgICkge1xuICAgICAgICBkYXRhID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5faGFuZGxlQ2hpcENsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IEVycm9yKFwiY2FuJ3QgZmluZCBkYXRhIHdpdGggaWQ6IFwiICsgY2hpcElkLCB0aGlzLmRhdGEpO1xuICB9O1xuXG4gIHJldHVybiBDaGlwcztcbn1cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2hpcHM7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdENoaXBzID0gcmVxdWlyZShcIi4vY2hpcHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdEF1dG9jb21wbGV0ZSA9IHJlcXVpcmUoXCIuL2F1dG9jb21wbGV0ZVwiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbnRNU0YgPSByZXF1aXJlKFwiLi9tc2ZcIik7XG5cbnZhciBqdWlzID0ge307XG5qdWlzLkNoaXBzID0gaW5pdENoaXBzKCk7XG5qdWlzLkF1dG9jb21wbGV0ZSA9IGluaXRBdXRvY29tcGxldGUoKTtcbmp1aXMuTXVsdGlTdGVwRm9ybSA9IGludE1TRigpO1xuanVpcy5NU0YgPSBqdWlzLk11bHRpU3RlcEZvcm07XG5cbmlmICh3aW5kb3cgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgd2luZG93Lmp1aXMgPSBqdWlzIHx8IHt9O1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGp1aXM7XG4iLCIvKlxuVG8gdXNlIHRoaXMgbXVsdGkgc3RlcCBmb3JtXG4tIGRpdmlkZSB5b3VyIGZvcm0gaW50byBzdGVwcywgZWFjaCBvbmUgaXMgYSBIVE1MRWxlbWVudCB3aXRoIGBmb3JtLXN0ZXBgIFxuICBjbGFzcyAoWW91IGNhbiBjdXN0b21pemUgdGhpcyBieSBgb3B0aW9ucy5mb3JtU3RlcENsYXNzYCkuXG4tIEF2b2lkIGNyZWF0aW5nIFwic3VibWl0IGJ0blwiIGluc2lkZSB0aGUgZm9ybS5cbi0gSWYgeW91IGNyZWF0ZSBzdWJtaXQgYnV0dG9uLiBnaXZlIG9uZSBvZiB0aGUgdmFsaWQgYWx0ZXJTdWJtaXRCdG4gc3RyYXRlZ2llcy4gVmFsaWQgdmFsdWVzIGluY2x1ZGUgW251bGwsICduZXh0JywgJ2hpZGUnXVxuICBEZWZhdWx0IGlzIGBuZXh0YCwgVGhpcyBtZWFucyB0aGF0LCBUaGUgc3VibWl0IGJ1dHRvbiBgb25jbGlja2AgJiBgb25zdWJtaXRgIGV2ZW50cyB3aWxsIHdvcmsgYXMgYHNob3dOZXh0KClgXG4tIFVzZSB0aGUgZXh0ZXJuYWwgQVBJOlxuICB2YXIgbXNmID0gdG9NdWx0aVN0ZXBGb3JtKGZvcm0pO1xuICBtc2Yuc2hvd0ZpcnN0KCk7XG4gIG1zZi5zaG93TmV4dCgpO1xuICBtc2Yuc2hvd1ByZXYoKTtcbiAgbXNmLm1vdmVUbygpO1xuICBcbi0gTGlzdGVuIHRvIGV2ZW50czpcbiAgb3B0aW9ucy5vblN0ZXBTaG93bigpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudCAmIHN0ZXAgaW5kZXggYXMgc2Vjb25kIGFyZ3VtZW50LlxuICBvcHRpb25zLm9uU3RlcEhpZGUoKSAvLyByZWNlaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgJiBzdGVwIGluZGV4IGFzIHNlY29uZCBhcmd1bWVudC5cblxuLSBDdXN0b21pemUgaG93IHlvdXIgZm9ybSBzdGVwcyBhcmUgZGVmaW5lZDpcbiAgQnkgZGVmYXVsdCwgZWFjaCBmb3JtIHN0ZXAgc2hvdWxkIGhhdmUgYGZvcm0tc3RlcGAgY2xhc3MsIFlvdSBjYW4gcHJvdmlkZSB5b3VyIFxuICBjdXN0b20gY2xhc3MgYnkgYG9wdGlvbnMuZm9ybVN0ZXBDbGFzc2BcblxuLSBDdXN0b21pemUgdGhlIGVsZW1lbnQgc2hvdyAmIGhpZGUgbWV0aG9kczpcbiAgb3B0aW9ucy5oaWRlRnVuKCkgLy8gcmVjcml2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50ICYgdGhlIGVsZW1lbnQgdG8gaGlkZSBhcyBzZWNvbmQgb25lLlxuICBvcHRpb25zLnNob3dGdW4oKSAvLyByZWNlaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgJiB0aGUgZWxlbWVudCB0byBzaG93IGFzIHNlY29uZCBvbmUuXG4gIEJ5IGRlZmF1bHQsIFdlIHRvZ2dsZSB0aGUgZWxlbWVudC5zdHlsZS5kaXNwbGF5IGF0dHJpYnV0ZSwgJ25vbmUnIHx8ICdibG9jaydcblxuLSBDdXN0b21pemUgdGhlIHdheSB0byBzdG9yZSAmIGdldCB0aGUgY3VycmVudCBzdGVwIDpcbiAgb3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudC5cbiAgb3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwKCkgLy8gcmVjZWl2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50IGFuZCB0aGUgY3VycmVudCBzdGVwIGluZGV4IGFzIHNlY29uZCBvbmUuXG4gIFRoaXMgZnVuY3Rpb25zIGFyZSB1c2VmdWwgaWYgeW91IHdhbnQgdG8gc3RvcmUgc3RlcCBpbmRleCBzb21ld2hlcmUgbGlrZTogc2Vzc2lvbiwgcXVlcnkgc3RyaW5ncyBldGMuXG5cbi0gQ3VzdG9taXplIHRoZSBmb3JtIHN1Ym1pdDpcbiAgLSB0b2dnbGUgc3VibWl0IGZvcm0gb24gdGhlIGxhc3Qgc3RlcDpcbiAgICBvcHRpb25zLnN1Ym1pdE9uRW5kICAvLyBkZWZhdWx0IGlzIHRydWUgd2hpY2ggbWVhbnMgdGhhdCB0aGUgbXNmIHdpbGwgc3VibWl0IHRoZSBmb3JtIGFmdGVyIHRoZSBsYXN0IHN0ZXAuXG4gICAgb3B0aW9ucy5zdWJtaXRGdW4oKSAgLy8gVGhlIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIGFzIHRoZSBmb3JtIHN1Ym1pc3Npb24gZnVuY3Rpb24uIEl0IHJlY2lldmVzIHRoZSBtc2YgYXMgZmlyc3QgXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXJndW1lbnQgJiB5b3UgY2FuIGFjY2Nlc3MgdGhlIGZvcm0gZWxlbWVudCBieSBgbXNmLmZvcm1gLlxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQsIFdlIHVzZSBgZm9ybS5zdWJtaXQoKWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCdXQgeW91IGNhbiBjaGFuZ2UgdGhpcyBpZiB5b3UgbmVlZC4gRm9yIGV4YW1wbGU6LiBzaG93IG1lc3NhZ2UgYmVmb3JlIG9yIHN1Ym1pdCBieSBgYWpheGAuXG4gIFxuLSBQcm92aWRlIGV4dHJhIGZvcm0gdmFsaWRhdG9yczpcbiAgLSBgb3B0aW9ucy5leHRyYXZhbGlkYXRvcnNgIDogdGhpcyBvYmplY3QgbWFwIGZvcm0gZmllbGQgaWQgdG8gYSBzaW5nbGUgZnVuY3Rpb24gdGhhdCBzaG91bGQgdmFsaWRhdGUgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBmdW5jdGlvbiB3aWxsIHJlY2lldmUgdGhlIEhUTUxFbGVtZW50IGFzIHNpbmdsZSBhcmd1bWVudCAmIHNob3VsZCByZXR1cm4gYHRydWVgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkYXRpb24gc3VjY2VzcyBvciBgZmFsc2VgIGlmIGZhaWxlZC5cbiAgKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuXG5mdW5jdGlvbiBpbml0TVNGKCkge1xuICB2YXIgREVGQVVMVCA9IHtcbiAgICBmb3JtU3RlcENsYXNzOiBcImZvcm0tc3RlcFwiLFxuICAgIC8vXG4gICAgZ2V0Q3VycmVudFN0ZXA6IG51bGwsXG4gICAgc3RvcmVDdXJyZW50U3RlcDogbnVsbCxcbiAgICBvblN0ZXBTaG93bjogbnVsbCxcbiAgICBvblN0ZXBIaWRlOiBudWxsLFxuICAgIGhpZGVGdW46IG51bGwsXG4gICAgc2hvd0Z1bjogbnVsbCxcbiAgICBzdWJtaXRGdW46IG51bGwsXG4gICAgYWx0ZXJTdWJtaXRCdG46IG51bGwsIC8vIFsgJ25leHQnLCAnbnVsbCcuIG51bGwsICdoaWRlJ11cbiAgICBzdWJtaXRPbkVuZDogZmFsc2UsXG4gICAgZXh0cmFWYWxpZGF0b3JzOiB7fSxcbiAgfTtcblxuICBmdW5jdGlvbiBjYWxsKGZuKSB7XG4gICAgaWYgKGZuID09PSB1bmRlZmluZWQgfHwgZm4gPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWx0ZXJTdWJtaXRCdG4oZm9ybSwgc3RyYXRlZ3ksIGNhbGxiYWNrKSB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSBudWxsIHx8IHN0cmF0ZWd5ID09PSBcIm51bGxcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaW5wdXRFbGVtZW50cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKTtcbiAgICB2YXIgYnV0dG9uRWxlbWVudHMgPSBmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xuICAgIHZhciBzdWJtaXRCdG4gPSB1bmRlZmluZWQ7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGlucHV0RWxlbWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoaW5wdXRFbGVtZW50c1tpbmRleF0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSA9PSBcInN1Ym1pdFwiKSB7XG4gICAgICAgIHN1Ym1pdEJ0biA9IGlucHV0RWxlbWVudHNbaW5kZXhdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN1Ym1pdEJ0biA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IGJ1dHRvbkVsZW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBpZiAoYnV0dG9uRWxlbWVudHNbaW5kZXhdLmdldEF0dHJpYnV0ZShcInR5cGVcIikgPT0gXCJzdWJtaXRcIikge1xuICAgICAgICAgIHN1Ym1pdEJ0biA9IGJ1dHRvbkVsZW1lbnRzW2luZGV4XTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RyYXRlZ3kgPT0gXCJuZXh0XCIpIHtcbiAgICAgIGlmIChzdWJtaXRCdG4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1Ym1pdEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuICAgICAgICBzdWJtaXRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzdHJhdGVneSA9PSBcImhpZGVcIikge1xuICAgICAgc3VibWl0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBNdWx0aVN0ZXBGb3JtKGZvcm0sIG9wdGlvbnMpIHtcbiAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMuX2ZpeE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5mb3JtU3RlcHMgPSB0aGlzLmZvcm0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgKTtcbiAgICB0aGlzLnN0ZXBMZW5ndGggPSB0aGlzLmZvcm1TdGVwcy5sZW5ndGg7XG5cbiAgICBpZiAodGhpcy5mb3JtU3RlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgXCJZb3VyIGZvcm0gaGFzIG5vIHN0ZXAgZGVmaW5lZCBieSBjbGFzczogXCIgKyB0aGlzLm9wdGlvbnMuZm9ybVN0ZXBDbGFzc1xuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50U3RlcCA9IDA7XG4gICAgdGhpcy5pbml0aWFsID0gdGhpcy5faW5pdGlhbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc3VibWl0ID0gdGhpcy5fc3VibWl0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXBvcnRWYWxpZGl0eSA9IHRoaXMuX3JlcG9ydFZhbGlkaXR5LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tb3ZlVG8gPSB0aGlzLl9tb3ZlVG8uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dOZXh0ID0gdGhpcy5fc2hvd05leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dQcmV2ID0gdGhpcy5fc2hvd1ByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dGaXJzdCA9IHRoaXMuX3Nob3dGaXJzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0Q3VycmVudFN0ZXAgPSB0aGlzLl9nZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaXNMYXN0U3RlcCA9IHRoaXMuX2lzTGFzdFN0ZXAuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuaW5pdGlhbCgpO1xuICAgIHRoaXMuc2hvd0ZpcnN0KCk7XG4gIH1cblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZml4T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBERUZBVUxULCBvcHRpb25zKTtcbiAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRHZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwIHx8IHRoaXMuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN1Ym1pdEZ1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuIHx8IHRoaXMuX2RlZmF1bHRTdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biA9XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0Z1biB8fCB0aGlzLl9kZWZhdWx0U2hvd0Z1bi5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuIHx8IHRoaXMuX2RlZmF1bHRIaWRlRnVuLmJpbmQodGhpcyk7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5faW5pdGlhbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gSGlkZSBhbGxcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuZm9ybVN0ZXBzLmxlbmd0aDsgeCsrKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuaGlkZUZ1bih0aGlzLmZvcm1TdGVwc1t4XSk7XG4gICAgfVxuXG4gICAgYWx0ZXJTdWJtaXRCdG4odGhpcy5mb3JtLCB0aGlzLm9wdGlvbnMuYWx0ZXJTdWJtaXRCdG4sIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNlbGYuc2hvd05leHQoKTtcbiAgICB9KTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuc3VibWl0RnVuKCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3JlcG9ydFZhbGlkaXR5ID0gZnVuY3Rpb24gKGVsZSkge1xuICAgIC8vIHJlcG9ydCB2YWxpZGl0eSBvZiB0aGUgY3VycmVudCBzdGVwICYgaXRzIGNoaWxkcmVuXG4gICAgdmFyIHJ2ID0gdHJ1ZTtcblxuICAgIGZ1bmN0aW9uIGNhbGxFeHRyYVZhbGlkYXRvcihfZWxlbWVudCwgdmFsaWRhdG9ycykge1xuICAgICAgaWYgKFxuICAgICAgICBfZWxlbWVudCA9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIF9lbGVtZW50LmdldEF0dHJpYnV0ZSA9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgIHZhbGlkYXRvcnMgPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgaWQgPSBfZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIGlmIChpZCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1tpZF07XG4gICAgICBpZiAodmFsaWRhdG9yID09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxpZGF0b3IoX2VsZW1lbnQpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjaGlsZCA9IGVsZS5jaGlsZE5vZGVzW2ldO1xuICAgICAgcnYgPVxuICAgICAgICBydiAmJlxuICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KGNoaWxkKSAmJlxuICAgICAgICBjYWxsRXh0cmFWYWxpZGF0b3IoY2hpbGQsIHRoaXMub3B0aW9ucy5leHRyYVZhbGlkYXRvcnMpO1xuICAgIH1cbiAgICBpZiAoZWxlLnJlcG9ydFZhbGlkaXR5ICE9IHVuZGVmaW5lZCkge1xuICAgICAgcnYgPVxuICAgICAgICBydiAmJlxuICAgICAgICBlbGUucmVwb3J0VmFsaWRpdHkoKSAmJlxuICAgICAgICBjYWxsRXh0cmFWYWxpZGF0b3IoZWxlLCB0aGlzLm9wdGlvbnMuZXh0cmFWYWxpZGF0b3JzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9tb3ZlVG8gPSBmdW5jdGlvbiAodGFyZ2V0U3RlcCkge1xuICAgIC8vIFRoaXMgZnVuY3Rpb24gd2lsbCBmaWd1cmUgb3V0IHdoaWNoIGZvcm0tc3RlcCB0byBkaXNwbGF5XG4gICAgaWYgKHRhcmdldFN0ZXAgPCAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBjdXJyZW50U3RlcCA9IHRoaXMuZ2V0Q3VycmVudFN0ZXAoKTtcbiAgICAvLyBFeGl0IHRoZSBmdW5jdGlvbiBpZiBhbnkgZmllbGQgaW4gdGhlIGN1cnJlbnQgZm9ybS1zdGVwIGlzIGludmFsaWQ6XG4gICAgLy8gYW5kIHdhbnRzIHRvIGdvIG5leHRcbiAgICBpZiAoXG4gICAgICB0YXJnZXRTdGVwID4gY3VycmVudFN0ZXAgJiZcbiAgICAgICF0aGlzLnJlcG9ydFZhbGlkaXR5KHRoaXMuZm9ybVN0ZXBzW2N1cnJlbnRTdGVwXSlcbiAgICApXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgLy8gaWYgeW91IGhhdmUgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBmb3JtLi4uXG4gICAgaWYgKHRhcmdldFN0ZXAgPj0gdGhpcy5zdGVwTGVuZ3RoKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN1Ym1pdE9uRW5kKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN1Ym1pdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgXCJOb3RoaW5nIHRvIGRvLCBUaGlzIGlzIHRoZSBsYXN0IHN0ZXAgJiB5b3UgcGFzcyBgb3B0aW9ucy5zdWJtaXRPbkVuZGA9PSBmYWxzZVwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50U3RlcCAhPT0gdW5kZWZpbmVkICYmIGN1cnJlbnRTdGVwICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW2N1cnJlbnRTdGVwXSk7XG4gICAgICAgIGNhbGwodGhpcy5vcHRpb25zLm9uU3RlcEhpZGUsIGN1cnJlbnRTdGVwKTtcbiAgICAgIH1cbiAgICAgIC8vIFNob3cgY3VycmVudFxuICAgICAgdGhpcy5vcHRpb25zLnNob3dGdW4odGhpcy5mb3JtU3RlcHNbdGFyZ2V0U3RlcF0pO1xuICAgICAgLy8gc3RvcmUgdGhlIGNvcnJlY3QgY3VycmVudFN0ZXBcbiAgICAgIHRoaXMub3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwKHRhcmdldFN0ZXApO1xuICAgICAgY2FsbCh0aGlzLm9wdGlvbnMub25TdGVwU2hvd24sIHRhcmdldFN0ZXApO1xuICAgIH1cbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd05leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgdGhpcy5tb3ZlVG8oY3VycmVudCArIDEpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93Rmlyc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tb3ZlVG8oMCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIHRoaXMubW92ZVRvKGN1cnJlbnQgLSAxKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZ2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0R2V0Q3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN0ZXA7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTdG9yZUN1cnJlbnRTdGVwID0gZnVuY3Rpb24gKHN0ZXApIHtcbiAgICB0aGlzLmN1cnJlbnRTdGVwID0gc3RlcDtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFN1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZvcm0uc3VibWl0KCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0SGlkZUZ1biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTaG93RnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2lzTGFzdFN0ZXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpID09PSB0aGlzLnN0ZXBMZW5ndGggLSAxO1xuICB9O1xuXG4gIHJldHVybiBNdWx0aVN0ZXBGb3JtO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0gaW5pdE1TRjtcbiIsIi8qKlxuICogZ2VuZXJhdGUgdW5pcXVlIGlkXG4gKi9cbmZ1bmN0aW9uIGd1aWQoKSB7XG4gIGZ1bmN0aW9uIHM0KCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKVxuICAgICAgLnRvU3RyaW5nKDE2KVxuICAgICAgLnN1YnN0cmluZygxKTtcbiAgfVxuICBmdW5jdGlvbiBfZ3VpZCgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgczQoKSArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKSArXG4gICAgICBzNCgpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gX2d1aWQoKTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5mdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBpZiAodGFyZ2V0ID09IG51bGwpIHtcbiAgICAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0XCIpO1xuICB9XG5cbiAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG4gIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgdmFyIG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXG4gICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkge1xuICAgICAgLy8gU2tpcCBvdmVyIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICBmb3IgKHZhciBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobmV4dFNvdXJjZSwgbmV4dEtleSkpIHtcbiAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG5mdW5jdGlvbiBzaW1pbGFyaXR5U2NvcmUoc3RyLCBzdHJpbmcsIHNsaWNlKSB7XG4gIGlmIChzbGljZSA9PT0gdW5kZWZpbmVkIHx8IHNsaWNlID09PSBudWxsKSB7XG4gICAgc2xpY2UgPSB0cnVlO1xuICB9XG5cbiAgaWYgKCFzbGljZSkge1xuICAgIHN0ciA9IHN0ci50cmltKCk7XG4gICAgc3RyaW5nID0gc3RyaW5nLnRyaW0oKTtcbiAgfVxuXG4gIHN0ciA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuXG4gIHN0cmluZyA9IHN0cmluZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGZ1bmN0aW9uIGVxdWFscyhzMSwgczIpIHtcbiAgICByZXR1cm4gczEgPT0gczI7XG4gIH1cblxuICBmdW5jdGlvbiB0b1N1YnN0cmluZ3Mocykge1xuICAgIHZhciBzdWJzdHJzID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBzdWJzdHJzLnB1c2gocy5zbGljZShpbmRleCwgcy5sZW5ndGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YnN0cnM7XG4gIH1cblxuICBmdW5jdGlvbiBmcmFjdGlvbihzMSwgczIpIHtcbiAgICByZXR1cm4gczEubGVuZ3RoIC8gczIubGVuZ3RoO1xuICB9XG5cbiAgaWYgKGVxdWFscyhzdHIsIHN0cmluZykpIHtcbiAgICBzY29yZSA9IDEwMDtcbiAgICByZXR1cm4gc2NvcmU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNjb3JlID0gMDtcbiAgICB2YXIgaW5kZXggPSBzdHJpbmcuaW5kZXhPZihzdHIpO1xuICAgIHZhciBmID0gZnJhY3Rpb24oc3RyLCBzdHJpbmcpO1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgLy8gc3RyYXRzV2l0aCAoKVxuICAgICAgc2NvcmUgPSBmICogMTAwO1xuICAgIH1cbiAgICAvLyBjb250YWlucygpXG4gICAgZWxzZSBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgIHNjb3JlID0gZiAqICgoc3RyaW5nLmxlbmd0aCAtIGluZGV4KSAvIHN0cmluZy5sZW5ndGgpICogMTAwO1xuICAgIH1cblxuICAgIC8vXG4gICAgaWYgKCFzbGljZSkge1xuICAgICAgcmV0dXJuIHNjb3JlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3Vic3RycyA9IHRvU3Vic3RyaW5ncyhzdHIpO1xuICAgICAgZm9yICh2YXIgaW5kZXgyID0gMDsgaW5kZXgyIDwgc3Vic3Rycy5sZW5ndGggLSAxOyBpbmRleDIrKykge1xuICAgICAgICB2YXIgc3Vic2NvcmUgPSBzaW1pbGFyaXR5U2NvcmUoc3Vic3Ryc1tpbmRleDJdLCBzdHJpbmcsIGZhbHNlKTtcbiAgICAgICAgc2NvcmUgPSBzY29yZSArIHN1YnNjb3JlIC8gc3Vic3Rycy5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzY29yZTsgLy8gLyBzdWJzdHJzLmxlbmd0aFxuICAgIH1cbiAgfVxufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0ge1xuICBndWlkOiBndWlkLFxuICBhc3NpZ246IGFzc2lnbixcbiAgc2ltaWxhcml0eVNjb3JlOiBzaW1pbGFyaXR5U2NvcmUsXG59O1xuIl19

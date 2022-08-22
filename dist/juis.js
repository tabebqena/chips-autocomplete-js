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
    setCloseBtn: false,
    imageWidth: 96,
    imageHeight: 96,
    close: true,
    onclick: null,
    onclose: null,
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
    console.log(this.options);
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
    console.log(this, typeof this, this.options);
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
      call(this.options.onStepShown, targetStep);
      //... and run a function that will display the correct step indicator:

      this.options.storeCurrentStep(targetStep);
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
    return this.options.getCurrentStep();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgZ3VpZCA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmd1aWQ7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBzaW1pbGFyaXR5U2NvcmUgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5zaW1pbGFyaXR5U2NvcmU7XG5cbmZ1bmN0aW9uIGluaUF1dG9jb21wbGV0ZSgpIHtcbiAgdmFyIERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBmaWx0ZXI6IGZpbHRlcixcblxuICAgIGV4dHJhY3RWYWx1ZTogX2V4dHJhY3RWYWx1ZSxcbiAgICBzb3J0OiBudWxsLFxuICAgIGRyb3BEb3duQ2xhc3NlczogW1wiZHJvcGRvd25cIl0sXG4gICAgZHJvcERvd25JdGVtQ2xhc3NlczogW10sXG4gICAgZHJvcERvd25UYWc6IFwiZGl2XCIsXG4gICAgaGlkZUl0ZW06IGhpZGVJdGVtLFxuICAgIHNob3dJdGVtOiBzaG93SXRlbSxcbiAgICBzaG93TGlzdDogc2hvd0xpc3QsXG4gICAgaGlkZUxpc3Q6IGhpZGVMaXN0LFxuICAgIG9uSXRlbVNlbGVjdGVkOiBvbkl0ZW1TZWxlY3RlZCxcbiAgICBhY3RpdmVDbGFzczogXCJhY3RpdmVcIixcbiAgICBpc1Zpc2libGU6IGlzVmlzaWJsZSxcbiAgICBvbkxpc3RJdGVtQ3JlYXRlZDogbnVsbCxcbiAgfTtcblxuICBmdW5jdGlvbiBpc1Zpc2libGUoZWxlbWVudCkge1xuICAgIHJldHVybiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBvbkl0ZW1TZWxlY3RlZChpbnB1dCwgaXRlbSwgaHRtbEVsZW1lbnQsIGF1dGNvbXBsZXRlKSB7XG4gICAgaW5wdXQudmFsdWUgPSBpdGVtLnRleHQ7XG4gICAgYXV0Y29tcGxldGUuaGlkZSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0xpc3QobCkge1xuICAgIGwuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTGlzdChsKSB7XG4gICAgbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlSXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93SXRlbShlKSB7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIGZ1bmN0aW9uIHNvcnQodmFsdWUsIGRhdGEpIHtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9leHRyYWN0VmFsdWUob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdC50ZXh0IHx8IG9iamVjdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcih2YWx1ZSwgZGF0YSwgZXh0cmFjdFZhbHVlKSB7XG4gICAgaWYgKGV4dHJhY3RWYWx1ZSA9PT0gdW5kZWZpbmVkIHx8IGV4dHJhY3RWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgZXh0cmFjdFZhbHVlID0gX2V4dHJhY3RWYWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgc2NvcmVzID0ge307XG4gICAgdmFyIF9kYXRhID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgaXRlbVZhbHVlID0gZXh0cmFjdFZhbHVlKGRhdGFbaW5kZXhdKTtcbiAgICAgIHZhciBzY29yZSA9IHNpbWlsYXJpdHlTY29yZSh2YWx1ZSwgaXRlbVZhbHVlKTtcbiAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgX2RhdGEucHVzaChkYXRhW2luZGV4XSk7XG4gICAgICAgIHNjb3Jlc1tpdGVtVmFsdWVdID0gc2NvcmU7XG4gICAgICB9XG4gICAgfVxuICAgIF9kYXRhID0gX2RhdGEuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgdmFyIHNjb3JlQSA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYSldO1xuICAgICAgdmFyIHNjb3JlQiA9IHNjb3Jlc1tleHRyYWN0VmFsdWUoYildO1xuICAgICAgcmV0dXJuIHNjb3JlQiAtIHNjb3JlQTtcbiAgICB9KTtcbiAgICByZXR1cm4gX2RhdGE7XG4gIH1cblxuICAvLyBnZW5lcmF0ZSB1bmlxdWUgaWRcblxuICBmdW5jdGlvbiBBdXRvY29tcGxldGUoaW5wdXQsIGRhdGEsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXQ7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5maXhEYXRhKGRhdGEpO1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50ID0gLTE7XG5cbiAgICB0aGlzLmRyb3Bkb3duSXRlbXMgPSBbXTtcblxuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9PUFRJT05TLCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLnBhcmVudE5vZGUgPSBpbnB1dC5wYXJlbnROb2RlO1xuICAgIHRoaXMuY3JlYXRlTGlzdCA9IHRoaXMuX2NyZWF0ZUxpc3QuYmluZCh0aGlzKTtcbiAgICB0aGlzLmNyZWF0ZUl0ZW0gPSB0aGlzLl9jcmVhdGVJdGVtLmJpbmQodGhpcyk7XG4gICAgdGhpcy51cGRhdGVEYXRhID0gdGhpcy5fdXBkYXRlRGF0YS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvdyA9IHRoaXMuX3Nob3cuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhpZGUgPSB0aGlzLl9oaWRlLmJpbmQodGhpcyk7XG4gICAgdGhpcy5maWx0ZXIgPSB0aGlzLl9maWx0ZXIuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNvcnQgPSB0aGlzLl9zb3J0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5hY3RpdmF0ZU5leHQgPSB0aGlzLl9hY3RpdmF0ZU5leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFjdGl2YXRlUHJldiA9IHRoaXMuX2FjdGl2YXRlUHJldi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2VsZWN0QWN0aXZlID0gdGhpcy5fc2VsZWN0QWN0aXZlLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcnMgPSB0aGlzLl9zZXR1cF9saXN0ZW5lcnM7XG4gICAgdGhpcy5saXN0ID0gdGhpcy5jcmVhdGVMaXN0KCk7XG4gICAgdGhpcy5oaWRlKCk7XG4gICAgdGhpcy5zZXR1cExpc3RlbmVycygpO1xuICB9XG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuZml4RGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdmFyIHJ2ID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IGRhdGFbaW5kZXhdO1xuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZWxlbWVudCA9IHsgdGV4dDogZWxlbWVudCB9O1xuICAgICAgfVxuICAgICAgZWxlbWVudC5fdWlkID0gZ3VpZCgpO1xuICAgICAgcnYucHVzaChlbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHJ2O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NldHVwX2xpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHZhciBpbnB1dCA9IHNlbGYuaW5wdXQ7XG4gICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgfVxuICAgICAgc2VsZi5maWx0ZXIoaW5wdXQudmFsdWUpO1xuICAgICAgc2VsZi5zb3J0KGlucHV0LnZhbHVlKTtcbiAgICAgIHNlbGYuc2hvdygpO1xuICAgIH0pO1xuXG4gICAgLypleGVjdXRlIGEgZnVuY3Rpb24gcHJlc3NlcyBhIGtleSBvbiB0aGUga2V5Ym9hcmQ6Ki9cbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIXNlbGYuaXNTaG93bikge1xuICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleUNvZGUgPT0gNDApIHtcbiAgICAgICAgLy8gZG93biBrZXlcbiAgICAgICAgc2VsZi5hY3RpdmF0ZU5leHQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM4KSB7XG4gICAgICAgIC8vIHVwIGtleVxuICAgICAgICBzZWxmLmFjdGl2YXRlUHJldigpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgc2VsZi5zZWxlY3RBY3RpdmUoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDI3KSB7XG4gICAgICAgIC8vIGVzY2FwZVxuICAgICAgICBpZiAoc2VsZi5pc1Nob3duKSB7XG4gICAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl91cGRhdGVEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmZpeERhdGEoZGF0YSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdEl0ZW0gPSAwO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmZpbHRlcmVkLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGh0bWxFbGVtZW50ID0gdGhpcy5kcm9wZG93bkl0ZW1zW3RoaXMuZmlsdGVyZWRbaW5kZXhdLl91aWRdO1xuICAgICAgaWYgKGh0bWxFbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRpb25zLnNob3dJdGVtKGh0bWxFbGVtZW50KTtcbiAgICAgIHRoaXMubGlzdC5pbnNlcnRCZWZvcmUoaHRtbEVsZW1lbnQsIHRoaXMubGlzdC5jaGlsZHJlbltsYXN0SXRlbV0pO1xuICAgICAgbGFzdEl0ZW0rKztcbiAgICB9XG5cbiAgICBmb3IgKGluZGV4ID0gbGFzdEl0ZW07IGluZGV4IDwgdGhpcy5saXN0LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGNoaWxkID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaW5kZXhdO1xuICAgICAgdGhpcy5vcHRpb25zLmhpZGVJdGVtKGNoaWxkKTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMuc2hvd0xpc3QodGhpcy5saXN0KTtcbiAgICB0aGlzLmlzU2hvd24gPSB0cnVlO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2ZpbHRlciA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLmRhdGE7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5maWx0ZXIgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5maWx0ZXIoXG4gICAgICAgIHZhbHVlLFxuICAgICAgICB0aGlzLmRhdGEsXG4gICAgICAgIHRoaXMub3B0aW9ucy5leHRyYWN0VmFsdWVcbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NvcnQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNvcnQgIT0gbnVsbCkge1xuICAgICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMub3B0aW9ucy5zb3J0KHZhbHVlLCB0aGlzLmZpbHRlcmVkKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fY3JlYXRlTGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5vcHRpb25zLmRyb3BEb3duVGFnKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5vcHRpb25zLmRyb3BEb3duQ2xhc3Nlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGEuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuZHJvcERvd25DbGFzc2VzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpdGVtID0gdGhpcy5kYXRhW2ldO1xuICAgICAgdmFyIGIgPSB0aGlzLmNyZWF0ZUl0ZW0oaXRlbSk7XG4gICAgICBhLmFwcGVuZENoaWxkKGIpO1xuICAgIH1cblxuICAgIHRoaXMuaW5wdXQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChhKTtcbiAgICByZXR1cm4gYTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9jcmVhdGVJdGVtID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAvKmNyZWF0ZSBhIERJViBlbGVtZW50IGZvciBlYWNoIG1hdGNoaW5nIGVsZW1lbnQ6Ki9cbiAgICB2YXIgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiRElWXCIpO1xuICAgIC8qbWFrZSB0aGUgbWF0Y2hpbmcgbGV0dGVycyBib2xkOiovXG5cbiAgICB2YXIgdGV4dCA9IGl0ZW0udGV4dDtcbiAgICB2YXIgX3VpZCA9IGl0ZW0uX3VpZDtcblxuICAgIGh0bWxFbGVtZW50LmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICB2YXIgYXR0cnMgPSBpdGVtLmF0dHJzIHx8IHt9O1xuICAgIHZhciBhdHRyc0tleXMgPSBPYmplY3Qua2V5cyhhdHRycyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBrZXkgPSBhdHRyc0tleXNbaW5kZXhdO1xuICAgICAgdmFyIHZhbCA9IGF0dHJzW2tleV07XG4gICAgICBodG1sRWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIH1cblxuICAgIGZvciAoXG4gICAgICB2YXIgaW5kZXgyID0gMDtcbiAgICAgIGluZGV4MiA8IHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzLmxlbmd0aDtcbiAgICAgIGluZGV4MisrXG4gICAgKSB7XG4gICAgICBodG1sRWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5kcm9wRG93bkl0ZW1DbGFzc2VzW2luZGV4Ml0pO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcGRvd25JdGVtc1tfdWlkXSA9IGh0bWxFbGVtZW50O1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGh0bWxFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgc2VsZi5vcHRpb25zLm9uSXRlbVNlbGVjdGVkKHNlbGYuaW5wdXQsIGl0ZW0sIGh0bWxFbGVtZW50LCBzZWxmKTtcbiAgICB9KTtcblxuICAgIGlmIChcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZCAhPT0gbnVsbCAmJlxuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkICE9PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZChodG1sRWxlbWVudCwgaXRlbSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh0bWxFbGVtZW50O1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlQ2xvc2VzdCA9IGZ1bmN0aW9uIChpbmRleCwgZGlyKSB7XG4gICAgZm9yICh2YXIgaSA9IGluZGV4OyBpIDwgdGhpcy5saXN0LmNoaWxkTm9kZXMubGVuZ3RoOyApIHtcbiAgICAgIHZhciBlID0gdGhpcy5saXN0LmNoaWxkTm9kZXNbaV07XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlzVmlzaWJsZShlKSkge1xuICAgICAgICBlLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2RlYWN0aXZhdGVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFsbCA9IHRoaXMubGlzdC5xdWVyeVNlbGVjdG9yQWxsKFwiLlwiICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYWxsLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgYWxsW2luZGV4XS5jbGFzc0xpc3QucmVtb3ZlKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlTmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWFjdGl2YXRlQWxsKCk7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50Kys7XG4gICAgdGhpcy5fYWN0aXZhdGVDbG9zZXN0KHRoaXMuYWN0aXZlRWxlbWVudCwgMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVQcmV2ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQtLTtcbiAgICB0aGlzLl9hY3RpdmF0ZUNsb3Nlc3QodGhpcy5hY3RpdmVFbGVtZW50LCAtMSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2VsZWN0QWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY3RpdmUgPSB0aGlzLmxpc3QucXVlcnlTZWxlY3RvcihcIi5cIiArIHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgaWYgKGFjdGl2ZSAhPT0gbnVsbCAmJiBhY3RpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYWN0aXZlLmNsaWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2hpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVMaXN0KHRoaXMubGlzdCk7XG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2U7XG4gIH07XG5cbiAgcmV0dXJuIEF1dG9jb21wbGV0ZTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaUF1dG9jb21wbGV0ZTtcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGd1aWQgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ndWlkO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuXG5mdW5jdGlvbiBpbml0Q2hpcHMoKSB7XG4gIHZhciBERUZBVUxUX1NFVFRJTkdTID0ge1xuICAgIGNyZWF0ZUlucHV0OiB0cnVlLFxuICAgIGNoaXBzQ2xhc3M6IFwiY2hpcHNcIixcbiAgICBjaGlwQ2xhc3M6IFwiY2hpcFwiLFxuICAgIGNsb3NlQ2xhc3M6IFwiY2hpcC1jbG9zZVwiLFxuICAgIGNoaXBJbnB1dENsYXNzOiBcImNoaXAtaW5wdXRcIixcbiAgICBzZXRDbG9zZUJ0bjogZmFsc2UsXG4gICAgaW1hZ2VXaWR0aDogOTYsXG4gICAgaW1hZ2VIZWlnaHQ6IDk2LFxuICAgIGNsb3NlOiB0cnVlLFxuICAgIG9uY2xpY2s6IG51bGwsXG4gICAgb25jbG9zZTogbnVsbCxcbiAgfTtcblxuICB2YXIgY2hpcERhdGEgPSB7XG4gICAgX3VpZDogbnVsbCxcbiAgICB0ZXh0OiBcIlwiLFxuICAgIGltZzogXCJcIixcbiAgICBhdHRyczoge1xuICAgICAgdGFiaW5kZXg6IFwiMFwiLFxuICAgIH0sXG4gICAgY2xvc2VDbGFzc2VzOiBudWxsLFxuICAgIGNsb3NlSFRNTDogbnVsbCxcbiAgICBvbmNsaWNrOiBudWxsLFxuICAgIG9uY2xvc2U6IG51bGwsXG4gIH07XG5cbiAgZnVuY3Rpb24gY3JlYXRlQ2hpbGQodGFnLCBhdHRyaWJ1dGVzLCBjbGFzc2VzLCBwYXJlbnQpIHtcbiAgICB2YXIgZWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIHZhciBhdHRyc0tleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYXR0cnNLZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgZWxlLnNldEF0dHJpYnV0ZShhdHRyc0tleXNbaW5kZXhdLCBhdHRyaWJ1dGVzW2F0dHJzS2V5c1tpbmRleF1dKTtcbiAgICB9XG4gICAgZm9yICh2YXIgY2xhc3NJbmRleCA9IDA7IGNsYXNzSW5kZXggPCBjbGFzc2VzLmxlbmd0aDsgY2xhc3NJbmRleCsrKSB7XG4gICAgICB2YXIga2xzID0gY2xhc3Nlc1tjbGFzc0luZGV4XTtcbiAgICAgIGVsZS5jbGFzc0xpc3QuYWRkKGtscyk7XG4gICAgfVxuICAgIGlmIChwYXJlbnQgIT09IHVuZGVmaW5lZCAmJiBwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbGUpO1xuICAgIH1cbiAgICByZXR1cm4gZWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIF9jcmVhdGVfY2hpcCwgVGhpcyBpcyBhbiBpbnRlcm5hbCBmdW5jdGlvbiwgYWNjZXNzZWQgYnkgdGhlIENoaXBzLl9hZGRDaGlwIG1ldGhvZFxuICAgKiBAcGFyYW0geyp9IGRhdGEgVGhlIGNoaXAgZGF0YSB0byBjcmVhdGUsXG4gICAqIEByZXR1cm5zIEhUTUxFbGVtZW50XG4gICAqL1xuICBmdW5jdGlvbiBfY3JlYXRlQ2hpcChkYXRhKSB7XG4gICAgZGF0YSA9IGFzc2lnbih7fSwgY2hpcERhdGEsIGRhdGEpO1xuICAgIHZhciBhdHRycyA9IGFzc2lnbihkYXRhLmF0dHJzLCB7IFwiY2hpcC1pZFwiOiBkYXRhLl91aWQgfSk7XG4gICAgdmFyIGNoaXAgPSBjcmVhdGVDaGlsZChcImRpdlwiLCBhdHRycywgW1wiY2hpcFwiXSwgbnVsbCk7XG5cbiAgICBmdW5jdGlvbiBjbG9zZUNhbGxiYWNrKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBkYXRhLm9uY2xvc2UoZSwgY2hpcCwgZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xpY2tDYWxsYmFjayhlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgaWYgKGRhdGEub25jbGljayAhPT0gbnVsbCAmJiBkYXRhLm9uY2xpY2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhLm9uY2xpY2soZSwgY2hpcCwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuaW1hZ2UpIHtcbiAgICAgIGNyZWF0ZUNoaWxkKFxuICAgICAgICBcImltZ1wiLFxuICAgICAgICB7XG4gICAgICAgICAgd2lkdGg6IGRhdGEuaW1hZ2VXaWR0aCB8fCA5NixcbiAgICAgICAgICBoZWlnaHQ6IGRhdGEuaW1hZ2VIZWlnaHQgfHwgOTYsXG4gICAgICAgICAgc3JjOiBkYXRhLmltYWdlLFxuICAgICAgICB9LFxuICAgICAgICBbXSxcbiAgICAgICAgY2hpcCxcbiAgICAgICAge31cbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChkYXRhLnRleHQpIHtcbiAgICAgIHZhciBzcGFuID0gY3JlYXRlQ2hpbGQoXCJzcGFuXCIsIHt9LCBbXSwgY2hpcCwge30pO1xuICAgICAgc3Bhbi5pbm5lckhUTUwgPSBkYXRhLnRleHQ7XG4gICAgfVxuICAgIGlmIChkYXRhLmNsb3NlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGRhdGEuY2xvc2VDbGFzc2VzIHx8IFtcImNoaXAtY2xvc2VcIl07XG4gICAgICB2YXIgY2xvc2VTcGFuID0gY3JlYXRlQ2hpbGQoXG4gICAgICAgIFwic3BhblwiLFxuICAgICAgICB7fSwgLy8gaWQ6IGRhdGEuY2xvc2VJZFxuICAgICAgICBjbGFzc2VzLFxuICAgICAgICBjaGlwLFxuICAgICAgICB7fVxuICAgICAgKTtcblxuICAgICAgY2xvc2VTcGFuLmlubmVySFRNTCA9IGRhdGEuY2xvc2VIVE1MIHx8IFwiJnRpbWVzXCI7XG4gICAgICBpZiAoZGF0YS5vbmNsb3NlICE9PSBudWxsICYmIGRhdGEub25jbG9zZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb3NlU3Bhbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2xvc2VDYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICAgIGNoaXAuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrQ2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIGNoaXA7XG4gIH1cblxuICBmdW5jdGlvbiBDaGlwcyhlbGVtZW50LCBkYXRhLCBvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBvcHRpb25zIHx8IHt9KTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhIHx8IFtdO1xuICAgIHRoaXMuX2RhdGEgPSBbXTtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuY2hpcHNDbGFzcyk7XG5cbiAgICB0aGlzLl9zZXRFbGVtZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5pbnB1dCA9IHRoaXMuX3NldElucHV0KCk7XG4gICAgdGhpcy5hZGRDaGlwID0gdGhpcy5fYWRkQ2hpcC5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVtb3ZlQ2hpcCA9IHRoaXMuX3JlbW92ZUNoaXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLmdldERhdGEgPSB0aGlzLl9nZXREYXRhLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnNldEF1dG9jb21wbGV0ZSA9IHRoaXMuX3NldEF1dG9jb21wbGV0ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMucmVuZGVyID0gdGhpcy5fcmVuZGVyLmJpbmQodGhpcyk7XG5cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9nZXREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAodGhpcy5fZGF0YVtpbmRleF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9kYXRhW2luZGV4XSAhPT0gbnVsbCkge1xuICAgICAgICB2YXIgdWlkID0gdGhpcy5fZGF0YVtpbmRleF0uX3VpZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0gIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldICE9PSBudWxsICYmXG4gICAgICAgICAgICB0aGlzLmRhdGFbaV0uX3VpZCA9PT0gdWlkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBvLnB1c2godGhpcy5kYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG87XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHRoaXMuZGF0YVtpbmRleF0uX2luZGV4ID0gaW5kZXg7XG4gICAgICB0aGlzLmFkZENoaXAodGhpcy5kYXRhW2luZGV4XSk7XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0QXV0b2NvbXBsZXRlID0gZnVuY3Rpb24gKGF1dG9jb21wbGV0ZU9iaikge1xuICAgIHRoaXMub3B0aW9ucy5hdXRvY29tcGxldGUgPSBhdXRvY29tcGxldGVPYmo7XG4gIH07XG5cbiAgLyoqXG4gICAqIGFkZCBjaGlwIHRvIGVsZW1lbnQgYnkgcGFzc2VkIGRhdGFcbiAgICogQHBhcmFtIHsqfSBkYXRhIGNoaXAgZGF0YSwgUGxlYXNlIHNlZSBgY2hpcERhdGFgIGRvY3VtbmV0YXRpb25zLlxuICAgKi9cbiAgQ2hpcHMucHJvdG90eXBlLl9hZGRDaGlwID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAvLyBnZXQgaW5wdXQgZWxlbWVudFxuICAgIHZhciBkaXN0RGF0YSA9IGFzc2lnbih7fSwgdGhpcy5vcHRpb25zLCBjaGlwRGF0YSwgZGF0YSk7XG4gICAgZGF0YSA9IGFzc2lnbihcbiAgICAgIHsgb25jbGljazogdGhpcy5vcHRpb25zLm9uY2xpY2ssIG9uY2xvc2U6IHRoaXMub3B0aW9ucy5vbmNsb3NlIH0sXG4gICAgICBkYXRhXG4gICAgKTtcblxuICAgIGlmIChkYXRhLl91aWQgPT09IHVuZGVmaW5lZCB8fCBkYXRhLl91aWQgPT09IG51bGwpIHtcbiAgICAgIHZhciB1aWQgPSBndWlkKCk7XG4gICAgICBkYXRhLl91aWQgPSB1aWQ7XG4gICAgICBkaXN0RGF0YS5fdWlkID0gdWlkO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBkaXN0RGF0YS5vbmNsaWNrID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRpc3REYXRhKSB7XG4gICAgICBzZWxmLl9oYW5kbGVDaGlwQ2xpY2suYXBwbHkoc2VsZiwgW2UsIGNoaXAsIGRhdGFdKTtcbiAgICB9O1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGlzdERhdGEub25jbG9zZSA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkaXN0RGF0YSkge1xuICAgICAgc2VsZi5faGFuZGxlQ2hpcENsb3NlLmFwcGx5KHNlbGYsIFtlLCBjaGlwLCBkYXRhXSk7XG4gICAgfTtcblxuICAgIHZhciBjaGlwID0gX2NyZWF0ZUNoaXAoZGlzdERhdGEpO1xuICAgIHZhciBpbnB1dCA9IHRoaXMuaW5wdXQ7XG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjaGlwKTtcbiAgICB9IGVsc2UgaWYgKGlucHV0LnBhcmVudEVsZW1lbnQgPT09IHRoaXMuZWxlbWVudCkge1xuICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShjaGlwLCBpbnB1dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjaGlwKTtcbiAgICB9XG4gICAgLy8gQXZvaWQgaW5maW50ZSBsb29wLCBpZiByZWN1cnNzaXZlbHkgYWRkIGRhdGEgdG8gdGhldGhpcy5kYXRhIHdoaWxlIHJlbmRlciBpcyB0ZXJhdGluZ1xuICAgIC8vIG92ZXIgaXQuXG4gICAgaWYgKGRhdGEuX2luZGV4ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5faW5kZXggIT09IG51bGwpIHtcbiAgICAgIHZhciBpbmRleCA9IGRhdGEuX2luZGV4O1xuICAgICAgZGVsZXRlIGRhdGEuX2luZGV4O1xuICAgICAgdGhpcy5kYXRhW2luZGV4XSA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuX2RhdGEucHVzaChkaXN0RGF0YSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRJbnB1dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuaW5wdXQgIT09IG51bGwgJiYgdGhpcy5vcHRpb25zLmlucHV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgaW5wdXRzID0gdGhpcy5lbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc1xuICAgICAgKTtcbiAgICAgIGlmIChpbnB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgICBpbnB1dCA9IGlucHV0c1swXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jcmVhdGVJbnB1dCkge1xuICAgICAgICAvLyBjcmVhdGUgaW5wdXQgYW5kIGFwcGVuZCB0byBlbGVtZW50XG4gICAgICAgIGlucHV0ID0gY3JlYXRlQ2hpbGQoXG4gICAgICAgICAgXCJpbnB1dFwiLFxuICAgICAgICAgIHsgcGxhY2Vob2xkZXI6IHRoaXMub3B0aW9ucy5wbGFjZWhvbGRlciB8fCBcIlwiIH0sXG4gICAgICAgICAgW3RoaXMub3B0aW9ucy5jaGlwSW5wdXRDbGFzc10sXG4gICAgICAgICAgdGhpcy5lbGVtZW50XG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBzZXQgZXZlbnQgbGlzdGVuZXJcbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNvdXRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJmb2N1c1wiKTtcbiAgICB9KTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c2luXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiZm9jdXNcIik7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgLy8gZW50ZXJcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIC8vIE92ZXJyaWRlIGVudGVyIGlmIGF1dG9jb21wbGV0aW5nLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUuaXNTaG93blxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnZhbHVlICE9PSBcIlwiKSB7XG4gICAgICAgICAgc2VsZi5hZGRDaGlwKHtcbiAgICAgICAgICAgIHRleHQ6IGlucHV0LnZhbHVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlucHV0LnZhbHVlID0gXCJcIjtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBpbnB1dDtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEVsZW1lbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5pbnB1dC5mb2N1cygpO1xuICAgIH0pO1xuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoc2VsZi5vcHRpb25zLmNoaXBDbGFzcykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZS5rZXlDb2RlID09PSA4IHx8IGUua2V5Q29kZSA9PT0gNDYpIHtcbiAgICAgICAgc2VsZi5faGFuZGxlQ2hpcERlbGV0ZShlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xpY2sgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGUudGFyZ2V0LmZvY3VzKCk7XG4gICAgaWYgKGRhdGEub25jbGljayAhPT0gdW5kZWZpbmVkICYmIGRhdGEub25jbGljayAhPT0gbnVsbCkge1xuICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2RlbGV0ZUNoaXBEYXRhID0gZnVuY3Rpb24gKHVpZCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHVpZCA9PT0gdGhpcy5fZGF0YVtpbmRleF0uX3VpZCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9kYXRhW2luZGV4XTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwQ2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGF0YSkge1xuICAgIGlmICh0aGlzLl9kZWxldGVDaGlwRGF0YShkYXRhLl91aWQpKSB7XG4gICAgICBjaGlwLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoY2hpcCk7XG4gICAgICBpZiAoZGF0YS5vbmNsb3NlICE9PSB1bmRlZmluZWQgJiYgZGF0YS5vbmNsb3NlICE9PSBudWxsKSB7XG4gICAgICAgIGRhdGEub25jbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9yZW1vdmVDaGlwID0gZnVuY3Rpb24gKGNoaXBJZCkge1xuICAgIHZhciBjaGlwID0gbnVsbDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5lbGVtZW50LmNoaWxkcmVuLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuY2hpbGRyZW5baW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICBlbGVtZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZWxlbWVudCAhPT0gbnVsbCAmJlxuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyh0aGlzLm9wdGlvbnMuY2hpcENsYXNzKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZShcImNoaXAtaWRcIikgPT09IGNoaXBJZCkge1xuICAgICAgICAgIGNoaXAgPSBlbGVtZW50O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4MisrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpbmRleDJdO1xuICAgICAgaWYgKGl0ZW0gIT09IHVuZGVmaW5lZCAmJiBpdGVtICE9PSBudWxsICYmIGl0ZW0uX3VpZCA9PT0gY2hpcElkKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShudWxsLCBjaGlwLCBpdGVtKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcERlbGV0ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGNoaXAgPSBlLnRhcmdldDtcbiAgICB2YXIgY2hpcElkID0gY2hpcC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpO1xuICAgIGlmIChjaGlwSWQgPT09IHVuZGVmaW5lZCB8fCBjaGlwSWQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IEVycm9yKFwiWW91ICBzaG91bGQgcHJvdmlkZSBjaGlwSWRcIik7XG4gICAgfVxuICAgIHZhciBkYXRhID0ge307XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5kYXRhW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5fdWlkID09PSBjaGlwSWRcbiAgICAgICkge1xuICAgICAgICBkYXRhID0gZWxlbWVudDtcbiAgICAgICAgdGhpcy5faGFuZGxlQ2hpcENsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IEVycm9yKFwiY2FuJ3QgZmluZCBkYXRhIHdpdGggaWQ6IFwiICsgY2hpcElkLCB0aGlzLmRhdGEpO1xuICB9O1xuXG4gIHJldHVybiBDaGlwcztcbn1cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0Q2hpcHM7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdENoaXBzID0gcmVxdWlyZShcIi4vY2hpcHNcIik7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG52YXIgaW5pdEF1dG9jb21wbGV0ZSA9IHJlcXVpcmUoXCIuL2F1dG9jb21wbGV0ZVwiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbnRNU0YgPSByZXF1aXJlKFwiLi9tc2ZcIik7XG5cbnZhciBqdWlzID0ge307XG5qdWlzLkNoaXBzID0gaW5pdENoaXBzKCk7XG5qdWlzLkF1dG9jb21wbGV0ZSA9IGluaXRBdXRvY29tcGxldGUoKTtcbmp1aXMuTXVsdGlTdGVwRm9ybSA9IGludE1TRigpO1xuanVpcy5NU0YgPSBqdWlzLk11bHRpU3RlcEZvcm07XG5cbmlmICh3aW5kb3cgIT09IHVuZGVmaW5lZCAmJiB3aW5kb3cgIT09IG51bGwpIHtcbiAgd2luZG93Lmp1aXMgPSBqdWlzIHx8IHt9O1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnMsIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGp1aXM7XG4iLCIvKlxuVG8gdXNlIHRoaXMgbXVsdGkgc3RlcCBmb3JtXG4tIGRpdmlkZSB5b3VyIGZvcm0gaW50byBzdGVwcywgZWFjaCBvbmUgaXMgYSBIVE1MRWxlbWVudCB3aXRoIGBmb3JtLXN0ZXBgIFxuICBjbGFzcyAoWW91IGNhbiBjdXN0b21pemUgdGhpcyBieSBgb3B0aW9ucy5mb3JtU3RlcENsYXNzYCkuXG4tIEF2b2lkIGNyZWF0aW5nIFwic3VibWl0IGJ0blwiIGluc2lkZSB0aGUgZm9ybS5cbi0gSWYgeW91IGNyZWF0ZSBzdWJtaXQgYnV0dG9uLiBnaXZlIG9uZSBvZiB0aGUgdmFsaWQgYWx0ZXJTdWJtaXRCdG4gc3RyYXRlZ2llcy4gVmFsaWQgdmFsdWVzIGluY2x1ZGUgW251bGwsICduZXh0JywgJ2hpZGUnXVxuICBEZWZhdWx0IGlzIGBuZXh0YCwgVGhpcyBtZWFucyB0aGF0LCBUaGUgc3VibWl0IGJ1dHRvbiBgb25jbGlja2AgJiBgb25zdWJtaXRgIGV2ZW50cyB3aWxsIHdvcmsgYXMgYHNob3dOZXh0KClgXG4tIFVzZSB0aGUgZXh0ZXJuYWwgQVBJOlxuICB2YXIgbXNmID0gdG9NdWx0aVN0ZXBGb3JtKGZvcm0pO1xuICBtc2Yuc2hvd0ZpcnN0KCk7XG4gIG1zZi5zaG93TmV4dCgpO1xuICBtc2Yuc2hvd1ByZXYoKTtcbiAgbXNmLm1vdmVUbygpO1xuICBcbi0gTGlzdGVuIHRvIGV2ZW50czpcbiAgb3B0aW9ucy5vblN0ZXBTaG93bigpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudCAmIHN0ZXAgaW5kZXggYXMgc2Vjb25kIGFyZ3VtZW50LlxuICBvcHRpb25zLm9uU3RlcEhpZGUoKSAvLyByZWNlaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgJiBzdGVwIGluZGV4IGFzIHNlY29uZCBhcmd1bWVudC5cblxuLSBDdXN0b21pemUgaG93IHlvdXIgZm9ybSBzdGVwcyBhcmUgZGVmaW5lZDpcbiAgQnkgZGVmYXVsdCwgZWFjaCBmb3JtIHN0ZXAgc2hvdWxkIGhhdmUgYGZvcm0tc3RlcGAgY2xhc3MsIFlvdSBjYW4gcHJvdmlkZSB5b3VyIFxuICBjdXN0b20gY2xhc3MgYnkgYG9wdGlvbnMuZm9ybVN0ZXBDbGFzc2BcblxuLSBDdXN0b21pemUgdGhlIGVsZW1lbnQgc2hvdyAmIGhpZGUgbWV0aG9kczpcbiAgb3B0aW9ucy5oaWRlRnVuKCkgLy8gcmVjcml2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50ICYgdGhlIGVsZW1lbnQgdG8gaGlkZSBhcyBzZWNvbmQgb25lLlxuICBvcHRpb25zLnNob3dGdW4oKSAvLyByZWNlaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgJiB0aGUgZWxlbWVudCB0byBzaG93IGFzIHNlY29uZCBvbmUuXG4gIEJ5IGRlZmF1bHQsIFdlIHRvZ2dsZSB0aGUgZWxlbWVudC5zdHlsZS5kaXNwbGF5IGF0dHJpYnV0ZSwgJ25vbmUnIHx8ICdibG9jaydcblxuLSBDdXN0b21pemUgdGhlIHdheSB0byBzdG9yZSAmIGdldCB0aGUgY3VycmVudCBzdGVwIDpcbiAgb3B0aW9ucy5nZXRDdXJyZW50U3RlcCgpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudC5cbiAgb3B0aW9ucy5zdG9yZUN1cnJlbnRTdGVwKCkgLy8gcmVjZWl2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50IGFuZCB0aGUgY3VycmVudCBzdGVwIGluZGV4IGFzIHNlY29uZCBvbmUuXG4gIFRoaXMgZnVuY3Rpb25zIGFyZSB1c2VmdWwgaWYgeW91IHdhbnQgdG8gc3RvcmUgc3RlcCBpbmRleCBzb21ld2hlcmUgbGlrZTogc2Vzc2lvbiwgcXVlcnkgc3RyaW5ncyBldGMuXG5cbi0gQ3VzdG9taXplIHRoZSBmb3JtIHN1Ym1pdDpcbiAgLSB0b2dnbGUgc3VibWl0IGZvcm0gb24gdGhlIGxhc3Qgc3RlcDpcbiAgICBvcHRpb25zLnN1Ym1pdE9uRW5kICAvLyBkZWZhdWx0IGlzIHRydWUgd2hpY2ggbWVhbnMgdGhhdCB0aGUgbXNmIHdpbGwgc3VibWl0IHRoZSBmb3JtIGFmdGVyIHRoZSBsYXN0IHN0ZXAuXG4gICAgb3B0aW9ucy5zdWJtaXRGdW4oKSAgLy8gVGhlIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIGFzIHRoZSBmb3JtIHN1Ym1pc3Npb24gZnVuY3Rpb24uIEl0IHJlY2lldmVzIHRoZSBtc2YgYXMgZmlyc3QgXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXJndW1lbnQgJiB5b3UgY2FuIGFjY2Nlc3MgdGhlIGZvcm0gZWxlbWVudCBieSBgbXNmLmZvcm1gLlxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQsIFdlIHVzZSBgZm9ybS5zdWJtaXQoKWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCdXQgeW91IGNhbiBjaGFuZ2UgdGhpcyBpZiB5b3UgbmVlZC4gRm9yIGV4YW1wbGU6LiBzaG93IG1lc3NhZ2UgYmVmb3JlIG9yIHN1Ym1pdCBieSBgYWpheGAuXG4gIFxuLSBQcm92aWRlIGV4dHJhIGZvcm0gdmFsaWRhdG9yczpcbiAgLSBgb3B0aW9ucy5leHRyYXZhbGlkYXRvcnNgIDogdGhpcyBvYmplY3QgbWFwIGZvcm0gZmllbGQgaWQgdG8gYSBzaW5nbGUgZnVuY3Rpb24gdGhhdCBzaG91bGQgdmFsaWRhdGUgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBmdW5jdGlvbiB3aWxsIHJlY2lldmUgdGhlIEhUTUxFbGVtZW50IGFzIHNpbmdsZSBhcmd1bWVudCAmIHNob3VsZCByZXR1cm4gYHRydWVgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHZhbGlkYXRpb24gc3VjY2VzcyBvciBgZmFsc2VgIGlmIGZhaWxlZC5cbiAgKi9cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuXG5mdW5jdGlvbiBpbml0TVNGKCkge1xuICB2YXIgREVGQVVMVCA9IHtcbiAgICBmb3JtU3RlcENsYXNzOiBcImZvcm0tc3RlcFwiLFxuICAgIC8vXG4gICAgZ2V0Q3VycmVudFN0ZXA6IG51bGwsXG4gICAgc3RvcmVDdXJyZW50U3RlcDogbnVsbCxcbiAgICBvblN0ZXBTaG93bjogbnVsbCxcbiAgICBvblN0ZXBIaWRlOiBudWxsLFxuICAgIGhpZGVGdW46IG51bGwsXG4gICAgc2hvd0Z1bjogbnVsbCxcbiAgICBzdWJtaXRGdW46IG51bGwsXG4gICAgYWx0ZXJTdWJtaXRCdG46IG51bGwsIC8vIFsgJ25leHQnLCAnbnVsbCcuIG51bGwsICdoaWRlJ11cbiAgICBzdWJtaXRPbkVuZDogZmFsc2UsXG4gICAgZXh0cmFWYWxpZGF0b3JzOiB7fSxcbiAgfTtcblxuICBmdW5jdGlvbiBjYWxsKGZuKSB7XG4gICAgaWYgKGZuID09PSB1bmRlZmluZWQgfHwgZm4gPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gYWx0ZXJTdWJtaXRCdG4oZm9ybSwgc3RyYXRlZ3ksIGNhbGxiYWNrKSB7XG4gICAgaWYgKHN0cmF0ZWd5ID09PSBudWxsIHx8IHN0cmF0ZWd5ID09PSBcIm51bGxcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaW5wdXRFbGVtZW50cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKTtcbiAgICB2YXIgYnV0dG9uRWxlbWVudHMgPSBmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYnV0dG9uXCIpO1xuICAgIHZhciBzdWJtaXRCdG4gPSB1bmRlZmluZWQ7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGlucHV0RWxlbWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoaW5wdXRFbGVtZW50c1tpbmRleF0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSA9PSBcInN1Ym1pdFwiKSB7XG4gICAgICAgIHN1Ym1pdEJ0biA9IGlucHV0RWxlbWVudHNbaW5kZXhdO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN1Ym1pdEJ0biA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IGJ1dHRvbkVsZW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBpZiAoYnV0dG9uRWxlbWVudHNbaW5kZXhdLmdldEF0dHJpYnV0ZShcInR5cGVcIikgPT0gXCJzdWJtaXRcIikge1xuICAgICAgICAgIHN1Ym1pdEJ0biA9IGJ1dHRvbkVsZW1lbnRzW2luZGV4XTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RyYXRlZ3kgPT0gXCJuZXh0XCIpIHtcbiAgICAgIGlmIChzdWJtaXRCdG4gIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHN1Ym1pdEJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbGJhY2spO1xuICAgICAgICBzdWJtaXRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzdHJhdGVneSA9PSBcImhpZGVcIikge1xuICAgICAgc3VibWl0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBNdWx0aVN0ZXBGb3JtKGZvcm0sIG9wdGlvbnMpIHtcbiAgICB0aGlzLmZvcm0gPSBmb3JtO1xuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMuX2ZpeE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdGhpcy5mb3JtU3RlcHMgPSB0aGlzLmZvcm0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgKTtcbiAgICB0aGlzLnN0ZXBMZW5ndGggPSB0aGlzLmZvcm1TdGVwcy5sZW5ndGg7XG5cbiAgICBpZiAodGhpcy5mb3JtU3RlcHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgXCJZb3VyIGZvcm0gaGFzIG5vIHN0ZXAgZGVmaW5lZCBieSBjbGFzczogXCIgKyB0aGlzLm9wdGlvbnMuZm9ybVN0ZXBDbGFzc1xuICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5jdXJyZW50U3RlcCA9IDA7XG4gICAgdGhpcy5pbml0aWFsID0gdGhpcy5faW5pdGlhbC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc3VibWl0ID0gdGhpcy5fc3VibWl0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5yZXBvcnRWYWxpZGl0eSA9IHRoaXMuX3JlcG9ydFZhbGlkaXR5LmJpbmQodGhpcyk7XG4gICAgdGhpcy5tb3ZlVG8gPSB0aGlzLl9tb3ZlVG8uYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dOZXh0ID0gdGhpcy5fc2hvd05leHQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dQcmV2ID0gdGhpcy5fc2hvd1ByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3dGaXJzdCA9IHRoaXMuX3Nob3dGaXJzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZ2V0Q3VycmVudFN0ZXAgPSB0aGlzLl9nZXRDdXJyZW50U3RlcC5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5pbml0aWFsKCk7XG4gICAgdGhpcy5zaG93Rmlyc3QoKTtcbiAgfVxuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9maXhPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFQsIG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCA9XG4gICAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdEdldEN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdFN0b3JlQ3VycmVudFN0ZXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4gfHwgdGhpcy5fZGVmYXVsdFN1Ym1pdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zaG93RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zaG93RnVuIHx8IHRoaXMuX2RlZmF1bHRTaG93RnVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gPVxuICAgICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gfHwgdGhpcy5fZGVmYXVsdEhpZGVGdW4uYmluZCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9pbml0aWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBjb25zb2xlLmxvZyh0aGlzLm9wdGlvbnMpO1xuICAgIC8vIEhpZGUgYWxsXG4gICAgZm9yICh2YXIgeCA9IDA7IHggPCB0aGlzLmZvcm1TdGVwcy5sZW5ndGg7IHgrKykge1xuICAgICAgdGhpcy5vcHRpb25zLmhpZGVGdW4odGhpcy5mb3JtU3RlcHNbeF0pO1xuICAgIH1cblxuICAgIGFsdGVyU3VibWl0QnRuKHRoaXMuZm9ybSwgdGhpcy5vcHRpb25zLmFsdGVyU3VibWl0QnRuLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzZWxmLnNob3dOZXh0KCk7XG4gICAgfSk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3N1Ym1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnN1Ym1pdEZ1bigpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9yZXBvcnRWYWxpZGl0eSA9IGZ1bmN0aW9uIChlbGUpIHtcbiAgICAvLyByZXBvcnQgdmFsaWRpdHkgb2YgdGhlIGN1cnJlbnQgc3RlcCAmIGl0cyBjaGlsZHJlblxuICAgIHZhciBydiA9IHRydWU7XG5cbiAgICBmdW5jdGlvbiBjYWxsRXh0cmFWYWxpZGF0b3IoX2VsZW1lbnQsIHZhbGlkYXRvcnMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgX2VsZW1lbnQgPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgIHR5cGVvZiBfZWxlbWVudC5nZXRBdHRyaWJ1dGUgPT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgICB2YWxpZGF0b3JzID09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIGlkID0gX2VsZW1lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XG4gICAgICBpZiAoaWQgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHZhbGlkYXRvciA9IHZhbGlkYXRvcnNbaWRdO1xuICAgICAgaWYgKHZhbGlkYXRvciA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsaWRhdG9yKF9lbGVtZW50KTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSBlbGUuY2hpbGROb2Rlc1tpXTtcbiAgICAgIHJ2ID1cbiAgICAgICAgcnYgJiZcbiAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eShjaGlsZCkgJiZcbiAgICAgICAgY2FsbEV4dHJhVmFsaWRhdG9yKGNoaWxkLCB0aGlzLm9wdGlvbnMuZXh0cmFWYWxpZGF0b3JzKTtcbiAgICB9XG4gICAgaWYgKGVsZS5yZXBvcnRWYWxpZGl0eSAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJ2ID1cbiAgICAgICAgcnYgJiZcbiAgICAgICAgZWxlLnJlcG9ydFZhbGlkaXR5KCkgJiZcbiAgICAgICAgY2FsbEV4dHJhVmFsaWRhdG9yKGVsZSwgdGhpcy5vcHRpb25zLmV4dHJhVmFsaWRhdG9ycyk7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fbW92ZVRvID0gZnVuY3Rpb24gKHRhcmdldFN0ZXApIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgZmlndXJlIG91dCB3aGljaCBmb3JtLXN0ZXAgdG8gZGlzcGxheVxuICAgIGlmICh0YXJnZXRTdGVwIDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFN0ZXAgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgLy8gRXhpdCB0aGUgZnVuY3Rpb24gaWYgYW55IGZpZWxkIGluIHRoZSBjdXJyZW50IGZvcm0tc3RlcCBpcyBpbnZhbGlkOlxuICAgIC8vIGFuZCB3YW50cyB0byBnbyBuZXh0XG4gICAgaWYgKFxuICAgICAgdGFyZ2V0U3RlcCA+IGN1cnJlbnRTdGVwICYmXG4gICAgICAhdGhpcy5yZXBvcnRWYWxpZGl0eSh0aGlzLmZvcm1TdGVwc1tjdXJyZW50U3RlcF0pXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnNvbGUubG9nKHRoaXMsIHR5cGVvZiB0aGlzLCB0aGlzLm9wdGlvbnMpO1xuICAgIC8vIGlmIHlvdSBoYXZlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgZm9ybS4uLlxuICAgIGlmICh0YXJnZXRTdGVwID49IHRoaXMuc3RlcExlbmd0aCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdWJtaXRPbkVuZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJtaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIFwiTm90aGluZyB0byBkbywgVGhpcyBpcyB0aGUgbGFzdCBzdGVwICYgeW91IHBhc3MgYG9wdGlvbnMuc3VibWl0T25FbmRgPT0gZmFsc2VcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VycmVudFN0ZXAgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50U3RlcCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuaGlkZUZ1bih0aGlzLmZvcm1TdGVwc1tjdXJyZW50U3RlcF0pO1xuICAgICAgICBjYWxsKHRoaXMub3B0aW9ucy5vblN0ZXBIaWRlLCBjdXJyZW50U3RlcCk7XG4gICAgICB9XG4gICAgICAvLyBTaG93IGN1cnJlbnRcbiAgICAgIHRoaXMub3B0aW9ucy5zaG93RnVuKHRoaXMuZm9ybVN0ZXBzW3RhcmdldFN0ZXBdKTtcbiAgICAgIGNhbGwodGhpcy5vcHRpb25zLm9uU3RlcFNob3duLCB0YXJnZXRTdGVwKTtcbiAgICAgIC8vLi4uIGFuZCBydW4gYSBmdW5jdGlvbiB0aGF0IHdpbGwgZGlzcGxheSB0aGUgY29ycmVjdCBzdGVwIGluZGljYXRvcjpcblxuICAgICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAodGFyZ2V0U3RlcCk7XG4gICAgfVxuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93TmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3VycmVudCA9IHRoaXMuZ2V0Q3VycmVudFN0ZXAoKTtcbiAgICB0aGlzLm1vdmVUbyhjdXJyZW50ICsgMSk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dGaXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm1vdmVUbygwKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd1ByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGN1cnJlbnQgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgdGhpcy5tb3ZlVG8oY3VycmVudCAtIDEpO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9nZXRDdXJyZW50U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwKCk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRHZXRDdXJyZW50U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RlcDtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFN0b3JlQ3VycmVudFN0ZXAgPSBmdW5jdGlvbiAoc3RlcCkge1xuICAgIHRoaXMuY3VycmVudFN0ZXAgPSBzdGVwO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0U3VibWl0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZm9ybS5zdWJtaXQoKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRIaWRlRnVuID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdFNob3dGdW4gPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5faXNMYXN0U3RlcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmdldEN1cnJlbnRTdGVwKCk7XG4gIH07XG5cbiAgcmV0dXJuIE11bHRpU3RlcEZvcm07XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbml0TVNGO1xuIiwiLyoqXG4gKiBnZW5lcmF0ZSB1bmlxdWUgaWRcbiAqL1xuZnVuY3Rpb24gZ3VpZCgpIHtcbiAgZnVuY3Rpb24gczQoKSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApXG4gICAgICAudG9TdHJpbmcoMTYpXG4gICAgICAuc3Vic3RyaW5nKDEpO1xuICB9XG4gIGZ1bmN0aW9uIF9ndWlkKCkge1xuICAgIHJldHVybiAoXG4gICAgICBzNCgpICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBzNCgpICtcbiAgICAgIHM0KClcbiAgICApO1xuICB9XG4gIHJldHVybiBfZ3VpZCgpO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHZhckFyZ3MpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgIC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3RcIik7XG4gIH1cblxuICB2YXIgdG8gPSBPYmplY3QodGFyZ2V0KTtcbiAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdG87XG59XG5cbmZ1bmN0aW9uIHNpbWlsYXJpdHlTY29yZShzdHIsIHN0cmluZywgc2xpY2UpIHtcbiAgaWYgKHNsaWNlID09PSB1bmRlZmluZWQgfHwgc2xpY2UgPT09IG51bGwpIHtcbiAgICBzbGljZSA9IHRydWU7XG4gIH1cblxuICBpZiAoIXNsaWNlKSB7XG4gICAgc3RyID0gc3RyLnRyaW0oKTtcbiAgICBzdHJpbmcgPSBzdHJpbmcudHJpbSgpO1xuICB9XG5cbiAgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XG5cbiAgc3RyaW5nID0gc3RyaW5nLnRvTG93ZXJDYXNlKCk7XG5cbiAgZnVuY3Rpb24gZXF1YWxzKHMxLCBzMikge1xuICAgIHJldHVybiBzMSA9PSBzMjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvU3Vic3RyaW5ncyhzKSB7XG4gICAgdmFyIHN1YnN0cnMgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHN1YnN0cnMucHVzaChzLnNsaWNlKGluZGV4LCBzLmxlbmd0aCkpO1xuICAgIH1cbiAgICByZXR1cm4gc3Vic3RycztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZyYWN0aW9uKHMxLCBzMikge1xuICAgIHJldHVybiBzMS5sZW5ndGggLyBzMi5sZW5ndGg7XG4gIH1cblxuICBpZiAoZXF1YWxzKHN0ciwgc3RyaW5nKSkge1xuICAgIHNjb3JlID0gMTAwO1xuICAgIHJldHVybiBzY29yZTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2NvcmUgPSAwO1xuICAgIHZhciBpbmRleCA9IHN0cmluZy5pbmRleE9mKHN0cik7XG4gICAgdmFyIGYgPSBmcmFjdGlvbihzdHIsIHN0cmluZyk7XG4gICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAvLyBzdHJhdHNXaXRoICgpXG4gICAgICBzY29yZSA9IGYgKiAxMDA7XG4gICAgfVxuICAgIC8vIGNvbnRhaW5zKClcbiAgICBlbHNlIGlmIChpbmRleCAhPSAtMSkge1xuICAgICAgc2NvcmUgPSBmICogKChzdHJpbmcubGVuZ3RoIC0gaW5kZXgpIC8gc3RyaW5nLmxlbmd0aCkgKiAxMDA7XG4gICAgfVxuXG4gICAgLy9cbiAgICBpZiAoIXNsaWNlKSB7XG4gICAgICByZXR1cm4gc2NvcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzdWJzdHJzID0gdG9TdWJzdHJpbmdzKHN0cik7XG4gICAgICBmb3IgKHZhciBpbmRleDIgPSAwOyBpbmRleDIgPCBzdWJzdHJzLmxlbmd0aCAtIDE7IGluZGV4MisrKSB7XG4gICAgICAgIHZhciBzdWJzY29yZSA9IHNpbWlsYXJpdHlTY29yZShzdWJzdHJzW2luZGV4Ml0sIHN0cmluZywgZmFsc2UpO1xuICAgICAgICBzY29yZSA9IHNjb3JlICsgc3Vic2NvcmUgLyBzdWJzdHJzLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNjb3JlOyAvLyAvIHN1YnN0cnMubGVuZ3RoXG4gICAgfVxuICB9XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGd1aWQ6IGd1aWQsXG4gIGFzc2lnbjogYXNzaWduLFxuICBzaW1pbGFyaXR5U2NvcmU6IHNpbWlsYXJpdHlTY29yZSxcbn07XG4iXX0=

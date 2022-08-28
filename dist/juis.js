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
- exclude element from usual validation:
  - `options.noValidate` : array of element id that will skip usual validation. 
  They still can be validated by extravalidators.
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
    noValidate: [],
    validatableTags: ["input", "select", "textarea"],
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
        var elem = elems[i2];
        if (elem.reportValidity !== undefined && elem.reportValidity !== null) {
          validatables.push(elem);
        }
      }
    }
    for (var index = 0; index < validatables.length; index++) {
      if (
        this.options.noValidate.indexOf(
          validatables[index].getAttribute("id")
        ) === -1
      ) {
        rv =
          rv &&
          validatables[index].reportValidity() &&
          callExtraValidator(validatables[index], this.options.extraValidators);
        console.log(rv);
      } else {
        rv =
          rv &&
          callExtraValidator(validatables[index], this.options.extraValidators);
        console.log(rv);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL21zZi5qcyIsInNyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBndWlkID0gcmVxdWlyZShcIi4vdXRpbHNcIikuZ3VpZDtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIHNpbWlsYXJpdHlTY29yZSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLnNpbWlsYXJpdHlTY29yZTtcblxuZnVuY3Rpb24gaW5pQXV0b2NvbXBsZXRlKCkge1xuICB2YXIgREVGQVVMVF9PUFRJT05TID0ge1xuICAgIGZpbHRlcjogZmlsdGVyLFxuXG4gICAgZXh0cmFjdFZhbHVlOiBfZXh0cmFjdFZhbHVlLFxuICAgIHNvcnQ6IG51bGwsXG4gICAgZHJvcERvd25DbGFzc2VzOiBbXCJkcm9wZG93blwiXSxcbiAgICBkcm9wRG93bkl0ZW1DbGFzc2VzOiBbXSxcbiAgICBkcm9wRG93blRhZzogXCJkaXZcIixcbiAgICBoaWRlSXRlbTogaGlkZUl0ZW0sXG4gICAgc2hvd0l0ZW06IHNob3dJdGVtLFxuICAgIHNob3dMaXN0OiBzaG93TGlzdCxcbiAgICBoaWRlTGlzdDogaGlkZUxpc3QsXG4gICAgb25JdGVtU2VsZWN0ZWQ6IG9uSXRlbVNlbGVjdGVkLFxuICAgIGFjdGl2ZUNsYXNzOiBcImFjdGl2ZVwiLFxuICAgIGlzVmlzaWJsZTogaXNWaXNpYmxlLFxuICAgIG9uTGlzdEl0ZW1DcmVhdGVkOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGlzVmlzaWJsZShlbGVtZW50KSB7XG4gICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uSXRlbVNlbGVjdGVkKGlucHV0LCBpdGVtLCBodG1sRWxlbWVudCwgYXV0Y29tcGxldGUpIHtcbiAgICBpbnB1dC52YWx1ZSA9IGl0ZW0udGV4dDtcbiAgICBhdXRjb21wbGV0ZS5oaWRlKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93TGlzdChsKSB7XG4gICAgbC5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVMaXN0KGwpIHtcbiAgICBsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVJdGVtKGUpIHtcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dJdGVtKGUpIHtcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgZnVuY3Rpb24gc29ydCh2YWx1ZSwgZGF0YSkge1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgZnVuY3Rpb24gX2V4dHJhY3RWYWx1ZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0LnRleHQgfHwgb2JqZWN0O1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyKHZhbHVlLCBkYXRhLCBleHRyYWN0VmFsdWUpIHtcbiAgICBpZiAoZXh0cmFjdFZhbHVlID09PSB1bmRlZmluZWQgfHwgZXh0cmFjdFZhbHVlID09PSBudWxsKSB7XG4gICAgICBleHRyYWN0VmFsdWUgPSBfZXh0cmFjdFZhbHVlO1xuICAgIH1cblxuICAgIHZhciBzY29yZXMgPSB7fTtcbiAgICB2YXIgX2RhdGEgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBpdGVtVmFsdWUgPSBleHRyYWN0VmFsdWUoZGF0YVtpbmRleF0pO1xuICAgICAgdmFyIHNjb3JlID0gc2ltaWxhcml0eVNjb3JlKHZhbHVlLCBpdGVtVmFsdWUpO1xuICAgICAgaWYgKHNjb3JlID4gMCkge1xuICAgICAgICBfZGF0YS5wdXNoKGRhdGFbaW5kZXhdKTtcbiAgICAgICAgc2NvcmVzW2l0ZW1WYWx1ZV0gPSBzY29yZTtcbiAgICAgIH1cbiAgICB9XG4gICAgX2RhdGEgPSBfZGF0YS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICB2YXIgc2NvcmVBID0gc2NvcmVzW2V4dHJhY3RWYWx1ZShhKV07XG4gICAgICB2YXIgc2NvcmVCID0gc2NvcmVzW2V4dHJhY3RWYWx1ZShiKV07XG4gICAgICByZXR1cm4gc2NvcmVCIC0gc2NvcmVBO1xuICAgIH0pO1xuICAgIHJldHVybiBfZGF0YTtcbiAgfVxuXG4gIC8vIGdlbmVyYXRlIHVuaXF1ZSBpZFxuXG4gIGZ1bmN0aW9uIEF1dG9jb21wbGV0ZShpbnB1dCwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmZpeERhdGEoZGF0YSk7XG4gICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMuZGF0YTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQgPSAtMTtcblxuICAgIHRoaXMuZHJvcGRvd25JdGVtcyA9IFtdO1xuXG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCBERUZBVUxUX09QVElPTlMsIG9wdGlvbnMgfHwge30pO1xuICAgIHRoaXMucGFyZW50Tm9kZSA9IGlucHV0LnBhcmVudE5vZGU7XG4gICAgdGhpcy5jcmVhdGVMaXN0ID0gdGhpcy5fY3JlYXRlTGlzdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuY3JlYXRlSXRlbSA9IHRoaXMuX2NyZWF0ZUl0ZW0uYmluZCh0aGlzKTtcbiAgICB0aGlzLnVwZGF0ZURhdGEgPSB0aGlzLl91cGRhdGVEYXRhLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zaG93ID0gdGhpcy5fc2hvdy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuaGlkZSA9IHRoaXMuX2hpZGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLmZpbHRlciA9IHRoaXMuX2ZpbHRlci5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc29ydCA9IHRoaXMuX3NvcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmFjdGl2YXRlTmV4dCA9IHRoaXMuX2FjdGl2YXRlTmV4dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWN0aXZhdGVQcmV2ID0gdGhpcy5fYWN0aXZhdGVQcmV2LmJpbmQodGhpcyk7XG4gICAgdGhpcy5zZWxlY3RBY3RpdmUgPSB0aGlzLl9zZWxlY3RBY3RpdmUuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlO1xuXG4gICAgdGhpcy5zZXR1cExpc3RlbmVycyA9IHRoaXMuX3NldHVwX2xpc3RlbmVycztcbiAgICB0aGlzLmxpc3QgPSB0aGlzLmNyZWF0ZUxpc3QoKTtcbiAgICB0aGlzLmhpZGUoKTtcbiAgICB0aGlzLnNldHVwTGlzdGVuZXJzKCk7XG4gIH1cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5maXhEYXRhID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICB2YXIgcnYgPSBbXTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gZGF0YVtpbmRleF07XG4gICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbGVtZW50ID0geyB0ZXh0OiBlbGVtZW50IH07XG4gICAgICB9XG4gICAgICBlbGVtZW50Ll91aWQgPSBndWlkKCk7XG4gICAgICBydi5wdXNoKGVsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gcnY7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc2V0dXBfbGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgdmFyIGlucHV0ID0gc2VsZi5pbnB1dDtcbiAgICAgIGlmIChzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICB9XG4gICAgICBzZWxmLmZpbHRlcihpbnB1dC52YWx1ZSk7XG4gICAgICBzZWxmLnNvcnQoaW5wdXQudmFsdWUpO1xuICAgICAgc2VsZi5zaG93KCk7XG4gICAgfSk7XG5cbiAgICAvKmV4ZWN1dGUgYSBmdW5jdGlvbiBwcmVzc2VzIGEga2V5IG9uIHRoZSBrZXlib2FyZDoqL1xuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICghc2VsZi5pc1Nob3duKSB7XG4gICAgICAgIHNlbGYuc2hvdygpO1xuICAgICAgfVxuICAgICAgaWYgKGUua2V5Q29kZSA9PSA0MCkge1xuICAgICAgICAvLyBkb3duIGtleVxuICAgICAgICBzZWxmLmFjdGl2YXRlTmV4dCgpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMzgpIHtcbiAgICAgICAgLy8gdXAga2V5XG4gICAgICAgIHNlbGYuYWN0aXZhdGVQcmV2KCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAxMykge1xuICAgICAgICAvLyBlbnRlclxuICAgICAgICBzZWxmLnNlbGVjdEFjdGl2ZSgpO1xuICAgICAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gMjcpIHtcbiAgICAgICAgLy8gZXNjYXBlXG4gICAgICAgIGlmIChzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3VwZGF0ZURhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IHRoaXMuZml4RGF0YShkYXRhKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXN0SXRlbSA9IDA7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZmlsdGVyZWQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgaHRtbEVsZW1lbnQgPSB0aGlzLmRyb3Bkb3duSXRlbXNbdGhpcy5maWx0ZXJlZFtpbmRleF0uX3VpZF07XG4gICAgICBpZiAoaHRtbEVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0aGlzLm9wdGlvbnMuc2hvd0l0ZW0oaHRtbEVsZW1lbnQpO1xuICAgICAgdGhpcy5saXN0Lmluc2VydEJlZm9yZShodG1sRWxlbWVudCwgdGhpcy5saXN0LmNoaWxkcmVuW2xhc3RJdGVtXSk7XG4gICAgICBsYXN0SXRlbSsrO1xuICAgIH1cblxuICAgIGZvciAoaW5kZXggPSBsYXN0SXRlbTsgaW5kZXggPCB0aGlzLmxpc3QuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY2hpbGQgPSB0aGlzLmxpc3QuY2hpbGROb2Rlc1tpbmRleF07XG4gICAgICB0aGlzLm9wdGlvbnMuaGlkZUl0ZW0oY2hpbGQpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9ucy5zaG93TGlzdCh0aGlzLmxpc3QpO1xuICAgIHRoaXMuaXNTaG93biA9IHRydWU7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fZmlsdGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy5maWx0ZXJlZCA9IHRoaXMuZGF0YTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZpbHRlciAhPSBudWxsKSB7XG4gICAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5vcHRpb25zLmZpbHRlcihcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIHRoaXMuZGF0YSxcbiAgICAgICAgdGhpcy5vcHRpb25zLmV4dHJhY3RWYWx1ZVxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fc29ydCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc29ydCAhPSBudWxsKSB7XG4gICAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5vcHRpb25zLnNvcnQodmFsdWUsIHRoaXMuZmlsdGVyZWQpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9jcmVhdGVMaXN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0aGlzLm9wdGlvbnMuZHJvcERvd25UYWcpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLm9wdGlvbnMuZHJvcERvd25DbGFzc2VzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgYS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5kcm9wRG93bkNsYXNzZXNbaW5kZXhdKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLmRhdGFbaV07XG4gICAgICB2YXIgYiA9IHRoaXMuY3JlYXRlSXRlbShpdGVtKTtcbiAgICAgIGEuYXBwZW5kQ2hpbGQoYik7XG4gICAgfVxuXG4gICAgdGhpcy5pbnB1dC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGEpO1xuICAgIHJldHVybiBhO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2NyZWF0ZUl0ZW0gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgIC8qY3JlYXRlIGEgRElWIGVsZW1lbnQgZm9yIGVhY2ggbWF0Y2hpbmcgZWxlbWVudDoqL1xuICAgIHZhciBodG1sRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIik7XG4gICAgLyptYWtlIHRoZSBtYXRjaGluZyBsZXR0ZXJzIGJvbGQ6Ki9cblxuICAgIHZhciB0ZXh0ID0gaXRlbS50ZXh0O1xuICAgIHZhciBfdWlkID0gaXRlbS5fdWlkO1xuXG4gICAgaHRtbEVsZW1lbnQuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgIHZhciBhdHRycyA9IGl0ZW0uYXR0cnMgfHwge307XG4gICAgdmFyIGF0dHJzS2V5cyA9IE9iamVjdC5rZXlzKGF0dHJzKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgYXR0cnNLZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGtleSA9IGF0dHJzS2V5c1tpbmRleF07XG4gICAgICB2YXIgdmFsID0gYXR0cnNba2V5XTtcbiAgICAgIGh0bWxFbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgfVxuXG4gICAgZm9yIChcbiAgICAgIHZhciBpbmRleDIgPSAwO1xuICAgICAgaW5kZXgyIDwgdGhpcy5vcHRpb25zLmRyb3BEb3duSXRlbUNsYXNzZXMubGVuZ3RoO1xuICAgICAgaW5kZXgyKytcbiAgICApIHtcbiAgICAgIGh0bWxFbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmRyb3BEb3duSXRlbUNsYXNzZXNbaW5kZXgyXSk7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wZG93bkl0ZW1zW191aWRdID0gaHRtbEVsZW1lbnQ7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgaHRtbEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBzZWxmLm9wdGlvbnMub25JdGVtU2VsZWN0ZWQoc2VsZi5pbnB1dCwgaXRlbSwgaHRtbEVsZW1lbnQsIHNlbGYpO1xuICAgIH0pO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkICE9PSBudWxsICYmXG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQgIT09IHVuZGVmaW5lZFxuICAgICkge1xuICAgICAgdGhpcy5vcHRpb25zLm9uTGlzdEl0ZW1DcmVhdGVkKGh0bWxFbGVtZW50LCBpdGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaHRtbEVsZW1lbnQ7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVDbG9zZXN0ID0gZnVuY3Rpb24gKGluZGV4LCBkaXIpIHtcbiAgICBmb3IgKHZhciBpID0gaW5kZXg7IGkgPCB0aGlzLmxpc3QuY2hpbGROb2Rlcy5sZW5ndGg7ICkge1xuICAgICAgdmFyIGUgPSB0aGlzLmxpc3QuY2hpbGROb2Rlc1tpXTtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaXNWaXNpYmxlKGUpKSB7XG4gICAgICAgIGUuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChkaXIgPiAwKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGktLTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fZGVhY3RpdmF0ZUFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWxsID0gdGhpcy5saXN0LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuXCIgKyB0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhbGwubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBhbGxbaW5kZXhdLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fYWN0aXZhdGVOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2RlYWN0aXZhdGVBbGwoKTtcbiAgICB0aGlzLmFjdGl2ZUVsZW1lbnQrKztcbiAgICB0aGlzLl9hY3RpdmF0ZUNsb3Nlc3QodGhpcy5hY3RpdmVFbGVtZW50LCAxKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZVByZXYgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVhY3RpdmF0ZUFsbCgpO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudC0tO1xuICAgIHRoaXMuX2FjdGl2YXRlQ2xvc2VzdCh0aGlzLmFjdGl2ZUVsZW1lbnQsIC0xKTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zZWxlY3RBY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjdGl2ZSA9IHRoaXMubGlzdC5xdWVyeVNlbGVjdG9yKFwiLlwiICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICBpZiAoYWN0aXZlICE9PSBudWxsICYmIGFjdGl2ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhY3RpdmUuY2xpY2soKTtcbiAgICB9XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5faGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9wdGlvbnMuaGlkZUxpc3QodGhpcy5saXN0KTtcbiAgICB0aGlzLmlzU2hvd24gPSBmYWxzZTtcbiAgfTtcblxuICByZXR1cm4gQXV0b2NvbXBsZXRlO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0gaW5pQXV0b2NvbXBsZXRlO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgZ3VpZCA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmd1aWQ7XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBhc3NpZ24gPSByZXF1aXJlKFwiLi91dGlsc1wiKS5hc3NpZ247XG5cbmZ1bmN0aW9uIGluaXRDaGlwcygpIHtcbiAgdmFyIERFRkFVTFRfU0VUVElOR1MgPSB7XG4gICAgY3JlYXRlSW5wdXQ6IHRydWUsXG4gICAgY2hpcHNDbGFzczogXCJjaGlwc1wiLFxuICAgIGNoaXBDbGFzczogXCJjaGlwXCIsXG4gICAgY2xvc2VDbGFzczogXCJjaGlwLWNsb3NlXCIsXG4gICAgY2hpcElucHV0Q2xhc3M6IFwiY2hpcC1pbnB1dFwiLFxuICAgIGltYWdlV2lkdGg6IDk2LFxuICAgIGltYWdlSGVpZ2h0OiA5NixcbiAgICBjbG9zZTogdHJ1ZSxcbiAgICBvbmNsaWNrOiBudWxsLFxuICAgIG9uY2xvc2U6IG51bGwsXG4gICAgb25jaGFuZ2U6IG51bGwsXG4gIH07XG5cbiAgdmFyIGNoaXBEYXRhID0ge1xuICAgIF91aWQ6IG51bGwsXG4gICAgdGV4dDogXCJcIixcbiAgICBpbWc6IFwiXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIHRhYmluZGV4OiBcIjBcIixcbiAgICB9LFxuICAgIGNsb3NlQ2xhc3NlczogbnVsbCxcbiAgICBjbG9zZUhUTUw6IG51bGwsXG4gICAgb25jbGljazogbnVsbCxcbiAgICBvbmNsb3NlOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoaWxkKHRhZywgYXR0cmlidXRlcywgY2xhc3NlcywgcGFyZW50KSB7XG4gICAgdmFyIGVsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB2YXIgYXR0cnNLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGVsZS5zZXRBdHRyaWJ1dGUoYXR0cnNLZXlzW2luZGV4XSwgYXR0cmlidXRlc1thdHRyc0tleXNbaW5kZXhdXSk7XG4gICAgfVxuICAgIGZvciAodmFyIGNsYXNzSW5kZXggPSAwOyBjbGFzc0luZGV4IDwgY2xhc3Nlcy5sZW5ndGg7IGNsYXNzSW5kZXgrKykge1xuICAgICAgdmFyIGtscyA9IGNsYXNzZXNbY2xhc3NJbmRleF07XG4gICAgICBlbGUuY2xhc3NMaXN0LmFkZChrbHMpO1xuICAgIH1cbiAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBfY3JlYXRlX2NoaXAsIFRoaXMgaXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24sIGFjY2Vzc2VkIGJ5IHRoZSBDaGlwcy5fYWRkQ2hpcCBtZXRob2RcbiAgICogQHBhcmFtIHsqfSBkYXRhIFRoZSBjaGlwIGRhdGEgdG8gY3JlYXRlLFxuICAgKiBAcmV0dXJucyBIVE1MRWxlbWVudFxuICAgKi9cbiAgZnVuY3Rpb24gX2NyZWF0ZUNoaXAoZGF0YSkge1xuICAgIGRhdGEgPSBhc3NpZ24oe30sIGNoaXBEYXRhLCBkYXRhKTtcbiAgICB2YXIgYXR0cnMgPSBhc3NpZ24oZGF0YS5hdHRycywgeyBcImNoaXAtaWRcIjogZGF0YS5fdWlkIH0pO1xuICAgIHZhciBjaGlwID0gY3JlYXRlQ2hpbGQoXCJkaXZcIiwgYXR0cnMsIFtcImNoaXBcIl0sIG51bGwpO1xuXG4gICAgZnVuY3Rpb24gY2xvc2VDYWxsYmFjayhlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZGF0YS5vbmNsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsaWNrQ2FsbGJhY2soZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGlmIChkYXRhLm9uY2xpY2sgIT09IG51bGwgJiYgZGF0YS5vbmNsaWNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLmltYWdlKSB7XG4gICAgICBjcmVhdGVDaGlsZChcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAge1xuICAgICAgICAgIHdpZHRoOiBkYXRhLmltYWdlV2lkdGggfHwgOTYsXG4gICAgICAgICAgaGVpZ2h0OiBkYXRhLmltYWdlSGVpZ2h0IHx8IDk2LFxuICAgICAgICAgIHNyYzogZGF0YS5pbWFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgW10sXG4gICAgICAgIGNoaXAsXG4gICAgICAgIHt9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGF0YS50ZXh0KSB7XG4gICAgICB2YXIgc3BhbiA9IGNyZWF0ZUNoaWxkKFwic3BhblwiLCB7fSwgW10sIGNoaXAsIHt9KTtcbiAgICAgIHNwYW4uaW5uZXJIVE1MID0gZGF0YS50ZXh0O1xuICAgIH1cbiAgICBpZiAoZGF0YS5jbG9zZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBkYXRhLmNsb3NlQ2xhc3NlcyB8fCBbXCJjaGlwLWNsb3NlXCJdO1xuICAgICAgdmFyIGNsb3NlU3BhbiA9IGNyZWF0ZUNoaWxkKFxuICAgICAgICBcInNwYW5cIixcbiAgICAgICAge30sIC8vIGlkOiBkYXRhLmNsb3NlSWRcbiAgICAgICAgY2xhc3NlcyxcbiAgICAgICAgY2hpcCxcbiAgICAgICAge31cbiAgICAgICk7XG5cbiAgICAgIGNsb3NlU3Bhbi5pbm5lckhUTUwgPSBkYXRhLmNsb3NlSFRNTCB8fCBcIiZ0aW1lc1wiO1xuICAgICAgaWYgKGRhdGEub25jbG9zZSAhPT0gbnVsbCAmJiBkYXRhLm9uY2xvc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9zZVNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQ2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbGlja0NhbGxiYWNrKTtcblxuICAgIHJldHVybiBjaGlwO1xuICB9XG5cbiAgZnVuY3Rpb24gQ2hpcHMoZWxlbWVudCwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCBbXTtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmNoaXBzQ2xhc3MpO1xuXG4gICAgdGhpcy5fc2V0RWxlbWVudExpc3RlbmVycygpO1xuICAgIHRoaXMuaW5wdXQgPSB0aGlzLl9zZXRJbnB1dCgpO1xuICAgIHRoaXMuYWRkQ2hpcCA9IHRoaXMuX2FkZENoaXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZUNoaXAgPSB0aGlzLl9yZW1vdmVDaGlwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXREYXRhID0gdGhpcy5fZ2V0RGF0YS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRBdXRvY29tcGxldGUgPSB0aGlzLl9zZXRBdXRvY29tcGxldGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbmRlciA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIENoaXBzLnByb3RvdHlwZS5fZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgdmFyIHVpZCA9IHRoaXMuX2RhdGFbaW5kZXhdLl91aWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldLl91aWQgPT09IHVpZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgby5wdXNoKHRoaXMuZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB0aGlzLmRhdGFbaW5kZXhdLl9pbmRleCA9IGluZGV4O1xuICAgICAgdGhpcy5hZGRDaGlwKHRoaXMuZGF0YVtpbmRleF0pO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEF1dG9jb21wbGV0ZSA9IGZ1bmN0aW9uIChhdXRvY29tcGxldGVPYmopIHtcbiAgICB0aGlzLm9wdGlvbnMuYXV0b2NvbXBsZXRlID0gYXV0b2NvbXBsZXRlT2JqO1xuICB9O1xuXG4gIC8qKlxuICAgKiBhZGQgY2hpcCB0byBlbGVtZW50IGJ5IHBhc3NlZCBkYXRhXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSBjaGlwIGRhdGEsIFBsZWFzZSBzZWUgYGNoaXBEYXRhYCBkb2N1bW5ldGF0aW9ucy5cbiAgICovXG4gIENoaXBzLnByb3RvdHlwZS5fYWRkQ2hpcCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8gZ2V0IGlucHV0IGVsZW1lbnRcbiAgICB2YXIgZGlzdERhdGEgPSBhc3NpZ24oe30sIHRoaXMub3B0aW9ucywgY2hpcERhdGEsIGRhdGEpO1xuICAgIGRhdGEgPSBhc3NpZ24oXG4gICAgICB7IG9uY2xpY2s6IHRoaXMub3B0aW9ucy5vbmNsaWNrLCBvbmNsb3NlOiB0aGlzLm9wdGlvbnMub25jbG9zZSB9LFxuICAgICAgZGF0YVxuICAgICk7XG5cbiAgICBpZiAoZGF0YS5fdWlkID09PSB1bmRlZmluZWQgfHwgZGF0YS5fdWlkID09PSBudWxsKSB7XG4gICAgICB2YXIgdWlkID0gZ3VpZCgpO1xuICAgICAgZGF0YS5fdWlkID0gdWlkO1xuICAgICAgZGlzdERhdGEuX3VpZCA9IHVpZDtcbiAgICB9XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGlzdERhdGEub25jbGljayA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkaXN0RGF0YSkge1xuICAgICAgc2VsZi5faGFuZGxlQ2hpcENsaWNrLmFwcGx5KHNlbGYsIFtlLCBjaGlwLCBkYXRhXSk7XG4gICAgfTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRpc3REYXRhLm9uY2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGlzdERhdGEpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUNoaXBDbG9zZS5hcHBseShzZWxmLCBbZSwgY2hpcCwgZGF0YV0pO1xuICAgIH07XG5cbiAgICB2YXIgY2hpcCA9IF9jcmVhdGVDaGlwKGRpc3REYXRhKTtcbiAgICB2YXIgaW5wdXQgPSB0aGlzLmlucHV0O1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5wYXJlbnRFbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoY2hpcCwgaW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfVxuICAgIC8vIEF2b2lkIGluZmludGUgbG9vcCwgaWYgcmVjdXJzc2l2ZWx5IGFkZCBkYXRhIHRvIHRoZSB0aGlzLmRhdGEgd2hpbGUgcmVuZGVyIGlzIHRlcmF0aW5nXG4gICAgLy8gb3ZlciBpdC5cbiAgICBpZiAoZGF0YS5faW5kZXggIT09IHVuZGVmaW5lZCAmJiBkYXRhLl9pbmRleCAhPT0gbnVsbCkge1xuICAgICAgdmFyIGluZGV4ID0gZGF0YS5faW5kZXg7XG4gICAgICBkZWxldGUgZGF0YS5faW5kZXg7XG4gICAgICB0aGlzLmRhdGFbaW5kZXhdID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YSk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGF0YS5wdXNoKGRpc3REYXRhKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSBudWxsICYmIHRoaXMub3B0aW9ucy5vbmNoYW5nZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UodGhpcy5nZXREYXRhKCkpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldElucHV0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbnB1dCA9IG51bGw7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5pbnB1dCAhPT0gbnVsbCAmJiB0aGlzLm9wdGlvbnMuaW5wdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuaW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBpbnB1dHMgPSB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoaXBJbnB1dENsYXNzXG4gICAgICApO1xuICAgICAgaWYgKGlucHV0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlucHV0ID0gaW5wdXRzWzBdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNyZWF0ZUlucHV0KSB7XG4gICAgICAgIC8vIGNyZWF0ZSBpbnB1dCBhbmQgYXBwZW5kIHRvIGVsZW1lbnRcbiAgICAgICAgaW5wdXQgPSBjcmVhdGVDaGlsZChcbiAgICAgICAgICBcImlucHV0XCIsXG4gICAgICAgICAgeyBwbGFjZWhvbGRlcjogdGhpcy5vcHRpb25zLnBsYWNlaG9sZGVyIHx8IFwiXCIgfSxcbiAgICAgICAgICBbdGhpcy5vcHRpb25zLmNoaXBJbnB1dENsYXNzXSxcbiAgICAgICAgICB0aGlzLmVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIHNldCBldmVudCBsaXN0ZW5lclxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c291dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcImZvY3VzXCIpO1xuICAgIH0pO1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgc2VsZi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJmb2N1c1wiKTtcbiAgICB9KTtcblxuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAvLyBlbnRlclxuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgLy8gT3ZlcnJpZGUgZW50ZXIgaWYgYXV0b2NvbXBsZXRpbmcuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlICE9PSBudWxsICYmXG4gICAgICAgICAgc2VsZi5vcHRpb25zLmF1dG9jb21wbGV0ZS5pc1Nob3duXG4gICAgICAgICkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQudmFsdWUgIT09IFwiXCIpIHtcbiAgICAgICAgICBzZWxmLmFkZENoaXAoe1xuICAgICAgICAgICAgdGV4dDogaW5wdXQudmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGlucHV0O1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0RWxlbWVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmlucHV0LmZvY3VzKCk7XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIWUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhzZWxmLm9wdGlvbnMuY2hpcENsYXNzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDggfHwgZS5rZXlDb2RlID09PSA0Nikge1xuICAgICAgICBzZWxmLl9oYW5kbGVDaGlwRGVsZXRlKGUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBDbGljayA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkYXRhKSB7XG4gICAgZS50YXJnZXQuZm9jdXMoKTtcbiAgICBpZiAoZGF0YS5vbmNsaWNrICE9PSB1bmRlZmluZWQgJiYgZGF0YS5vbmNsaWNrICE9PSBudWxsKSB7XG4gICAgICBkYXRhLm9uY2xpY2soZSwgY2hpcCwgZGF0YSk7XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fZGVsZXRlQ2hpcERhdGEgPSBmdW5jdGlvbiAodWlkKSB7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuX2RhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAodGhpcy5fZGF0YVtpbmRleF0gIT09IHVuZGVmaW5lZCAmJiB0aGlzLl9kYXRhW2luZGV4XSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAodWlkID09PSB0aGlzLl9kYXRhW2luZGV4XS5fdWlkKSB7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuX2RhdGFbaW5kZXhdO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBDbG9zZSA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkYXRhKSB7XG4gICAgaWYgKHRoaXMuX2RlbGV0ZUNoaXBEYXRhKGRhdGEuX3VpZCkpIHtcbiAgICAgIGNoaXAucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChjaGlwKTtcbiAgICAgIGlmIChkYXRhLm9uY2xvc2UgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm9uY2xvc2UgIT09IG51bGwpIHtcbiAgICAgICAgZGF0YS5vbmNsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UgIT09IG51bGwgJiZcbiAgICAgICAgdGhpcy5vcHRpb25zLm9uY2hhbmdlICE9PSB1bmRlZmluZWRcbiAgICAgICkge1xuICAgICAgICB0aGlzLm9wdGlvbnMub25jaGFuZ2UodGhpcy5nZXREYXRhKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3JlbW92ZUNoaXAgPSBmdW5jdGlvbiAoY2hpcElkKSB7XG4gICAgdmFyIGNoaXAgPSBudWxsO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IHRoaXMuZWxlbWVudC5jaGlsZHJlbltpbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIGVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBlbGVtZW50ICE9PSBudWxsICYmXG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKHRoaXMub3B0aW9ucy5jaGlwQ2xhc3MpXG4gICAgICApIHtcbiAgICAgICAgaWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiY2hpcC1pZFwiKSA9PT0gY2hpcElkKSB7XG4gICAgICAgICAgY2hpcCA9IGVsZW1lbnQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaW5kZXgyID0gMDsgaW5kZXgyIDwgdGhpcy5kYXRhLmxlbmd0aDsgaW5kZXgyKyspIHtcbiAgICAgIHZhciBpdGVtID0gdGhpcy5kYXRhW2luZGV4Ml07XG4gICAgICBpZiAoaXRlbSAhPT0gdW5kZWZpbmVkICYmIGl0ZW0gIT09IG51bGwgJiYgaXRlbS5fdWlkID09PSBjaGlwSWQpIHtcbiAgICAgICAgdGhpcy5faGFuZGxlQ2hpcENsb3NlKG51bGwsIGNoaXAsIGl0ZW0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9oYW5kbGVDaGlwRGVsZXRlID0gZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgY2hpcCA9IGUudGFyZ2V0O1xuICAgIHZhciBjaGlwSWQgPSBjaGlwLmdldEF0dHJpYnV0ZShcImNoaXAtaWRcIik7XG4gICAgaWYgKGNoaXBJZCA9PT0gdW5kZWZpbmVkIHx8IGNoaXBJZCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJZb3UgIHNob3VsZCBwcm92aWRlIGNoaXBJZFwiKTtcbiAgICB9XG4gICAgdmFyIGRhdGEgPSB7fTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLmRhdGFbaW5kZXhdO1xuICAgICAgaWYgKFxuICAgICAgICBlbGVtZW50ICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgZWxlbWVudCAhPT0gbnVsbCAmJlxuICAgICAgICBlbGVtZW50Ll91aWQgPT09IGNoaXBJZFxuICAgICAgKSB7XG4gICAgICAgIGRhdGEgPSBlbGVtZW50O1xuICAgICAgICB0aGlzLl9oYW5kbGVDaGlwQ2xvc2UoZSwgY2hpcCwgZGF0YSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgRXJyb3IoXCJjYW4ndCBmaW5kIGRhdGEgd2l0aCBpZDogXCIgKyBjaGlwSWQsIHRoaXMuZGF0YSk7XG4gIH07XG5cbiAgcmV0dXJuIENoaXBzO1xufVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRDaGlwcztcbiIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbml0Q2hpcHMgPSByZXF1aXJlKFwiLi9jaGlwc1wiKTtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbnZhciBpbml0QXV0b2NvbXBsZXRlID0gcmVxdWlyZShcIi4vYXV0b2NvbXBsZXRlXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxudmFyIGludE1TRiA9IHJlcXVpcmUoXCIuL21zZlwiKTtcblxudmFyIGp1aXMgPSB7fTtcbmp1aXMuQ2hpcHMgPSBpbml0Q2hpcHMoKTtcbmp1aXMuQXV0b2NvbXBsZXRlID0gaW5pdEF1dG9jb21wbGV0ZSgpO1xuanVpcy5NdWx0aVN0ZXBGb3JtID0gaW50TVNGKCk7XG5qdWlzLk1TRiA9IGp1aXMuTXVsdGlTdGVwRm9ybTtcblxuaWYgKHdpbmRvdyAhPT0gdW5kZWZpbmVkICYmIHdpbmRvdyAhPT0gbnVsbCkge1xuICB3aW5kb3cuanVpcyA9IGp1aXMgfHwge307XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0ganVpcztcbiIsIi8qXG5UbyB1c2UgdGhpcyBtdWx0aSBzdGVwIGZvcm1cbi0gZGl2aWRlIHlvdXIgZm9ybSBpbnRvIHN0ZXBzLCBlYWNoIG9uZSBpcyBhIEhUTUxFbGVtZW50IHdpdGggYGZvcm0tc3RlcGAgXG4gIGNsYXNzIChZb3UgY2FuIGN1c3RvbWl6ZSB0aGlzIGJ5IGBvcHRpb25zLmZvcm1TdGVwQ2xhc3NgKS5cbi0gQXZvaWQgY3JlYXRpbmcgXCJzdWJtaXQgYnRuXCIgaW5zaWRlIHRoZSBmb3JtLlxuLSBJZiB5b3UgY3JlYXRlIHN1Ym1pdCBidXR0b24uIGdpdmUgb25lIG9mIHRoZSB2YWxpZCBhbHRlclN1Ym1pdEJ0biBzdHJhdGVnaWVzLiBWYWxpZCB2YWx1ZXMgaW5jbHVkZSBbbnVsbCwgJ25leHQnLCAnaGlkZSddXG4gIERlZmF1bHQgaXMgYG5leHRgLCBUaGlzIG1lYW5zIHRoYXQsIFRoZSBzdWJtaXQgYnV0dG9uIGBvbmNsaWNrYCAmIGBvbnN1Ym1pdGAgZXZlbnRzIHdpbGwgd29yayBhcyBgc2hvd05leHQoKWBcbi0gVXNlIHRoZSBleHRlcm5hbCBBUEk6XG4gIHZhciBtc2YgPSB0b011bHRpU3RlcEZvcm0oZm9ybSk7XG4gIG1zZi5zaG93Rmlyc3QoKTtcbiAgbXNmLnNob3dOZXh0KCk7XG4gIG1zZi5zaG93UHJldigpO1xuICBtc2YubW92ZVRvKCk7XG4gIFxuLSBMaXN0ZW4gdG8gZXZlbnRzOlxuICBvcHRpb25zLm9uU3RlcFNob3duKCkgLy8gcmVjZWl2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50ICYgc3RlcCBpbmRleCBhcyBzZWNvbmQgYXJndW1lbnQuXG4gIG9wdGlvbnMub25TdGVwSGlkZSgpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudCAmIHN0ZXAgaW5kZXggYXMgc2Vjb25kIGFyZ3VtZW50LlxuXG4tIEN1c3RvbWl6ZSBob3cgeW91ciBmb3JtIHN0ZXBzIGFyZSBkZWZpbmVkOlxuICBCeSBkZWZhdWx0LCBlYWNoIGZvcm0gc3RlcCBzaG91bGQgaGF2ZSBgZm9ybS1zdGVwYCBjbGFzcywgWW91IGNhbiBwcm92aWRlIHlvdXIgXG4gIGN1c3RvbSBjbGFzcyBieSBgb3B0aW9ucy5mb3JtU3RlcENsYXNzYFxuXG4tIEN1c3RvbWl6ZSB0aGUgZWxlbWVudCBzaG93ICYgaGlkZSBtZXRob2RzOlxuICBvcHRpb25zLmhpZGVGdW4oKSAvLyByZWNyaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgJiB0aGUgZWxlbWVudCB0byBoaWRlIGFzIHNlY29uZCBvbmUuXG4gIG9wdGlvbnMuc2hvd0Z1bigpIC8vIHJlY2VpdmVzIG1zZiBhcyBmaXJzdCBhcmd1bWVudCAmIHRoZSBlbGVtZW50IHRvIHNob3cgYXMgc2Vjb25kIG9uZS5cbiAgQnkgZGVmYXVsdCwgV2UgdG9nZ2xlIHRoZSBlbGVtZW50LnN0eWxlLmRpc3BsYXkgYXR0cmlidXRlLCAnbm9uZScgfHwgJ2Jsb2NrJ1xuXG4tIEN1c3RvbWl6ZSB0aGUgd2F5IHRvIHN0b3JlICYgZ2V0IHRoZSBjdXJyZW50IHN0ZXAgOlxuICBvcHRpb25zLmdldEN1cnJlbnRTdGVwKCkgLy8gcmVjZWl2ZXMgbXNmIGFzIGZpcnN0IGFyZ3VtZW50LlxuICBvcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAoKSAvLyByZWNlaXZlcyBtc2YgYXMgZmlyc3QgYXJndW1lbnQgYW5kIHRoZSBjdXJyZW50IHN0ZXAgaW5kZXggYXMgc2Vjb25kIG9uZS5cbiAgVGhpcyBmdW5jdGlvbnMgYXJlIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBzdG9yZSBzdGVwIGluZGV4IHNvbWV3aGVyZSBsaWtlOiBzZXNzaW9uLCBxdWVyeSBzdHJpbmdzIGV0Yy5cblxuLSBDdXN0b21pemUgdGhlIGZvcm0gc3VibWl0OlxuICAtIHRvZ2dsZSBzdWJtaXQgZm9ybSBvbiB0aGUgbGFzdCBzdGVwOlxuICAgIG9wdGlvbnMuc3VibWl0T25FbmQgIC8vIGRlZmF1bHQgaXMgdHJ1ZSB3aGljaCBtZWFucyB0aGF0IHRoZSBtc2Ygd2lsbCBzdWJtaXQgdGhlIGZvcm0gYWZ0ZXIgdGhlIGxhc3Qgc3RlcC5cbiAgICBvcHRpb25zLnN1Ym1pdEZ1bigpICAvLyBUaGUgZnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWQgYXMgdGhlIGZvcm0gc3VibWlzc2lvbiBmdW5jdGlvbi4gSXQgcmVjaWV2ZXMgdGhlIG1zZiBhcyBmaXJzdCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcmd1bWVudCAmIHlvdSBjYW4gYWNjY2VzcyB0aGUgZm9ybSBlbGVtZW50IGJ5IGBtc2YuZm9ybWAuXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCwgV2UgdXNlIGBmb3JtLnN1Ym1pdCgpYFxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJ1dCB5b3UgY2FuIGNoYW5nZSB0aGlzIGlmIHlvdSBuZWVkLiBGb3IgZXhhbXBsZTouIHNob3cgbWVzc2FnZSBiZWZvcmUgb3Igc3VibWl0IGJ5IGBhamF4YC5cbiAgXG4tIFByb3ZpZGUgZXh0cmEgZm9ybSB2YWxpZGF0b3JzOlxuICAtIGBvcHRpb25zLmV4dHJhdmFsaWRhdG9yc2AgOiB0aGlzIG9iamVjdCBtYXAgZm9ybSBmaWVsZCBpZCB0byBhIHNpbmdsZSBmdW5jdGlvbiB0aGF0IHNob3VsZCB2YWxpZGF0ZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGZ1bmN0aW9uIHdpbGwgcmVjaWV2ZSB0aGUgSFRNTEVsZW1lbnQgYXMgc2luZ2xlIGFyZ3VtZW50ICYgc2hvdWxkIHJldHVybiBgdHJ1ZWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgdmFsaWRhdGlvbiBzdWNjZXNzIG9yIGBmYWxzZWAgaWYgZmFpbGVkLlxuLSBleGNsdWRlIGVsZW1lbnQgZnJvbSB1c3VhbCB2YWxpZGF0aW9uOlxuICAtIGBvcHRpb25zLm5vVmFsaWRhdGVgIDogYXJyYXkgb2YgZWxlbWVudCBpZCB0aGF0IHdpbGwgc2tpcCB1c3VhbCB2YWxpZGF0aW9uLiBcbiAgVGhleSBzdGlsbCBjYW4gYmUgdmFsaWRhdGVkIGJ5IGV4dHJhdmFsaWRhdG9ycy5cbiovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcblxuZnVuY3Rpb24gaW5pdE1TRigpIHtcbiAgdmFyIERFRkFVTFQgPSB7XG4gICAgZm9ybVN0ZXBDbGFzczogXCJmb3JtLXN0ZXBcIixcbiAgICAvL1xuICAgIGdldEN1cnJlbnRTdGVwOiBudWxsLFxuICAgIHN0b3JlQ3VycmVudFN0ZXA6IG51bGwsXG4gICAgb25TdGVwU2hvd246IG51bGwsXG4gICAgb25TdGVwSGlkZTogbnVsbCxcbiAgICBoaWRlRnVuOiBudWxsLFxuICAgIHNob3dGdW46IG51bGwsXG4gICAgc3VibWl0RnVuOiBudWxsLFxuICAgIGFsdGVyU3VibWl0QnRuOiBudWxsLCAvLyBbICduZXh0JywgJ251bGwnLiBudWxsLCAnaGlkZSddXG4gICAgc3VibWl0T25FbmQ6IGZhbHNlLFxuICAgIGV4dHJhVmFsaWRhdG9yczoge30sXG4gICAgbm9WYWxpZGF0ZTogW10sXG4gICAgdmFsaWRhdGFibGVUYWdzOiBbXCJpbnB1dFwiLCBcInNlbGVjdFwiLCBcInRleHRhcmVhXCJdLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNhbGwoZm4pIHtcbiAgICBpZiAoZm4gPT09IHVuZGVmaW5lZCB8fCBmbiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH1cblxuICBmdW5jdGlvbiBhbHRlclN1Ym1pdEJ0bihmb3JtLCBzdHJhdGVneSwgY2FsbGJhY2spIHtcbiAgICBpZiAoc3RyYXRlZ3kgPT09IG51bGwgfHwgc3RyYXRlZ3kgPT09IFwibnVsbFwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBpbnB1dEVsZW1lbnRzID0gZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpO1xuICAgIHZhciBidXR0b25FbGVtZW50cyA9IGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJidXR0b25cIik7XG4gICAgdmFyIHN1Ym1pdEJ0biA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgaW5wdXRFbGVtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmIChpbnB1dEVsZW1lbnRzW2luZGV4XS5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpID09IFwic3VibWl0XCIpIHtcbiAgICAgICAgc3VibWl0QnRuID0gaW5wdXRFbGVtZW50c1tpbmRleF07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3VibWl0QnRuID09IHVuZGVmaW5lZCkge1xuICAgICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgYnV0dG9uRWxlbWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGlmIChidXR0b25FbGVtZW50c1tpbmRleF0uZ2V0QXR0cmlidXRlKFwidHlwZVwiKSA9PSBcInN1Ym1pdFwiKSB7XG4gICAgICAgICAgc3VibWl0QnRuID0gYnV0dG9uRWxlbWVudHNbaW5kZXhdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdHJhdGVneSA9PSBcIm5leHRcIikge1xuICAgICAgaWYgKHN1Ym1pdEJ0biAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgc3VibWl0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsYmFjayk7XG4gICAgICAgIHN1Ym1pdEJ0bi5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHN0cmF0ZWd5ID09IFwiaGlkZVwiKSB7XG4gICAgICBzdWJtaXRCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIE11bHRpU3RlcEZvcm0oZm9ybSwgb3B0aW9ucykge1xuICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy5fZml4T3B0aW9ucyhvcHRpb25zKTtcbiAgICB0aGlzLmZvcm1TdGVwcyA9IHRoaXMuZm9ybS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgdGhpcy5vcHRpb25zLmZvcm1TdGVwQ2xhc3NcbiAgICApO1xuICAgIHRoaXMuc3RlcExlbmd0aCA9IHRoaXMuZm9ybVN0ZXBzLmxlbmd0aDtcblxuICAgIGlmICh0aGlzLmZvcm1TdGVwcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBcIllvdXIgZm9ybSBoYXMgbm8gc3RlcCBkZWZpbmVkIGJ5IGNsYXNzOiBcIiArIHRoaXMub3B0aW9ucy5mb3JtU3RlcENsYXNzXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnRTdGVwID0gMDtcbiAgICB0aGlzLmluaXRpYWwgPSB0aGlzLl9pbml0aWFsLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zdWJtaXQgPSB0aGlzLl9zdWJtaXQuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlcG9ydFZhbGlkaXR5ID0gdGhpcy5fcmVwb3J0VmFsaWRpdHkuYmluZCh0aGlzKTtcbiAgICB0aGlzLm1vdmVUbyA9IHRoaXMuX21vdmVUby5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd05leHQgPSB0aGlzLl9zaG93TmV4dC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd1ByZXYgPSB0aGlzLl9zaG93UHJldi5iaW5kKHRoaXMpO1xuICAgIHRoaXMuc2hvd0ZpcnN0ID0gdGhpcy5fc2hvd0ZpcnN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXRDdXJyZW50U3RlcCA9IHRoaXMuX2dldEN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5pc0xhc3RTdGVwID0gdGhpcy5faXNMYXN0U3RlcC5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5pbml0aWFsKCk7XG4gICAgdGhpcy5zaG93Rmlyc3QoKTtcbiAgfVxuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9maXhPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFQsIG9wdGlvbnMpO1xuICAgIHRoaXMub3B0aW9ucy5nZXRDdXJyZW50U3RlcCA9XG4gICAgICB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdEdldEN1cnJlbnRTdGVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgPVxuICAgICAgdGhpcy5vcHRpb25zLnN0b3JlQ3VycmVudFN0ZXAgfHwgdGhpcy5fZGVmYXVsdFN0b3JlQ3VycmVudFN0ZXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9wdGlvbnMuc3VibWl0RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4gfHwgdGhpcy5fZGVmYXVsdFN1Ym1pdC5iaW5kKHRoaXMpO1xuICAgIHRoaXMub3B0aW9ucy5zaG93RnVuID1cbiAgICAgIHRoaXMub3B0aW9ucy5zaG93RnVuIHx8IHRoaXMuX2RlZmF1bHRTaG93RnVuLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gPVxuICAgICAgdGhpcy5vcHRpb25zLmhpZGVGdW4gfHwgdGhpcy5fZGVmYXVsdEhpZGVGdW4uYmluZCh0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9pbml0aWFsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBIaWRlIGFsbFxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5mb3JtU3RlcHMubGVuZ3RoOyB4KyspIHtcbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlRnVuKHRoaXMuZm9ybVN0ZXBzW3hdKTtcbiAgICB9XG5cbiAgICBhbHRlclN1Ym1pdEJ0bih0aGlzLmZvcm0sIHRoaXMub3B0aW9ucy5hbHRlclN1Ym1pdEJ0biwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2VsZi5zaG93TmV4dCgpO1xuICAgIH0pO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdWJtaXRGdW4oKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fcmVwb3J0VmFsaWRpdHkgPSBmdW5jdGlvbiAoZWxlKSB7XG4gICAgLy8gcmVwb3J0IHZhbGlkaXR5IG9mIHRoZSBjdXJyZW50IHN0ZXAgJiBpdHMgY2hpbGRyZW5cblxuICAgIGZ1bmN0aW9uIGNhbGxFeHRyYVZhbGlkYXRvcihfZWxlbWVudCwgdmFsaWRhdG9ycykge1xuICAgICAgaWYgKFxuICAgICAgICBfZWxlbWVudCA9PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIF9lbGVtZW50LmdldEF0dHJpYnV0ZSA9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgIHZhbGlkYXRvcnMgPT0gdW5kZWZpbmVkXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgaWQgPSBfZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcbiAgICAgIGlmIChpZCA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICB2YXIgdmFsaWRhdG9yID0gdmFsaWRhdG9yc1tpZF07XG4gICAgICBpZiAodmFsaWRhdG9yID09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2YWxpZGF0b3IoX2VsZW1lbnQpO1xuICAgIH1cblxuICAgIHZhciBydiA9IHRydWU7XG4gICAgdmFyIHZhbGlkYXRhYmxlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vcHRpb25zLnZhbGlkYXRhYmxlVGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGVsZW1zID0gZWxlLnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5vcHRpb25zLnZhbGlkYXRhYmxlVGFnc1tpXSk7XG4gICAgICBmb3IgKHZhciBpMiA9IDA7IGkyIDwgZWxlbXMubGVuZ3RoOyBpMisrKSB7XG4gICAgICAgIHZhciBlbGVtID0gZWxlbXNbaTJdO1xuICAgICAgICBpZiAoZWxlbS5yZXBvcnRWYWxpZGl0eSAhPT0gdW5kZWZpbmVkICYmIGVsZW0ucmVwb3J0VmFsaWRpdHkgIT09IG51bGwpIHtcbiAgICAgICAgICB2YWxpZGF0YWJsZXMucHVzaChlbGVtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdmFsaWRhdGFibGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm9wdGlvbnMubm9WYWxpZGF0ZS5pbmRleE9mKFxuICAgICAgICAgIHZhbGlkYXRhYmxlc1tpbmRleF0uZ2V0QXR0cmlidXRlKFwiaWRcIilcbiAgICAgICAgKSA9PT0gLTFcbiAgICAgICkge1xuICAgICAgICBydiA9XG4gICAgICAgICAgcnYgJiZcbiAgICAgICAgICB2YWxpZGF0YWJsZXNbaW5kZXhdLnJlcG9ydFZhbGlkaXR5KCkgJiZcbiAgICAgICAgICBjYWxsRXh0cmFWYWxpZGF0b3IodmFsaWRhdGFibGVzW2luZGV4XSwgdGhpcy5vcHRpb25zLmV4dHJhVmFsaWRhdG9ycyk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJ2KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJ2ID1cbiAgICAgICAgICBydiAmJlxuICAgICAgICAgIGNhbGxFeHRyYVZhbGlkYXRvcih2YWxpZGF0YWJsZXNbaW5kZXhdLCB0aGlzLm9wdGlvbnMuZXh0cmFWYWxpZGF0b3JzKTtcbiAgICAgICAgY29uc29sZS5sb2cocnYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fbW92ZVRvID0gZnVuY3Rpb24gKHRhcmdldFN0ZXApIHtcbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHdpbGwgZmlndXJlIG91dCB3aGljaCBmb3JtLXN0ZXAgdG8gZGlzcGxheVxuICAgIGlmICh0YXJnZXRTdGVwIDwgMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFN0ZXAgPSB0aGlzLmdldEN1cnJlbnRTdGVwKCk7XG4gICAgLy8gRXhpdCB0aGUgZnVuY3Rpb24gaWYgYW55IGZpZWxkIGluIHRoZSBjdXJyZW50IGZvcm0tc3RlcCBpcyBpbnZhbGlkOlxuICAgIC8vIGFuZCB3YW50cyB0byBnbyBuZXh0XG4gICAgaWYgKFxuICAgICAgdGFyZ2V0U3RlcCA+IGN1cnJlbnRTdGVwICYmXG4gICAgICAhdGhpcy5yZXBvcnRWYWxpZGl0eSh0aGlzLmZvcm1TdGVwc1tjdXJyZW50U3RlcF0pXG4gICAgKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vIGlmIHlvdSBoYXZlIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgZm9ybS4uLlxuICAgIGlmICh0YXJnZXRTdGVwID49IHRoaXMuc3RlcExlbmd0aCkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zdWJtaXRPbkVuZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJtaXQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIFwiTm90aGluZyB0byBkbywgVGhpcyBpcyB0aGUgbGFzdCBzdGVwICYgeW91IHBhc3MgYG9wdGlvbnMuc3VibWl0T25FbmRgPT0gZmFsc2VcIlxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VycmVudFN0ZXAgIT09IHVuZGVmaW5lZCAmJiBjdXJyZW50U3RlcCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuaGlkZUZ1bih0aGlzLmZvcm1TdGVwc1tjdXJyZW50U3RlcF0pO1xuICAgICAgICBjYWxsKHRoaXMub3B0aW9ucy5vblN0ZXBIaWRlLCBjdXJyZW50U3RlcCk7XG4gICAgICB9XG4gICAgICAvLyBTaG93IGN1cnJlbnRcbiAgICAgIHRoaXMub3B0aW9ucy5zaG93RnVuKHRoaXMuZm9ybVN0ZXBzW3RhcmdldFN0ZXBdKTtcbiAgICAgIC8vIHN0b3JlIHRoZSBjb3JyZWN0IGN1cnJlbnRTdGVwXG4gICAgICB0aGlzLm9wdGlvbnMuc3RvcmVDdXJyZW50U3RlcCh0YXJnZXRTdGVwKTtcbiAgICAgIGNhbGwodGhpcy5vcHRpb25zLm9uU3RlcFNob3duLCB0YXJnZXRTdGVwKTtcbiAgICB9XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX3Nob3dOZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRDdXJyZW50U3RlcCgpO1xuICAgIHRoaXMubW92ZVRvKGN1cnJlbnQgKyAxKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fc2hvd0ZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubW92ZVRvKDApO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9zaG93UHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY3VycmVudCA9IHRoaXMuZ2V0Q3VycmVudFN0ZXAoKTtcbiAgICB0aGlzLm1vdmVUbyhjdXJyZW50IC0gMSk7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2dldEN1cnJlbnRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAoKTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdEdldEN1cnJlbnRTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdGVwO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0U3RvcmVDdXJyZW50U3RlcCA9IGZ1bmN0aW9uIChzdGVwKSB7XG4gICAgdGhpcy5jdXJyZW50U3RlcCA9IHN0ZXA7XG4gIH07XG5cbiAgTXVsdGlTdGVwRm9ybS5wcm90b3R5cGUuX2RlZmF1bHRTdWJtaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mb3JtLnN1Ym1pdCgpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICBNdWx0aVN0ZXBGb3JtLnByb3RvdHlwZS5fZGVmYXVsdEhpZGVGdW4gPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9kZWZhdWx0U2hvd0Z1biA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICB9O1xuXG4gIE11bHRpU3RlcEZvcm0ucHJvdG90eXBlLl9pc0xhc3RTdGVwID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZ2V0Q3VycmVudFN0ZXAoKSA9PT0gdGhpcy5zdGVwTGVuZ3RoIC0gMTtcbiAgfTtcblxuICByZXR1cm4gTXVsdGlTdGVwRm9ybTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IGluaXRNU0Y7XG4iLCIvKipcbiAqIGdlbmVyYXRlIHVuaXF1ZSBpZFxuICovXG5mdW5jdGlvbiBndWlkKCkge1xuICBmdW5jdGlvbiBzNCgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgIC50b1N0cmluZygxNilcbiAgICAgIC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgZnVuY3Rpb24gX2d1aWQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIF9ndWlkKCk7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgaWYgKHRhcmdldCA9PSBudWxsKSB7XG4gICAgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHtcbiAgICAgIC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBuZXh0U291cmNlKSB7XG4gICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0bztcbn1cblxuZnVuY3Rpb24gc2ltaWxhcml0eVNjb3JlKHN0ciwgc3RyaW5nLCBzbGljZSkge1xuICBpZiAoc2xpY2UgPT09IHVuZGVmaW5lZCB8fCBzbGljZSA9PT0gbnVsbCkge1xuICAgIHNsaWNlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmICghc2xpY2UpIHtcbiAgICBzdHIgPSBzdHIudHJpbSgpO1xuICAgIHN0cmluZyA9IHN0cmluZy50cmltKCk7XG4gIH1cblxuICBzdHIgPSBzdHIudG9Mb3dlckNhc2UoKTtcblxuICBzdHJpbmcgPSBzdHJpbmcudG9Mb3dlckNhc2UoKTtcblxuICBmdW5jdGlvbiBlcXVhbHMoczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxID09IHMyO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9TdWJzdHJpbmdzKHMpIHtcbiAgICB2YXIgc3Vic3RycyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgc3Vic3Rycy5wdXNoKHMuc2xpY2UoaW5kZXgsIHMubGVuZ3RoKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJzdHJzO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJhY3Rpb24oczEsIHMyKSB7XG4gICAgcmV0dXJuIHMxLmxlbmd0aCAvIHMyLmxlbmd0aDtcbiAgfVxuXG4gIGlmIChlcXVhbHMoc3RyLCBzdHJpbmcpKSB7XG4gICAgc2NvcmUgPSAxMDA7XG4gICAgcmV0dXJuIHNjb3JlO1xuICB9IGVsc2Uge1xuICAgIHZhciBzY29yZSA9IDA7XG4gICAgdmFyIGluZGV4ID0gc3RyaW5nLmluZGV4T2Yoc3RyKTtcbiAgICB2YXIgZiA9IGZyYWN0aW9uKHN0ciwgc3RyaW5nKTtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIC8vIHN0cmF0c1dpdGggKClcbiAgICAgIHNjb3JlID0gZiAqIDEwMDtcbiAgICB9XG4gICAgLy8gY29udGFpbnMoKVxuICAgIGVsc2UgaWYgKGluZGV4ICE9IC0xKSB7XG4gICAgICBzY29yZSA9IGYgKiAoKHN0cmluZy5sZW5ndGggLSBpbmRleCkgLyBzdHJpbmcubGVuZ3RoKSAqIDEwMDtcbiAgICB9XG5cbiAgICAvL1xuICAgIGlmICghc2xpY2UpIHtcbiAgICAgIHJldHVybiBzY29yZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN1YnN0cnMgPSB0b1N1YnN0cmluZ3Moc3RyKTtcbiAgICAgIGZvciAodmFyIGluZGV4MiA9IDA7IGluZGV4MiA8IHN1YnN0cnMubGVuZ3RoIC0gMTsgaW5kZXgyKyspIHtcbiAgICAgICAgdmFyIHN1YnNjb3JlID0gc2ltaWxhcml0eVNjb3JlKHN1YnN0cnNbaW5kZXgyXSwgc3RyaW5nLCBmYWxzZSk7XG4gICAgICAgIHNjb3JlID0gc2NvcmUgKyBzdWJzY29yZSAvIHN1YnN0cnMubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2NvcmU7IC8vIC8gc3Vic3Rycy5sZW5ndGhcbiAgICB9XG4gIH1cbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ3VpZDogZ3VpZCxcbiAgYXNzaWduOiBhc3NpZ24sXG4gIHNpbWlsYXJpdHlTY29yZTogc2ltaWxhcml0eVNjb3JlLFxufTtcbiJdfQ==

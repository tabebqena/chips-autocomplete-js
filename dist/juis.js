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

},{"./utils":4}],2:[function(require,module,exports){
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

},{"./utils":4}],3:[function(require,module,exports){
// eslint-disable-next-line no-unused-vars, no-undef
var initChips = require("./chips");
// eslint-disable-next-line no-unused-vars, no-undef
var initAutocomplete = require("./autocomplete");

var juis = {};
juis.Chips = initChips();
juis.Autocomplete = initAutocomplete();

if (window !== undefined && window !== null) {
  window.juis = juis || {};
}

// eslint-disable-next-line no-unused-vars, no-undef
module.exports = juis;

},{"./autocomplete":1,"./chips":2}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXV0b2NvbXBsZXRlLmpzIiwic3JjL2NoaXBzLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGd1aWQgPSByZXF1aXJlKFwiLi91dGlsc1wiKS5ndWlkO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgYXNzaWduID0gcmVxdWlyZShcIi4vdXRpbHNcIikuYXNzaWduO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG52YXIgc2ltaWxhcml0eVNjb3JlID0gcmVxdWlyZShcIi4vdXRpbHNcIikuc2ltaWxhcml0eVNjb3JlO1xuXG5mdW5jdGlvbiBpbmlBdXRvY29tcGxldGUoKSB7XG4gIHZhciBERUZBVUxUX09QVElPTlMgPSB7XG4gICAgZmlsdGVyOiBmaWx0ZXIsXG5cbiAgICBleHRyYWN0VmFsdWU6IF9leHRyYWN0VmFsdWUsXG4gICAgc29ydDogbnVsbCxcbiAgICBkcm9wRG93bkNsYXNzZXM6IFtcImRyb3Bkb3duXCJdLFxuICAgIGRyb3BEb3duSXRlbUNsYXNzZXM6IFtdLFxuICAgIGRyb3BEb3duVGFnOiBcImRpdlwiLFxuICAgIGhpZGVJdGVtOiBoaWRlSXRlbSxcbiAgICBzaG93SXRlbTogc2hvd0l0ZW0sXG4gICAgc2hvd0xpc3Q6IHNob3dMaXN0LFxuICAgIGhpZGVMaXN0OiBoaWRlTGlzdCxcbiAgICBvbkl0ZW1TZWxlY3RlZDogb25JdGVtU2VsZWN0ZWQsXG4gICAgYWN0aXZlQ2xhc3M6IFwiYWN0aXZlXCIsXG4gICAgaXNWaXNpYmxlOiBpc1Zpc2libGUsXG4gICAgb25MaXN0SXRlbUNyZWF0ZWQ6IG51bGwsXG4gIH07XG5cbiAgZnVuY3Rpb24gaXNWaXNpYmxlKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ICE9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gb25JdGVtU2VsZWN0ZWQoaW5wdXQsIGl0ZW0sIGh0bWxFbGVtZW50LCBhdXRjb21wbGV0ZSkge1xuICAgIGlucHV0LnZhbHVlID0gaXRlbS50ZXh0O1xuICAgIGF1dGNvbXBsZXRlLmhpZGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMaXN0KGwpIHtcbiAgICBsLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUxpc3QobCkge1xuICAgIGwuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUl0ZW0oZSkge1xuICAgIGUuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0l0ZW0oZSkge1xuICAgIGUuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICBmdW5jdGlvbiBzb3J0KHZhbHVlLCBkYXRhKSB7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBmdW5jdGlvbiBfZXh0cmFjdFZhbHVlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QudGV4dCB8fCBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIodmFsdWUsIGRhdGEsIGV4dHJhY3RWYWx1ZSkge1xuICAgIGlmIChleHRyYWN0VmFsdWUgPT09IHVuZGVmaW5lZCB8fCBleHRyYWN0VmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGV4dHJhY3RWYWx1ZSA9IF9leHRyYWN0VmFsdWU7XG4gICAgfVxuXG4gICAgdmFyIHNjb3JlcyA9IHt9O1xuICAgIHZhciBfZGF0YSA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGl0ZW1WYWx1ZSA9IGV4dHJhY3RWYWx1ZShkYXRhW2luZGV4XSk7XG4gICAgICB2YXIgc2NvcmUgPSBzaW1pbGFyaXR5U2NvcmUodmFsdWUsIGl0ZW1WYWx1ZSk7XG4gICAgICBpZiAoc2NvcmUgPiAwKSB7XG4gICAgICAgIF9kYXRhLnB1c2goZGF0YVtpbmRleF0pO1xuICAgICAgICBzY29yZXNbaXRlbVZhbHVlXSA9IHNjb3JlO1xuICAgICAgfVxuICAgIH1cbiAgICBfZGF0YSA9IF9kYXRhLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHZhciBzY29yZUEgPSBzY29yZXNbZXh0cmFjdFZhbHVlKGEpXTtcbiAgICAgIHZhciBzY29yZUIgPSBzY29yZXNbZXh0cmFjdFZhbHVlKGIpXTtcbiAgICAgIHJldHVybiBzY29yZUIgLSBzY29yZUE7XG4gICAgfSk7XG4gICAgcmV0dXJuIF9kYXRhO1xuICB9XG5cbiAgLy8gZ2VuZXJhdGUgdW5pcXVlIGlkXG5cbiAgZnVuY3Rpb24gQXV0b2NvbXBsZXRlKGlucHV0LCBkYXRhLCBvcHRpb25zKSB7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIHRoaXMuZGF0YSA9IHRoaXMuZml4RGF0YShkYXRhKTtcbiAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5kYXRhO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCA9IC0xO1xuXG4gICAgdGhpcy5kcm9wZG93bkl0ZW1zID0gW107XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gaW5wdXQucGFyZW50Tm9kZTtcbiAgICB0aGlzLmNyZWF0ZUxpc3QgPSB0aGlzLl9jcmVhdGVMaXN0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5jcmVhdGVJdGVtID0gdGhpcy5fY3JlYXRlSXRlbS5iaW5kKHRoaXMpO1xuICAgIHRoaXMudXBkYXRlRGF0YSA9IHRoaXMuX3VwZGF0ZURhdGEuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNob3cgPSB0aGlzLl9zaG93LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oaWRlID0gdGhpcy5faGlkZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuZmlsdGVyID0gdGhpcy5fZmlsdGVyLmJpbmQodGhpcyk7XG4gICAgdGhpcy5zb3J0ID0gdGhpcy5fc29ydC5iaW5kKHRoaXMpO1xuICAgIHRoaXMuYWN0aXZhdGVOZXh0ID0gdGhpcy5fYWN0aXZhdGVOZXh0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5hY3RpdmF0ZVByZXYgPSB0aGlzLl9hY3RpdmF0ZVByZXYuYmluZCh0aGlzKTtcbiAgICB0aGlzLnNlbGVjdEFjdGl2ZSA9IHRoaXMuX3NlbGVjdEFjdGl2ZS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5pc1Nob3duID0gZmFsc2U7XG5cbiAgICB0aGlzLnNldHVwTGlzdGVuZXJzID0gdGhpcy5fc2V0dXBfbGlzdGVuZXJzO1xuICAgIHRoaXMubGlzdCA9IHRoaXMuY3JlYXRlTGlzdCgpO1xuICAgIHRoaXMuaGlkZSgpO1xuICAgIHRoaXMuc2V0dXBMaXN0ZW5lcnMoKTtcbiAgfVxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLmZpeERhdGEgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBydiA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGVsZW1lbnQgPSBkYXRhW2luZGV4XTtcbiAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGVsZW1lbnQgPSB7IHRleHQ6IGVsZW1lbnQgfTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQuX3VpZCA9IGd1aWQoKTtcbiAgICAgIHJ2LnB1c2goZWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBydjtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zZXR1cF9saXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICB2YXIgaW5wdXQgPSBzZWxmLmlucHV0O1xuICAgICAgaWYgKHNlbGYuaXNTaG93bikge1xuICAgICAgICBzZWxmLmhpZGUoKTtcbiAgICAgIH1cbiAgICAgIHNlbGYuZmlsdGVyKGlucHV0LnZhbHVlKTtcbiAgICAgIHNlbGYuc29ydChpbnB1dC52YWx1ZSk7XG4gICAgICBzZWxmLnNob3coKTtcbiAgICB9KTtcblxuICAgIC8qZXhlY3V0ZSBhIGZ1bmN0aW9uIHByZXNzZXMgYSBrZXkgb24gdGhlIGtleWJvYXJkOiovXG4gICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFzZWxmLmlzU2hvd24pIHtcbiAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICB9XG4gICAgICBpZiAoZS5rZXlDb2RlID09IDQwKSB7XG4gICAgICAgIC8vIGRvd24ga2V5XG4gICAgICAgIHNlbGYuYWN0aXZhdGVOZXh0KCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAzOCkge1xuICAgICAgICAvLyB1cCBrZXlcbiAgICAgICAgc2VsZi5hY3RpdmF0ZVByZXYoKTtcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDEzKSB7XG4gICAgICAgIC8vIGVudGVyXG4gICAgICAgIHNlbGYuc2VsZWN0QWN0aXZlKCk7XG4gICAgICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAyNykge1xuICAgICAgICAvLyBlc2NhcGVcbiAgICAgICAgaWYgKHNlbGYuaXNTaG93bikge1xuICAgICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fdXBkYXRlRGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5maXhEYXRhKGRhdGEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3Nob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhc3RJdGVtID0gMDtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5maWx0ZXJlZC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBodG1sRWxlbWVudCA9IHRoaXMuZHJvcGRvd25JdGVtc1t0aGlzLmZpbHRlcmVkW2luZGV4XS5fdWlkXTtcbiAgICAgIGlmIChodG1sRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMub3B0aW9ucy5zaG93SXRlbShodG1sRWxlbWVudCk7XG4gICAgICB0aGlzLmxpc3QuaW5zZXJ0QmVmb3JlKGh0bWxFbGVtZW50LCB0aGlzLmxpc3QuY2hpbGRyZW5bbGFzdEl0ZW1dKTtcbiAgICAgIGxhc3RJdGVtKys7XG4gICAgfVxuXG4gICAgZm9yIChpbmRleCA9IGxhc3RJdGVtOyBpbmRleCA8IHRoaXMubGlzdC5jaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjaGlsZCA9IHRoaXMubGlzdC5jaGlsZE5vZGVzW2luZGV4XTtcbiAgICAgIHRoaXMub3B0aW9ucy5oaWRlSXRlbShjaGlsZCk7XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLnNob3dMaXN0KHRoaXMubGlzdCk7XG4gICAgdGhpcy5pc1Nob3duID0gdHJ1ZTtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9maWx0ZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB0aGlzLmZpbHRlcmVkID0gdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZmlsdGVyICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLm9wdGlvbnMuZmlsdGVyKFxuICAgICAgICB2YWx1ZSxcbiAgICAgICAgdGhpcy5kYXRhLFxuICAgICAgICB0aGlzLm9wdGlvbnMuZXh0cmFjdFZhbHVlXG4gICAgICApO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9zb3J0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zb3J0ICE9IG51bGwpIHtcbiAgICAgIHRoaXMuZmlsdGVyZWQgPSB0aGlzLm9wdGlvbnMuc29ydCh2YWx1ZSwgdGhpcy5maWx0ZXJlZCk7XG4gICAgfVxuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2NyZWF0ZUxpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMub3B0aW9ucy5kcm9wRG93blRhZyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMub3B0aW9ucy5kcm9wRG93bkNsYXNzZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBhLmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmRyb3BEb3duQ2xhc3Nlc1tpbmRleF0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuZGF0YVtpXTtcbiAgICAgIHZhciBiID0gdGhpcy5jcmVhdGVJdGVtKGl0ZW0pO1xuICAgICAgYS5hcHBlbmRDaGlsZChiKTtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoYSk7XG4gICAgcmV0dXJuIGE7XG4gIH07XG5cbiAgQXV0b2NvbXBsZXRlLnByb3RvdHlwZS5fY3JlYXRlSXRlbSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgLypjcmVhdGUgYSBESVYgZWxlbWVudCBmb3IgZWFjaCBtYXRjaGluZyBlbGVtZW50OiovXG4gICAgdmFyIGh0bWxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcbiAgICAvKm1ha2UgdGhlIG1hdGNoaW5nIGxldHRlcnMgYm9sZDoqL1xuXG4gICAgdmFyIHRleHQgPSBpdGVtLnRleHQ7XG4gICAgdmFyIF91aWQgPSBpdGVtLl91aWQ7XG5cbiAgICBodG1sRWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgdmFyIGF0dHJzID0gaXRlbS5hdHRycyB8fCB7fTtcbiAgICB2YXIgYXR0cnNLZXlzID0gT2JqZWN0LmtleXMoYXR0cnMpO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBhdHRyc0tleXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIga2V5ID0gYXR0cnNLZXlzW2luZGV4XTtcbiAgICAgIHZhciB2YWwgPSBhdHRyc1trZXldO1xuICAgICAgaHRtbEVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB9XG5cbiAgICBmb3IgKFxuICAgICAgdmFyIGluZGV4MiA9IDA7XG4gICAgICBpbmRleDIgPCB0aGlzLm9wdGlvbnMuZHJvcERvd25JdGVtQ2xhc3Nlcy5sZW5ndGg7XG4gICAgICBpbmRleDIrK1xuICAgICkge1xuICAgICAgaHRtbEVsZW1lbnQuY2xhc3NMaXN0LmFkZCh0aGlzLm9wdGlvbnMuZHJvcERvd25JdGVtQ2xhc3Nlc1tpbmRleDJdKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3Bkb3duSXRlbXNbX3VpZF0gPSBodG1sRWxlbWVudDtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBodG1sRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIHNlbGYub3B0aW9ucy5vbkl0ZW1TZWxlY3RlZChzZWxmLmlucHV0LCBpdGVtLCBodG1sRWxlbWVudCwgc2VsZik7XG4gICAgfSk7XG5cbiAgICBpZiAoXG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQgIT09IG51bGwgJiZcbiAgICAgIHRoaXMub3B0aW9ucy5vbkxpc3RJdGVtQ3JlYXRlZCAhPT0gdW5kZWZpbmVkXG4gICAgKSB7XG4gICAgICB0aGlzLm9wdGlvbnMub25MaXN0SXRlbUNyZWF0ZWQoaHRtbEVsZW1lbnQsIGl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBodG1sRWxlbWVudDtcbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZUNsb3Nlc3QgPSBmdW5jdGlvbiAoaW5kZXgsIGRpcikge1xuICAgIGZvciAodmFyIGkgPSBpbmRleDsgaSA8IHRoaXMubGlzdC5jaGlsZE5vZGVzLmxlbmd0aDsgKSB7XG4gICAgICB2YXIgZSA9IHRoaXMubGlzdC5jaGlsZE5vZGVzW2ldO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5pc1Zpc2libGUoZSkpIHtcbiAgICAgICAgZS5jbGFzc0xpc3QuYWRkKHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGRpciA+IDApIHtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9kZWFjdGl2YXRlQWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhbGwgPSB0aGlzLmxpc3QucXVlcnlTZWxlY3RvckFsbChcIi5cIiArIHRoaXMub3B0aW9ucy5hY3RpdmVDbGFzcyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGFsbC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGFsbFtpbmRleF0uY2xhc3NMaXN0LnJlbW92ZSh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9hY3RpdmF0ZU5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fZGVhY3RpdmF0ZUFsbCgpO1xuICAgIHRoaXMuYWN0aXZlRWxlbWVudCsrO1xuICAgIHRoaXMuX2FjdGl2YXRlQ2xvc2VzdCh0aGlzLmFjdGl2ZUVsZW1lbnQsIDEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX2FjdGl2YXRlUHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9kZWFjdGl2YXRlQWxsKCk7XG4gICAgdGhpcy5hY3RpdmVFbGVtZW50LS07XG4gICAgdGhpcy5fYWN0aXZhdGVDbG9zZXN0KHRoaXMuYWN0aXZlRWxlbWVudCwgLTEpO1xuICB9O1xuXG4gIEF1dG9jb21wbGV0ZS5wcm90b3R5cGUuX3NlbGVjdEFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWN0aXZlID0gdGhpcy5saXN0LnF1ZXJ5U2VsZWN0b3IoXCIuXCIgKyB0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xuICAgIGlmIChhY3RpdmUgIT09IG51bGwgJiYgYWN0aXZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFjdGl2ZS5jbGljaygpO1xuICAgIH1cbiAgfTtcblxuICBBdXRvY29tcGxldGUucHJvdG90eXBlLl9oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub3B0aW9ucy5oaWRlTGlzdCh0aGlzLmxpc3QpO1xuICAgIHRoaXMuaXNTaG93biA9IGZhbHNlO1xuICB9O1xuXG4gIHJldHVybiBBdXRvY29tcGxldGU7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxubW9kdWxlLmV4cG9ydHMgPSBpbmlBdXRvY29tcGxldGU7XG4iLCIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbnZhciBndWlkID0gcmVxdWlyZShcIi4vdXRpbHNcIikuZ3VpZDtcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxudmFyIGFzc2lnbiA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpLmFzc2lnbjtcblxuZnVuY3Rpb24gaW5pdENoaXBzKCkge1xuICB2YXIgREVGQVVMVF9TRVRUSU5HUyA9IHtcbiAgICBjcmVhdGVJbnB1dDogdHJ1ZSxcbiAgICBjaGlwc0NsYXNzOiBcImNoaXBzXCIsXG4gICAgY2hpcENsYXNzOiBcImNoaXBcIixcbiAgICBjbG9zZUNsYXNzOiBcImNoaXAtY2xvc2VcIixcbiAgICBjaGlwSW5wdXRDbGFzczogXCJjaGlwLWlucHV0XCIsXG4gICAgc2V0Q2xvc2VCdG46IGZhbHNlLFxuICAgIGltYWdlV2lkdGg6IDk2LFxuICAgIGltYWdlSGVpZ2h0OiA5NixcbiAgICBjbG9zZTogdHJ1ZSxcbiAgICBvbmNsaWNrOiBudWxsLFxuICAgIG9uY2xvc2U6IG51bGwsXG4gIH07XG5cbiAgdmFyIGNoaXBEYXRhID0ge1xuICAgIF91aWQ6IG51bGwsXG4gICAgdGV4dDogXCJcIixcbiAgICBpbWc6IFwiXCIsXG4gICAgYXR0cnM6IHtcbiAgICAgIHRhYmluZGV4OiBcIjBcIixcbiAgICB9LFxuICAgIGNsb3NlQ2xhc3NlczogbnVsbCxcbiAgICBjbG9zZUhUTUw6IG51bGwsXG4gICAgb25jbGljazogbnVsbCxcbiAgICBvbmNsb3NlOiBudWxsLFxuICB9O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoaWxkKHRhZywgYXR0cmlidXRlcywgY2xhc3NlcywgcGFyZW50KSB7XG4gICAgdmFyIGVsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcbiAgICB2YXIgYXR0cnNLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcyk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGF0dHJzS2V5cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGVsZS5zZXRBdHRyaWJ1dGUoYXR0cnNLZXlzW2luZGV4XSwgYXR0cmlidXRlc1thdHRyc0tleXNbaW5kZXhdXSk7XG4gICAgfVxuICAgIGZvciAodmFyIGNsYXNzSW5kZXggPSAwOyBjbGFzc0luZGV4IDwgY2xhc3Nlcy5sZW5ndGg7IGNsYXNzSW5kZXgrKykge1xuICAgICAgdmFyIGtscyA9IGNsYXNzZXNbY2xhc3NJbmRleF07XG4gICAgICBlbGUuY2xhc3NMaXN0LmFkZChrbHMpO1xuICAgIH1cbiAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQgJiYgcGFyZW50ICE9PSBudWxsKSB7XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWxlKTtcbiAgICB9XG4gICAgcmV0dXJuIGVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBfY3JlYXRlX2NoaXAsIFRoaXMgaXMgYW4gaW50ZXJuYWwgZnVuY3Rpb24sIGFjY2Vzc2VkIGJ5IHRoZSBDaGlwcy5fYWRkQ2hpcCBtZXRob2RcbiAgICogQHBhcmFtIHsqfSBkYXRhIFRoZSBjaGlwIGRhdGEgdG8gY3JlYXRlLFxuICAgKiBAcmV0dXJucyBIVE1MRWxlbWVudFxuICAgKi9cbiAgZnVuY3Rpb24gX2NyZWF0ZUNoaXAoZGF0YSkge1xuICAgIGRhdGEgPSBhc3NpZ24oe30sIGNoaXBEYXRhLCBkYXRhKTtcbiAgICB2YXIgYXR0cnMgPSBhc3NpZ24oZGF0YS5hdHRycywgeyBcImNoaXAtaWRcIjogZGF0YS5fdWlkIH0pO1xuICAgIHZhciBjaGlwID0gY3JlYXRlQ2hpbGQoXCJkaXZcIiwgYXR0cnMsIFtcImNoaXBcIl0sIG51bGwpO1xuXG4gICAgZnVuY3Rpb24gY2xvc2VDYWxsYmFjayhlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZGF0YS5vbmNsb3NlKGUsIGNoaXAsIGRhdGEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsaWNrQ2FsbGJhY2soZSkge1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGlmIChkYXRhLm9uY2xpY2sgIT09IG51bGwgJiYgZGF0YS5vbmNsaWNrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YS5vbmNsaWNrKGUsIGNoaXAsIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkYXRhLmltYWdlKSB7XG4gICAgICBjcmVhdGVDaGlsZChcbiAgICAgICAgXCJpbWdcIixcbiAgICAgICAge1xuICAgICAgICAgIHdpZHRoOiBkYXRhLmltYWdlV2lkdGggfHwgOTYsXG4gICAgICAgICAgaGVpZ2h0OiBkYXRhLmltYWdlSGVpZ2h0IHx8IDk2LFxuICAgICAgICAgIHNyYzogZGF0YS5pbWFnZSxcbiAgICAgICAgfSxcbiAgICAgICAgW10sXG4gICAgICAgIGNoaXAsXG4gICAgICAgIHt9XG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZGF0YS50ZXh0KSB7XG4gICAgICB2YXIgc3BhbiA9IGNyZWF0ZUNoaWxkKFwic3BhblwiLCB7fSwgW10sIGNoaXAsIHt9KTtcbiAgICAgIHNwYW4uaW5uZXJIVE1MID0gZGF0YS50ZXh0O1xuICAgIH1cbiAgICBpZiAoZGF0YS5jbG9zZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBkYXRhLmNsb3NlQ2xhc3NlcyB8fCBbXCJjaGlwLWNsb3NlXCJdO1xuICAgICAgdmFyIGNsb3NlU3BhbiA9IGNyZWF0ZUNoaWxkKFxuICAgICAgICBcInNwYW5cIixcbiAgICAgICAge30sIC8vIGlkOiBkYXRhLmNsb3NlSWRcbiAgICAgICAgY2xhc3NlcyxcbiAgICAgICAgY2hpcCxcbiAgICAgICAge31cbiAgICAgICk7XG5cbiAgICAgIGNsb3NlU3Bhbi5pbm5lckhUTUwgPSBkYXRhLmNsb3NlSFRNTCB8fCBcIiZ0aW1lc1wiO1xuICAgICAgaWYgKGRhdGEub25jbG9zZSAhPT0gbnVsbCAmJiBkYXRhLm9uY2xvc2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9zZVNwYW4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsb3NlQ2FsbGJhY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBjaGlwLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbGlja0NhbGxiYWNrKTtcblxuICAgIHJldHVybiBjaGlwO1xuICB9XG5cbiAgZnVuY3Rpb24gQ2hpcHMoZWxlbWVudCwgZGF0YSwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgb3B0aW9ucyB8fCB7fSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YSB8fCBbXTtcbiAgICB0aGlzLl9kYXRhID0gW107XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQodGhpcy5vcHRpb25zLmNoaXBzQ2xhc3MpO1xuXG4gICAgdGhpcy5fc2V0RWxlbWVudExpc3RlbmVycygpO1xuICAgIHRoaXMuaW5wdXQgPSB0aGlzLl9zZXRJbnB1dCgpO1xuICAgIHRoaXMuYWRkQ2hpcCA9IHRoaXMuX2FkZENoaXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbW92ZUNoaXAgPSB0aGlzLl9yZW1vdmVDaGlwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5nZXREYXRhID0gdGhpcy5fZ2V0RGF0YS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRBdXRvY29tcGxldGUgPSB0aGlzLl9zZXRBdXRvY29tcGxldGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLnJlbmRlciA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIENoaXBzLnByb3RvdHlwZS5fZ2V0RGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbyA9IFtdO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLl9kYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHRoaXMuX2RhdGFbaW5kZXhdICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fZGF0YVtpbmRleF0gIT09IG51bGwpIHtcbiAgICAgICAgdmFyIHVpZCA9IHRoaXMuX2RhdGFbaW5kZXhdLl91aWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHRoaXMuZGF0YVtpXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdGhpcy5kYXRhW2ldLl91aWQgPT09IHVpZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgby5wdXNoKHRoaXMuZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB0aGlzLmRhdGFbaW5kZXhdLl9pbmRleCA9IGluZGV4O1xuICAgICAgdGhpcy5hZGRDaGlwKHRoaXMuZGF0YVtpbmRleF0pO1xuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX3NldEF1dG9jb21wbGV0ZSA9IGZ1bmN0aW9uIChhdXRvY29tcGxldGVPYmopIHtcbiAgICB0aGlzLm9wdGlvbnMuYXV0b2NvbXBsZXRlID0gYXV0b2NvbXBsZXRlT2JqO1xuICB9O1xuXG4gIC8qKlxuICAgKiBhZGQgY2hpcCB0byBlbGVtZW50IGJ5IHBhc3NlZCBkYXRhXG4gICAqIEBwYXJhbSB7Kn0gZGF0YSBjaGlwIGRhdGEsIFBsZWFzZSBzZWUgYGNoaXBEYXRhYCBkb2N1bW5ldGF0aW9ucy5cbiAgICovXG4gIENoaXBzLnByb3RvdHlwZS5fYWRkQ2hpcCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8gZ2V0IGlucHV0IGVsZW1lbnRcbiAgICB2YXIgZGlzdERhdGEgPSBhc3NpZ24oe30sIHRoaXMub3B0aW9ucywgY2hpcERhdGEsIGRhdGEpO1xuICAgIGRhdGEgPSBhc3NpZ24oXG4gICAgICB7IG9uY2xpY2s6IHRoaXMub3B0aW9ucy5vbmNsaWNrLCBvbmNsb3NlOiB0aGlzLm9wdGlvbnMub25jbG9zZSB9LFxuICAgICAgZGF0YVxuICAgICk7XG5cbiAgICBpZiAoZGF0YS5fdWlkID09PSB1bmRlZmluZWQgfHwgZGF0YS5fdWlkID09PSBudWxsKSB7XG4gICAgICB2YXIgdWlkID0gZ3VpZCgpO1xuICAgICAgZGF0YS5fdWlkID0gdWlkO1xuICAgICAgZGlzdERhdGEuX3VpZCA9IHVpZDtcbiAgICB9XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGlzdERhdGEub25jbGljayA9IGZ1bmN0aW9uIChlLCBjaGlwLCBkaXN0RGF0YSkge1xuICAgICAgc2VsZi5faGFuZGxlQ2hpcENsaWNrLmFwcGx5KHNlbGYsIFtlLCBjaGlwLCBkYXRhXSk7XG4gICAgfTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRpc3REYXRhLm9uY2xvc2UgPSBmdW5jdGlvbiAoZSwgY2hpcCwgZGlzdERhdGEpIHtcbiAgICAgIHNlbGYuX2hhbmRsZUNoaXBDbG9zZS5hcHBseShzZWxmLCBbZSwgY2hpcCwgZGF0YV0pO1xuICAgIH07XG5cbiAgICB2YXIgY2hpcCA9IF9jcmVhdGVDaGlwKGRpc3REYXRhKTtcbiAgICB2YXIgaW5wdXQgPSB0aGlzLmlucHV0O1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfSBlbHNlIGlmIChpbnB1dC5wYXJlbnRFbGVtZW50ID09PSB0aGlzLmVsZW1lbnQpIHtcbiAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoY2hpcCwgaW5wdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpcCk7XG4gICAgfVxuICAgIC8vIEF2b2lkIGluZmludGUgbG9vcCwgaWYgcmVjdXJzc2l2ZWx5IGFkZCBkYXRhIHRvIHRoZXRoaXMuZGF0YSB3aGlsZSByZW5kZXIgaXMgdGVyYXRpbmdcbiAgICAvLyBvdmVyIGl0LlxuICAgIGlmIChkYXRhLl9pbmRleCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuX2luZGV4ICE9PSBudWxsKSB7XG4gICAgICB2YXIgaW5kZXggPSBkYXRhLl9pbmRleDtcbiAgICAgIGRlbGV0ZSBkYXRhLl9pbmRleDtcbiAgICAgIHRoaXMuZGF0YVtpbmRleF0gPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRhdGEucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kYXRhLnB1c2goZGlzdERhdGEpO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fc2V0SW5wdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlucHV0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmlucHV0ICE9PSBudWxsICYmIHRoaXMub3B0aW9ucy5pbnB1dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpbnB1dCA9IHRoaXMub3B0aW9ucy5pbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGlucHV0cyA9IHRoaXMuZWxlbWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFxuICAgICAgICB0aGlzLm9wdGlvbnMuY2hpcElucHV0Q2xhc3NcbiAgICAgICk7XG4gICAgICBpZiAoaW5wdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW5wdXQgPSBpbnB1dHNbMF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY3JlYXRlSW5wdXQpIHtcbiAgICAgICAgLy8gY3JlYXRlIGlucHV0IGFuZCBhcHBlbmQgdG8gZWxlbWVudFxuICAgICAgICBpbnB1dCA9IGNyZWF0ZUNoaWxkKFxuICAgICAgICAgIFwiaW5wdXRcIixcbiAgICAgICAgICB7IHBsYWNlaG9sZGVyOiB0aGlzLm9wdGlvbnMucGxhY2Vob2xkZXIgfHwgXCJcIiB9LFxuICAgICAgICAgIFt0aGlzLm9wdGlvbnMuY2hpcElucHV0Q2xhc3NdLFxuICAgICAgICAgIHRoaXMuZWxlbWVudFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gc2V0IGV2ZW50IGxpc3RlbmVyXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3Vzb3V0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFwiZm9jdXNcIik7XG4gICAgfSk7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNpblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzZWxmLmVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImZvY3VzXCIpO1xuICAgIH0pO1xuXG4gICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIC8vIGVudGVyXG4gICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAvLyBPdmVycmlkZSBlbnRlciBpZiBhdXRvY29tcGxldGluZy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgIHNlbGYub3B0aW9ucy5hdXRvY29tcGxldGUgIT09IG51bGwgJiZcbiAgICAgICAgICBzZWxmLm9wdGlvbnMuYXV0b2NvbXBsZXRlLmlzU2hvd25cbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC52YWx1ZSAhPT0gXCJcIikge1xuICAgICAgICAgIHNlbGYuYWRkQ2hpcCh7XG4gICAgICAgICAgICB0ZXh0OiBpbnB1dC52YWx1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9zZXRFbGVtZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlbGYuaW5wdXQuZm9jdXMoKTtcbiAgICB9KTtcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmICghZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKHNlbGYub3B0aW9ucy5jaGlwQ2xhc3MpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gOCB8fCBlLmtleUNvZGUgPT09IDQ2KSB7XG4gICAgICAgIHNlbGYuX2hhbmRsZUNoaXBEZWxldGUoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcENsaWNrID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRhdGEpIHtcbiAgICBlLnRhcmdldC5mb2N1cygpO1xuICAgIGlmIChkYXRhLm9uY2xpY2sgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm9uY2xpY2sgIT09IG51bGwpIHtcbiAgICAgIGRhdGEub25jbGljayhlLCBjaGlwLCBkYXRhKTtcbiAgICB9XG4gIH07XG5cbiAgQ2hpcHMucHJvdG90eXBlLl9kZWxldGVDaGlwRGF0YSA9IGZ1bmN0aW9uICh1aWQpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5fZGF0YS5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmICh0aGlzLl9kYXRhW2luZGV4XSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX2RhdGFbaW5kZXhdICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh1aWQgPT09IHRoaXMuX2RhdGFbaW5kZXhdLl91aWQpIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5fZGF0YVtpbmRleF07XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5faGFuZGxlQ2hpcENsb3NlID0gZnVuY3Rpb24gKGUsIGNoaXAsIGRhdGEpIHtcbiAgICBpZiAodGhpcy5fZGVsZXRlQ2hpcERhdGEoZGF0YS5fdWlkKSkge1xuICAgICAgY2hpcC5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKGNoaXApO1xuICAgICAgaWYgKGRhdGEub25jbG9zZSAhPT0gdW5kZWZpbmVkICYmIGRhdGEub25jbG9zZSAhPT0gbnVsbCkge1xuICAgICAgICBkYXRhLm9uY2xvc2UoZSwgY2hpcCwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIENoaXBzLnByb3RvdHlwZS5fcmVtb3ZlQ2hpcCA9IGZ1bmN0aW9uIChjaGlwSWQpIHtcbiAgICB2YXIgY2hpcCA9IG51bGw7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuZWxlbWVudC5jaGlsZHJlbi5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50LmNoaWxkcmVuW2luZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgZWxlbWVudCAhPT0gdW5kZWZpbmVkICYmXG4gICAgICAgIGVsZW1lbnQgIT09IG51bGwgJiZcbiAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnModGhpcy5vcHRpb25zLmNoaXBDbGFzcylcbiAgICAgICkge1xuICAgICAgICBpZiAoZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJjaGlwLWlkXCIpID09PSBjaGlwSWQpIHtcbiAgICAgICAgICBjaGlwID0gZWxlbWVudDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpbmRleDIgPSAwOyBpbmRleDIgPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleDIrKykge1xuICAgICAgdmFyIGl0ZW0gPSB0aGlzLmRhdGFbaW5kZXgyXTtcbiAgICAgIGlmIChpdGVtICE9PSB1bmRlZmluZWQgJiYgaXRlbSAhPT0gbnVsbCAmJiBpdGVtLl91aWQgPT09IGNoaXBJZCkge1xuICAgICAgICB0aGlzLl9oYW5kbGVDaGlwQ2xvc2UobnVsbCwgY2hpcCwgaXRlbSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBDaGlwcy5wcm90b3R5cGUuX2hhbmRsZUNoaXBEZWxldGUgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBjaGlwID0gZS50YXJnZXQ7XG4gICAgdmFyIGNoaXBJZCA9IGNoaXAuZ2V0QXR0cmlidXRlKFwiY2hpcC1pZFwiKTtcbiAgICBpZiAoY2hpcElkID09PSB1bmRlZmluZWQgfHwgY2hpcElkID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBFcnJvcihcIllvdSAgc2hvdWxkIHByb3ZpZGUgY2hpcElkXCIpO1xuICAgIH1cbiAgICB2YXIgZGF0YSA9IHt9O1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCB0aGlzLmRhdGEubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgZWxlbWVudCA9IHRoaXMuZGF0YVtpbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIGVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICBlbGVtZW50ICE9PSBudWxsICYmXG4gICAgICAgIGVsZW1lbnQuX3VpZCA9PT0gY2hpcElkXG4gICAgICApIHtcbiAgICAgICAgZGF0YSA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMuX2hhbmRsZUNoaXBDbG9zZShlLCBjaGlwLCBkYXRhKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBFcnJvcihcImNhbid0IGZpbmQgZGF0YSB3aXRoIGlkOiBcIiArIGNoaXBJZCwgdGhpcy5kYXRhKTtcbiAgfTtcblxuICByZXR1cm4gQ2hpcHM7XG59XG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0gaW5pdENoaXBzO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxudmFyIGluaXRDaGlwcyA9IHJlcXVpcmUoXCIuL2NoaXBzXCIpO1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLCBuby11bmRlZlxudmFyIGluaXRBdXRvY29tcGxldGUgPSByZXF1aXJlKFwiLi9hdXRvY29tcGxldGVcIik7XG5cbnZhciBqdWlzID0ge307XG5qdWlzLkNoaXBzID0gaW5pdENoaXBzKCk7XG5qdWlzLkF1dG9jb21wbGV0ZSA9IGluaXRBdXRvY29tcGxldGUoKTtcblxuaWYgKHdpbmRvdyAhPT0gdW5kZWZpbmVkICYmIHdpbmRvdyAhPT0gbnVsbCkge1xuICB3aW5kb3cuanVpcyA9IGp1aXMgfHwge307XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycywgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0ganVpcztcbiIsIi8qKlxuICogZ2VuZXJhdGUgdW5pcXVlIGlkXG4gKi9cbmZ1bmN0aW9uIGd1aWQoKSB7XG4gIGZ1bmN0aW9uIHM0KCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKVxuICAgICAgLnRvU3RyaW5nKDE2KVxuICAgICAgLnN1YnN0cmluZygxKTtcbiAgfVxuICBmdW5jdGlvbiBfZ3VpZCgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgczQoKSArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgXCItXCIgK1xuICAgICAgczQoKSArXG4gICAgICBcIi1cIiArXG4gICAgICBzNCgpICtcbiAgICAgIFwiLVwiICtcbiAgICAgIHM0KCkgK1xuICAgICAgczQoKSArXG4gICAgICBzNCgpXG4gICAgKTtcbiAgfVxuICByZXR1cm4gX2d1aWQoKTtcbn1cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5mdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICBpZiAodGFyZ2V0ID09IG51bGwpIHtcbiAgICAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0XCIpO1xuICB9XG5cbiAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG4gIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgdmFyIG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXG4gICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkge1xuICAgICAgLy8gU2tpcCBvdmVyIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICBmb3IgKHZhciBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobmV4dFNvdXJjZSwgbmV4dEtleSkpIHtcbiAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG5mdW5jdGlvbiBzaW1pbGFyaXR5U2NvcmUoc3RyLCBzdHJpbmcsIHNsaWNlKSB7XG4gIGlmIChzbGljZSA9PT0gdW5kZWZpbmVkIHx8IHNsaWNlID09PSBudWxsKSB7XG4gICAgc2xpY2UgPSB0cnVlO1xuICB9XG5cbiAgaWYgKCFzbGljZSkge1xuICAgIHN0ciA9IHN0ci50cmltKCk7XG4gICAgc3RyaW5nID0gc3RyaW5nLnRyaW0oKTtcbiAgfVxuXG4gIHN0ciA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuXG4gIHN0cmluZyA9IHN0cmluZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGZ1bmN0aW9uIGVxdWFscyhzMSwgczIpIHtcbiAgICByZXR1cm4gczEgPT0gczI7XG4gIH1cblxuICBmdW5jdGlvbiB0b1N1YnN0cmluZ3Mocykge1xuICAgIHZhciBzdWJzdHJzID0gW107XG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBzdWJzdHJzLnB1c2gocy5zbGljZShpbmRleCwgcy5sZW5ndGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YnN0cnM7XG4gIH1cblxuICBmdW5jdGlvbiBmcmFjdGlvbihzMSwgczIpIHtcbiAgICByZXR1cm4gczEubGVuZ3RoIC8gczIubGVuZ3RoO1xuICB9XG5cbiAgaWYgKGVxdWFscyhzdHIsIHN0cmluZykpIHtcbiAgICBzY29yZSA9IDEwMDtcbiAgICByZXR1cm4gc2NvcmU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNjb3JlID0gMDtcbiAgICB2YXIgaW5kZXggPSBzdHJpbmcuaW5kZXhPZihzdHIpO1xuICAgIHZhciBmID0gZnJhY3Rpb24oc3RyLCBzdHJpbmcpO1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgLy8gc3RyYXRzV2l0aCAoKVxuICAgICAgc2NvcmUgPSBmICogMTAwO1xuICAgIH1cbiAgICAvLyBjb250YWlucygpXG4gICAgZWxzZSBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgIHNjb3JlID0gZiAqICgoc3RyaW5nLmxlbmd0aCAtIGluZGV4KSAvIHN0cmluZy5sZW5ndGgpICogMTAwO1xuICAgIH1cblxuICAgIC8vXG4gICAgaWYgKCFzbGljZSkge1xuICAgICAgcmV0dXJuIHNjb3JlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3Vic3RycyA9IHRvU3Vic3RyaW5ncyhzdHIpO1xuICAgICAgZm9yICh2YXIgaW5kZXgyID0gMDsgaW5kZXgyIDwgc3Vic3Rycy5sZW5ndGggLSAxOyBpbmRleDIrKykge1xuICAgICAgICB2YXIgc3Vic2NvcmUgPSBzaW1pbGFyaXR5U2NvcmUoc3Vic3Ryc1tpbmRleDJdLCBzdHJpbmcsIGZhbHNlKTtcbiAgICAgICAgc2NvcmUgPSBzY29yZSArIHN1YnNjb3JlIC8gc3Vic3Rycy5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzY29yZTsgLy8gLyBzdWJzdHJzLmxlbmd0aFxuICAgIH1cbiAgfVxufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbm1vZHVsZS5leHBvcnRzID0ge1xuICBndWlkOiBndWlkLFxuICBhc3NpZ246IGFzc2lnbixcbiAgc2ltaWxhcml0eVNjb3JlOiBzaW1pbGFyaXR5U2NvcmUsXG59O1xuIl19

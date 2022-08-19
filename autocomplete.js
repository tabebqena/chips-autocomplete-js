(function () {
    let DEFAULT_OPTIONS = {
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
        onListItemCreated: null
    }

    function isVisible(element) {
        return element.style.display != 'none';
    }

    function onItemSelected(input, item, htmlElement, autcomplete) {
        input.value = item.text;
        autcomplete.hide();
    }

    function showList(l) {
        l.style.display = 'inline-block';
    }
    function hideList(l) {
        l.style.display = 'none';
    }


    function hideItem(e) {
        e.style.display = 'none';
    }

    function showItem(e) {
        e.style.display = 'block';
    }

    function contentScore(str, string, slice) {
        if (slice === undefined || slice === null) {
            slice = true;
        }

        if (!slice) {
            str = str.trim();
            string = string.trim();
        }
        str = str.toLowerCase()
        string = string.toLowerCase();

        function equals(s1, s2) {
            return s1 == s2
        }

        function contains(s1, s2) {
            return s2.indexOf(s1) != -1;
        }

        function toSubstrings(s) {
            let substrs = []
            for (let index = 0; index < s.length; index++) {
                substrs.push(s.slice(index, s.length))
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
            let score = 0;
            let index = string.indexOf(str);
            let f = fraction(str, string);
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
                let substrs = toSubstrings(str);
                for (let index = 0; index < substrs.length - 1; index++) {
                    let subscore = contentScore(substrs[index], string, false);
                    score = score + (subscore / substrs.length)
                }
                return score // / substrs.length    
            }
        }
    }

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

        let scores = {};
        let _data = []
        for (let index = 0; index < data.length; index++) {
            let itemValue = extractValue(data[index]);
            let score = contentScore(value, itemValue);
            if (score > 0) {
                _data.push(data[index])
                scores[itemValue] = score;
            }
        }
        _data = _data.sort(
            (a, b) => {
                let scoreA = scores[extractValue(a)];
                let scoreB = scores[extractValue(b)];
                return scoreB - scoreA;
            }
        );

        return _data;
    }

    // generate unique id 
    guid = (() => {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        };
    })();

    class Autocomplete {
        constructor(input, data, options) {
            this.input = input;
            this.data = this.fixData(data);
            this.filtered = this.data;
            this.activeElement = -1;

            this.dropdownItems = [];
            this.options = Object.assign(DEFAULT_OPTIONS, options || {});
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

            this.isShown = false
            this.setupListeners = this._setup_listeners;

            this.list = this.createList();
            this.hide()
            this.setupListeners();
        }

        fixData(data) {
            let rv = []
            for (let index = 0; index < data.length; index++) {
                let element = data[index];
                if (typeof (element) == 'string') {
                    element = { text: element };
                }
                element._uid = guid();
                rv.push(element);
            }
            return rv;
        }

        _setup_listeners() {
            let self = this;
            this.input.addEventListener("input", (e) => {
                let input = self.input;
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
        }

        _updateData(data) {
            this.data = this.fixData(data);
        }

        _show() {
            let lastItem = 0;
            for (let index = 0; index < this.filtered.length; index++) {
                let htmlElement = this.dropdownItems[this.filtered[index]._uid];
                if (htmlElement === null) {
                    continue;
                }
                this.options.showItem(htmlElement);
                this.list.insertBefore(htmlElement, this.list.children[lastItem],);
                lastItem++;
            }

            for (let index = lastItem; index < this.list.children.length; index++) {
                let child = this.list.childNodes[index];
                this.options.hideItem(child);
            }

            this.options.showList(this.list);
            this.isShown = true;
        }

        _filter(value) {
            this.filtered = this.data;
            if (this.options.filter != null) {
                this.filtered = this.options.filter(value, this.data, this.options.extractValue);
            }
        }

        _sort(value) {
            if (this.options.sort != null) {
                this.filtered = this.options.sort(value, this.filtered)
            }
        }

        _createList() {
            let a = document.createElement(this.options.dropDownTag);
            for (let index = 0; index < this.options.dropDownClasses.length; index++) {
                a.classList.add(this.options.dropDownClasses[index]);
            }

            for (let i = 0; i < this.data.length; i++) {
                let item = this.data[i];
                let b = this.createItem(item)
                a.appendChild(b);
            }
            this.input.parentNode.appendChild(a);
            return a;
        }

        _createItem(item) {
            /*create a DIV element for each matching element:*/
            let htmlElement = document.createElement("DIV");
            /*make the matching letters bold:*/
            let text = item.text;
            let _uid = item._uid;

            htmlElement.innerHTML = text;
            let attrs = item.attrs || {}
            let attrsKeys = Object.keys(attrs);
            for (let index = 0; index < attrsKeys.length; index++) {
                let key = attrsKeys[index]
                const val = attrs[key];
                htmlElement.setAttribute(key, val);
            }

            for (let index = 0; index < this.options.dropDownItemClasses.length; index++) {
                htmlElement.classList.add(this.options.dropDownItemClasses[index]);
            }

            this.dropdownItems[_uid] = htmlElement;
            let self = this;
            htmlElement.addEventListener("click", function (e) {
                self.options.onItemSelected(self.input, item, htmlElement, self);
            });
            if (this.options.onListItemCreated !== null && this.options.onListItemCreated !== undefined) {
                this.options.onListItemCreated(htmlElement, item);
            }
            return htmlElement;
        }

        _activateClosest(index, dir) {
            for (let i = index; i < this.list.childNodes.length;) {
                let e = this.list.childNodes[i];
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
        }

        _deactivateAll() {
            let all = this.list.querySelectorAll("." + this.options.activeClass);
            for (let index = 0; index < all.length; index++) {
                all[index].classList.remove(this.options.activeClass);
            }
        }



        _activateNext() {
            this._deactivateAll();
            this.activeElement++;
            this._activateClosest(this.activeElement, 1);
        }


        _activatePrev() {
            this._deactivateAll();
            this.activeElement--;
            this._activateClosest(this.activeElement, -1);
        }


        _selectActive() {
            let active = this.list.querySelector("." + this.options.activeClass);
            active.click();
        }



        _hide() {
            this.options.hideList(this.list)
            // this.list.style.display = 'none';
            this.isShown = false;
        }
    }

    window.autocomplete = {}
    window.autocomplete.init = (input, data, options) => {
        return new Autocomplete(input, data, options)
    }
}
)();




(function () {
    let DEFAULT_OPTIONS = {
        filterFun: filterFun,
        // scoreFun: contentScore,
        sortFun: null,
        dropDownClasses: ["dropdown"],
        dropDownItemClasses: [],
        dropDownTag: "div",

        hideItem: hideItem,
        showItem: showItem,
        showList: showList,
        hideList: hideList,
        onItemSelected: onItemSelected,
        activeClass: "active",
        isVisible: isVisible



    }

    function isVisible(element) {
        return element.style.display != 'none';
    }

    function onItemSelected(input, item, htmlElement, autcomplete) {
        input.value = item.text;
        input.setAttribute("data-value", item.value);
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

    function sortFun(value, data) {
        return data;
    }

    function filterFun(value, data) {

        let scores = {};
        let _data = []
        for (let index = 0; index < data.length; index++) {
            let score = contentScore(value, data[index].value);
            if (score > 1) {
                _data.push(data[index])
                scores[data[index].value] = score;
            }
        }
        _data = _data.sort(
            (a, b) => {
                let scoreA = scores[a.value];
                let scoreB = scores[b.value];
                return scoreB - scoreA;
            }
        );

        return _data;
    }

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
                const element = data[index];
                if (typeof (element) == 'string') {
                    rv.push({ text: element, value: element });
                } else {
                    rv.push(element)
                }
            }
            return rv;
        }

        _setup_listeners() {
            let self = this;
            this.input.addEventListener("input", (e) => {
                if (self.isShown) {
                    self.hide();
                }
                self.filter(e.target.value, true);
                self.sort(e.target.value);
                self.show();
            });

            /*execute a function presses a key on the keyboard:*/
            this.input.addEventListener("keydown", function (e) {
                if (!self.isShown) {
                    self.show();
                }
                if (e.keyCode == 40) {
                    self.activateNext();
                } else if (e.keyCode == 38) { //up
                    self.activatePrev();
                } else if (e.keyCode == 13) {
                    self.selectActive();
                }
            });
        }

        _updateData(data) {
            this.data = this.fixData(data);
        }

        _show() {
            let lastItem = 0;
            for (let index = 0; index < this.filtered.length; index++) {
                const val = this.filtered[index].value;
                let htmlElement = this.dropdownItems[val];
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
            if (this.options.filterFun != null) {
                this.filtered = this.options.filterFun(value, this.data);
            }
        }

        _sort(value) {
            if (this.options.sortFun != null) {
                this.filtered = this.options.sortFun(value, this.filtered)
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
            let value = item.value;

            htmlElement.innerHTML = text;
            htmlElement.setAttribute("data-value", value);

            for (let index = 0; index < this.options.dropDownItemClasses.length; index++) {
                htmlElement.classList.add(this.options.dropDownItemClasses[index]);
            }

            this.dropdownItems[value] = htmlElement;
            let self = this;
            htmlElement.addEventListener("click", function (e) {
                self.options.onItemSelected(self.input, item, htmlElement, self);
            });
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
    // window.autocomplete.options = DEFAULT_OPTIONS;
    // window.autocomplete.sortFun = contentScore;

}
)();




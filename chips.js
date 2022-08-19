
(() => {
    // Define defaults
    CHIP_DEFAULTS = {
        hasInput: true,
        chipsClass: 'chips',
        chipClass: 'chip',
        closeClass: 'chip-close',
        chipInputClass: "chip-input",
        setCloseBtn: false,
        OPTIONS: {
            // chips data , each item is an implementation of chipData
            data: [],
            placeholder: ''
        },
        // template for default chipData
        chipData: {
            id: null,
            text: '',
            img: '',
            imageWidth: 96,
            imageHeight: 96,
            attrs: {
                tabindex: '0',
            },
            // close setting
            close: true,
            closeClasses: null,
            closeCallback: null,
            closeHTML: null,
            onclick: null,
        }
    };

    // Define global object Chips
    (function setGlobal() {
        if (window.Chips == undefined) {
            window.Chips = {};
            window.Chips.settings = CHIP_DEFAULTS;
            window.Chips.addChip = addChip;
            window.Chips.init = init;
            window.Chips.registery = {}
        }
        return window.Chips;
    })();

    // Get the Chips global setting
    function settings() {
        return window.Chips.settings;
    }
    // Get the chips registery
    function registery() {
        return window.Chips.registery;
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

    // find closest element that have class
    function closest(el, cls) {
        if (el.hasAttribute("closest")) {
            return el.closest(cls);
        }

        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }


    function createChild(tag, attributes, classes, parent, options) {
        let ele = document.createElement(tag);
        let attrs_keys = Object.keys(attributes);
        for (let index = 0; index < attrs_keys.length; index++) {
            ele.setAttribute(attrs_keys[index], attributes[attrs_keys[index]]);
        }
        for (let index = 0; index < classes.length; index++) {
            const kls = classes[index];
            ele.classList.add(kls);
        }
        if (parent != undefined) {
            parent.appendChild(ele);
        }
        return ele;
    }

    function removeChip(id) {
        let chips = document.getElementsByClassName(settings().chipClass);
        for (let index = 0; index < chips.length; index++) {
            if (chips[index].getAttribute("chip-id") == id) {
                let elid = chips[index].parentElement.getAttribute("chips-id");
                chips[index].parentElement.removeChild(chips[index]);

                let registeryChips = registery()[elid].chips;
                delete registeryChips[id]
                return;
            }
        }
    }

    function createChip(data) {
        data = Object.assign(Object.assign({}, settings().chipData), data || {});
        if (data.id === undefined || data.id === null) {
            data.id = guid();
        }
        data.closeId = data.id + "_close"
        attrs = Object.assign(data.attrs, { "chip-id": data.id });
        const chip = createChild('div', attrs, ['chip'], null);

        if (data.image) {
            createChild('img',
                {
                    width: data.imageWidth || 96,
                    height: data.imageHeight || 96,
                    src: data.image,
                },
                [],
                chip,
                {}
            )
        }
        if (data.text) {
            let span = createChild(
                'span',
                {},
                [],
                chip,
                {}
            );
            span.innerHTML = data.text
        }
        if (data.close) {
            const classes = data.closeClasses || ['chip-close']
            let span = createChild('span',
                { id: data.closeId },
                classes,
                chip,
                {}
            );

            span.innerHTML = data.closeHTML || '&times'
        }
        if (data.onclick !== null && data.onclick !== undefined) {


            chip.addEventListener("click", (e) => {
                if (e.target.getAttribute("id") !== data.closeId) {
                    data.onclick(e);
                }
            })
        }
        return chip;
    }

    function addChip(data, element) {
        let elid = element.getAttribute('chips-id');
        if (elid === undefined || elid === null) {
            elid = guid();
        }
        // get element registery
        let reg = registery()[elid];
        if (reg === undefined || reg === null) {
            reg = { chips: {} };
            registery()[elid] = reg;
        }
        // get input element 
        let input = reg.input;
        if (input === undefined || input === null) {
            let inputs = element.getElementsByTagName("input");
            if (inputs.length > 0) {
                input = inputs[0]
            } else {
                input = null;
            }
        }
        // Try to remove old chip
        let chipId = data.id
        if (chipId !== null && chipId !== undefined && reg.chips[chipId]) {
            removeChip(chipId);
        }

        let chip = createChip(data);
        chipId = chip.getAttribute("chip-id");
        if (input === null) {
            element.appendChild(chip);
        } else if (input.parentElement == element) {
            element.insertBefore(chip, input);
        } else {
            element.appendChild(chip);
        }
        if (reg.chips === undefined || reg.chips === null) {
            reg.chips = {};
        }
        reg.chips[chipId] = chip;
        return;
    }

    function init(element, options) {
        // Make copy of the default options,
        // copy this options to it
        options = Object.assign(Object.assign({}, settings().OPTIONS), options || {},);
        element.classList.add(settings().chipsClass);
        if (element.getAttribute('chips-id') == undefined) {
            element.setAttribute('chips-id', guid());
        }
        let elementId = element.getAttribute('chips-id');

        const Registery = {};
        registery()[elementId] = Registery;
        Registery.element = element;
        Registery.options = options;
        Registery.input = _set_input(element);

        function _set_input(element) {
            if (options.hasInput === false) {
                return;
            }
            let input = element.getElementsByTagName('input');
            if (input.length == 0) {
                // create input and append to element
                input = createChild('input', { 'placeholder': options.placeholder || '' }, [settings().chipInputClass], element, options);
            } else {
                input = input[0]
            }
            // set event listener
            input.addEventListener('focusout', () => {
                element.classList.remove('focus');
            });

            input.addEventListener("keydown", (e) => {
                // enter
                if (e.keyCode === 13) {
                    // Override enter if autocompleting.
                    if (options.autocomplete !== undefined && options.autocomplete.isShown) {
                        return;
                    }

                    e.preventDefault();
                    if (input.value !== '') {
                        addChip({
                            text: input.value,
                            setCloseBtn: options.setCloseBtn

                        }, element);
                    }
                    input.value = '';
                    return false;
                }
            });
            return input;
        }


        function _handleChipClick(_element) {
            _element.addEventListener('click', (e) => {
                e.preventDefault();
                let target = e.target;
                if (target.classList.contains(settings().chipsClass)) {
                    if (Registery.input !== undefined && Registery.input !== null) {
                        Registery.input.focus();
                    }
                    element.classList.add('focus');
                } else if (target.classList.contains(settings().chipInputClass)) {
                    target.focus();
                    element.classList.add('focus');

                } else if (target.classList.contains(settings().chipClass)) {
                    target.focus();

                }
                // else if (target.classList.contains(settings().closeClass)) {
                //     let chip = closest(target, settings().chipClass);
                //     removeChip(chip.getAttribute("chip-id"));
                // }
            });
        }

        function _handleDelete(_element) {

            _element.addEventListener("keydown", (e) => {
                if (!e.target.classList.contains(settings().chipClass)) {
                    return;
                }

                if (e.keyCode == 8 || e.keyCode == 46) {
                    let id = e.target.getAttribute("chip-id");
                    removeChip(id);
                }
            });
        }

        // Event listeners
        function _setupEventHandlers() {
            _handleChipClick(element);
            _handleDelete(element);
        }

        // Fill initial data
        if (options.data != undefined) {
            for (let index = 0; index < options.data.length; index++) {
                const chipData = options.data[index]; // Object.assign(Object.assign({}, settings().chipData), 
                addChip(chipData, element);
            }
        }

        _setupEventHandlers();
    }
})();
(
  () => {
    const DEFAULT_SETTINGS = {
      createInput: true,
      chipsClass: 'chips',
      chipClass: 'chip',
      closeClass: 'chip-close',
      chipInputClass: 'chip-input',
      setCloseBtn: false,
      imageWidth: 96,
      imageHeight: 96,
      close: true,
      onclick: null,
      onclose: null,
      data: []
    };

    // Define global object Chips
    (function setGlobal () {
      if (window.Chips === undefined || window.Chips === null) {
        window.Chips = {}
        window.Chips.settings = DEFAULT_SETTINGS
        window.Chips.init = init
      }
    })()

    const chipData = {
      id: null,
      text: '',
      img: '',
      attrs: {
        tabindex: '0'
      },
      closeClasses: null,
      closeHTML: null,
      onclick: null,
      onclose: null
    }

    /**
    * generate unique id
    */
    const guid = (() => {
      function s4 () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
      }
      return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
      }
    })()

    function createChild (tag, attributes, classes, parent, options) {
      const ele = document.createElement(tag)
      const attrsKeys = Object.keys(attributes)
      for (let index = 0; index < attrsKeys.length; index++) {
        ele.setAttribute(attrsKeys[index], attributes[attrsKeys[index]])
      }
      for (let index = 0; index < classes.length; index++) {
        const kls = classes[index]
        ele.classList.add(kls)
      }
      if (parent !== undefined && parent !== null) {
        parent.appendChild(ele)
      }
      return ele
    }

    /**
     * _create_chip, This is an internal function, accessed by the Chips._addChip method
     * @param {*} data The chip data to create,
     * @returns HTMLElement
     */
    function _createChip (data) {
      data = Object.assign(Object.assign({}, chipData), data)
      data.closeId = data.id + '_close'
      const attrs = Object.assign(data.attrs, { 'chip-id': data.id })
      const chip = createChild('div', attrs, ['chip'], null)

      if (data.image) {
        createChild('img',
          {
            width: data.imageWidth || 96,
            height: data.imageHeight || 96,
            src: data.image
          },
          [],
          chip,
          {}
        )
      }
      if (data.text) {
        const span = createChild(
          'span',
          {},
          [],
          chip,
          {}
        )
        span.innerHTML = data.text
      }
      if (data.close) {
        const classes = data.closeClasses || ['chip-close']
        const span = createChild('span',
          { id: data.closeId },
          classes,
          chip,
          {}
        )

        span.innerHTML = data.closeHTML || '&times'
        if (data.onclose !== null && data.onclose !== undefined) {
          span.addEventListener('click', (e) => {
            e.stopPropagation()
            data.onclose(chip)
          })
        }
      }
      if (data.onclick !== null && data.onclick !== undefined) {
        chip.addEventListener('click', (e) => {
          // if (e.target.getAttribute('id') !== data.closeId) {
          data.onclick(e)
          // }
        })
      }
      return chip
    }

    // Get the Chips global setting
    function settings () {
      return window.Chips.settings
    }

    function assign (listOfObjects) {
      let o = {}
      for (let index = 0; index < listOfObjects.length; index++) {
        o = Object.assign(o, listOfObjects[index])
      }
      return o
    }

    class ChipsElement {
      // eslint-disable-next-line space-before-function-paren
      constructor(element, options) {
        this.options = assign([settings(), options || {}])
        this.options.cleanedData = []
        this.element = element
        this._setElementListeners()
        this.input = this._setInput()
        element.classList.add(this.options.chipsClass)
        if (element.getAttribute('chips-id') === undefined) {
          element.setAttribute('chips-id', guid())
        }
        this.addChip = this._addChip.bind(this)
        this.setAutocomplete = this._setAutocomplete.bind(this)

        for (let index = 0; index < this.options.data.length; index++) {
          this.addChip(this.options.data[index])
        }
      }

      _setAutocomplete (autocompleteObj) {
        this.options.autocomplete = autocompleteObj
      }

      /**
       * add chip to element by passed data
       * @param {*} data chip data, Please see `chipData` documnetations.
       */
      _addChip (data) {
        const elid = this.element.getAttribute('chips-id')
        if (elid === undefined) {
          throw Error('You should call init first')
        }
        // get input element
        data = assign([chipData, this.options, data])
        if (data.id === undefined || data.id === null) {
          data.id = guid()
        }
        data.onclick = (e) => { this._handleChipClick(e, data) }
        data.onclose = (e) => { this._handleChipClose(e, data) }

        const chip = _createChip(data)
        const input = this.input
        if (input === null || input === undefined) {
          this.element.appendChild(chip)
        } else if (input.parentElement === this.element) {
          this.element.insertBefore(chip, input)
        } else {
          this.element.appendChild(chip)
        }
        this.options.cleanedData.push(data)
      }

      _setInput () {
        let input = null
        if (this.options.input !== null && this.options.input !== undefined) {
          input = this.options.input
        } else {
          const inputs = this.element.getElementsByClassName(this.options.chipInputClass)
          if (inputs.length > 0) {
            input = inputs[0]
          }
        }

        if (input === null || input === undefined) {
          if (this.options.createInput) {
            // create input and append to element
            input = createChild(
              'input',
              { placeholder: this.options.placeholder || '' },
              [this.options.chipInputClass],
              this.element
            )
          } else {
            return
          }
        }
        const self = this
        // set event listener
        input.addEventListener('focusout', () => {
          this.element.classList.remove('focus')
        })

        input.addEventListener('focusin', () => {
          this.element.classList.add('focus')
        })

        input.addEventListener('keydown', (e) => {
          // enter
          if (e.keyCode === 13) {
            // Override enter if autocompleting.
            if (self.options.autocomplete !== undefined &&
              self.options.autocomplete !== null &&
              self.options.autocomplete.isShown) {
              return
            }
            if (input.value !== '') {
              self.addChip({
                text: input.value
              })
            }
            input.value = ''
            return false
          }
        })
        return input
      }

      _setElementListeners () {
        const self = this
        this.element.addEventListener('click', () => {
          self.input.focus()
        })
        this.element.addEventListener('keydown', (e) => {
          if (!e.target.classList.contains(settings().chipClass)) {
            return
          }

          if (e.keyCode === 8 || e.keyCode === 46) {
            self._removeChip(e.target)
          }
        })
      }

      _handleChipClick (e, data) {
        e.target.focus()
        e.stopPropagation()
      }

      _handleChipClose (chip, data) {
        chip.parentElement.removeChild(chip)
        for (let index = 0; index < this.options.cleanedData.length; index++) {
          if (this.options.cleanedData[index] !== undefined && this.options.cleanedData[index] !== null) {
            if (data.id === this.options.cleanedData[index].id) {
              delete this.options.cleanedData[index]
            }
          }
        }
      }

      _removeChip (chip) {
        let data = {}
        for (let index = 0; index < this.options.cleanedData.length; index++) {
          const element = this.options.cleanedData[index]
          if (element !== undefined && element !== null) {
            data = this.options.cleanedData[index]
          }
        }
        this._handleChipClose(chip, data)
      }
    }

    function init (element, options) {
      return new ChipsElement(element, options)
    }
  }
)()

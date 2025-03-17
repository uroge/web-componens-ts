import { CustomOption } from './custom-option';
import './custom-select.css';

const EventKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ESCAPE: 'Escape',
} as const;

type EventKey = (typeof EventKeys)[keyof typeof EventKeys];

const customSelectTemplate = document.createElement('template');

customSelectTemplate.innerHTML = `
  <style>
    .select-container {
      position: relative;
      display: inline-block;
      font-family: inherit;
    }
    .select-button {
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      width: 100%;
      text-align: left;
    }
    .select-button span { color: inherit; }
    .select-button:focus { outline: 2px solid #007bff; }
    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 10;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      min-width: 200px;
      display: none;
      overflow: auto;
      max-height: 200px;
    }
    .select-dropdown[aria-hidden="true"] {
      display: none;
    }
    .select-dropdown custom-option:focus {
      outline: 2px solid #007bff;
    }
  </style>
  
  <div class="select-container">
    <button class="select-button" part="select" aria-haspopup="true" aria-expanded="false">
    <span>
      Select an option
    </span>
    </button>
    <div class="select-dropdown" role="listbox" aria-hidden="true">
      <slot></slot>
    </div>
  </div>`;

class CustomSelect extends HTMLElement {
  private _value = '';
  private _label = 'Select an option';
  private _options: CustomOption[] = [];
  private _isOpen = false;

  static get observedAttributes() {
    return ['value', 'label'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(
      customSelectTemplate.content.cloneNode(true)
    );
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listbox');
    }

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    const button = this.shadowRoot?.querySelector('.select-button');
    if (button) {
      button.setAttribute('tabindex', '-1'); // Prevent direct focus
    }

    this.addEventListener('focus', () => {
      // @ts-ignore
      button?.focus();
    });

    this.addEventListener('click', this._handleClick.bind(this));
    this.addEventListener('keydown', this._handleKeyDown.bind(this));

    document.addEventListener(
      'click',
      this._handleDropdownClose.bind(this)
    );
    document.addEventListener(
      'focusin',
      this._handleDropdownClose.bind(this)
    );

    const slot = this.shadowRoot?.querySelector('slot');
    slot?.addEventListener(
      'slotchange',
      this._handleSlotChange.bind(this)
    );
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this._handleKeyDown);
    this.removeEventListener('click', this._handleClick);

    document.removeEventListener('click', this._handleDropdownClose);
    document.removeEventListener(
      'focusin',
      this._handleDropdownClose
    );

    const slot = this.shadowRoot?.querySelector('slot');
    slot?.removeEventListener('slotchange', this._handleSlotChange);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'value') {
      this._value = newValue ?? '';
      this._updateOptionSelection();
    } else if (name === 'label') {
      this._label = newValue ?? '';
    }
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this.setAttribute('value', value);
  }

  get label(): string {
    return this._label;
  }

  set label(label: string) {
    this.setAttribute('label', label);
  }

  private _handleSlotChange() {
    const slot = this.shadowRoot?.querySelector(
      'slot'
    ) as HTMLSlotElement;
    this._options = Array.from(slot.assignedElements()).filter(
      (el) => el instanceof CustomOption
    ) as CustomOption[];
    this._updateOptionSelection();
  }

  private _handleClick(event: MouseEvent) {
    // If dropdown is open and clicking outside, close it
    if (this._isOpen) {
      const path = event.composedPath();
      const optionElement = path.find(
        (el) => el instanceof CustomOption
      ) as CustomOption | undefined;

      if (optionElement) {
        this._selectOption(optionElement);
        this._closeDropdown();
        this._dispatchChangeEvent();
      } else {
        this._closeDropdown();
      }
    } else {
      this._toggleDropDown();
    }
  }

  private _handleKeyDown(event: KeyboardEvent) {
    const options = this._options;
    const eventKey = event.key as EventKey;

    if (!this._isOpen) {
      if (
        eventKey === EventKeys.ENTER ||
        eventKey === EventKeys.SPACE ||
        eventKey === EventKeys.ARROW_DOWN ||
        eventKey === EventKeys.ARROW_UP
      ) {
        this._isOpen = true;
        this._updateDropdown();
        this._focusOption(options[0]);
        event.preventDefault();
      }
      return;
    }

    const focusedIndex = options.findIndex((option) =>
      option.matches(':focus')
    );

    switch (eventKey) {
      case EventKeys.ARROW_DOWN:
        event.preventDefault();
        let nextIndex = focusedIndex + 1;
        if (nextIndex >= options.length) {
          // Loop back to the first option
          nextIndex = 0;
        }
        this._focusOption(options[nextIndex]);
        break;
      case EventKeys.ARROW_UP:
        event.preventDefault();
        let prevIndex = focusedIndex - 1;
        if (prevIndex < 0) {
          // Loop back to the last option
          prevIndex = options.length - 1;
        }
        this._focusOption(options[prevIndex]);
        break;
      case EventKeys.ENTER:
      case EventKeys.SPACE:
        event.preventDefault();
        const focusedElement = this._options.find((option) =>
          option.matches(':focus')
        );

        if (focusedElement) {
          this._selectOption(focusedElement);
          this._closeDropdown();
          this._dispatchChangeEvent();
        }
        break;
      case EventKeys.ESCAPE:
        this._closeDropdown();
        // @ts-ignore
        this.shadowRoot?.querySelector('.select-button')?.focus();
        break;
    }
  }

  private _toggleDropDown() {
    this._isOpen = !this._isOpen;
    this._updateDropdown();
  }

  private _closeDropdown() {
    if (!this._isOpen) {
      return;
    }

    this._isOpen = false;
    this._updateDropdown();
  }

  private _updateDropdown() {
    const dropdownElement = this.shadowRoot?.querySelector(
      '.select-dropdown'
    ) as HTMLElement;
    dropdownElement.style.display = this._isOpen ? 'block' : 'none';

    const selectedOption = this._options.find((opt) => opt.selected);
    if (this._isOpen && !selectedOption && this._options.length > 0) {
      this._options[0].focus();
    }

    dropdownElement.setAttribute(
      'aria-hidden',
      String(!this._isOpen)
    );
    dropdownElement.setAttribute(
      'aria-expanded',
      String(this._isOpen)
    );
  }

  private _handleDropdownClose(event: Event) {
    if (
      this._isOpen &&
      event.target !== this &&
      !this.contains(event.target as Node)
    ) {
      this._closeDropdown();
    }
  }

  private _selectOption(option: CustomOption) {
    const button = this.shadowRoot?.querySelector(
      '.select-button'
    ) as HTMLButtonElement;

    if (button) {
      const labelHolder = button.querySelector('span');

      if (labelHolder) {
        labelHolder.textContent = option.label;
        this.value = option.value;
        this.label = option.label;
      }
    }
  }

  private _dispatchChangeEvent() {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _focusOption(option: CustomOption) {
    option.focus();
  }

  private _updateOptionSelection() {
    this._options.forEach((option) => {
      option.selected = option.value === this._value;
    });
  }
}

customElements.define('custom-select', CustomSelect);

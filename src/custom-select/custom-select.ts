import { CustomOption } from './custom-option';
import './custom-select.css';

(() => {
  class CustomSelect extends HTMLElement {
    private _value: string = '';
    private _label: string = 'Select an option';
    private _options: CustomOption[] = [];
    private _isOpen: boolean = false;

    static get observedAttributes() {
      return ['value', 'label'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this._render();
      this.addEventListener('click', this._handleClick.bind(this));
      document.addEventListener(
        'click',
        this._closeDropdown.bind(this)
      );
      document.addEventListener(
        'focusin',
        this._closeDropdown.bind(this)
      );
      this.addEventListener(
        'keydown',
        this._handleKeyDown.bind(this)
      );

      const slot = this.shadowRoot?.querySelector('slot');
      slot?.addEventListener(
        'slotchange',
        this._handleSlotChange.bind(this)
      );
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._closeDropdown);
      document.removeEventListener('focusin', this._closeDropdown);
      this.removeEventListener('keydown', this._handleKeyDown);
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ) {
      if (oldValue === newValue) return;

      if (name === 'value') {
        this._value = newValue ?? '';
        this._updateOptionSelection();
      } else if (name === 'label') {
        this._label = newValue ?? '';
      }
      this._render();
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
      this._render();
    }

    private _handleClick(event: MouseEvent) {
      const path = event.composedPath();
      const button = path.find(
        (el) =>
          el instanceof HTMLElement &&
          el.classList.contains('select-button')
      ) as HTMLElement | undefined;

      if (button) {
        this._isOpen = !this._isOpen;
        this._render();
        return;
      }

      const optionElement = path.find(
        (el) => el instanceof CustomOption
      ) as CustomOption | undefined;

      if (optionElement) {
        const newValue = optionElement.value;
        if (newValue !== this._value) {
          this.value = newValue;
          this._isOpen = false;
          this._render();
          this._dispatchChangeEvent();
        }
      }
    }

    private _handleKeyDown(event: KeyboardEvent) {
      if (!this._isOpen) {
        if (
          ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)
        ) {
          this._isOpen = true;
          this._render();
          event.preventDefault();
        }
        return;
      }

      const options = this._options;
      const selectedIndex = options.findIndex(
        (option) => option.value === this._value
      );

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          let nextIndex = selectedIndex + 1;
          if (nextIndex >= options.length) nextIndex = 0;
          this._focusOption(options[nextIndex]);
          break;
        case 'ArrowUp':
          event.preventDefault();
          let prevIndex = selectedIndex - 1;
          if (prevIndex < 0) prevIndex = options.length - 1;
          this._focusOption(options[prevIndex]);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          const focusedElement = this.shadowRoot
            ?.activeElement as CustomOption | null;
          if (focusedElement) {
            this.value = focusedElement.value;
            this._isOpen = false;
            this._render();
            this._dispatchChangeEvent();
          }
          break;
        case 'Escape':
          this._isOpen = false;
          this._render();
          // @ts-ignore
          this.shadowRoot?.querySelector('.select-button')?.focus();
          break;
      }
    }

    private _closeDropdown(event: Event) {
      if (
        this._isOpen &&
        event.target !== this &&
        !this.contains(event.target as Node)
      ) {
        this._isOpen = false;
        this._render();
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

    private _render() {
      if (!this.shadowRoot) {
        return;
      }

      const selectedOption = this._options.find(
        (opt) => opt.selected
      );

      console.log({ label: selectedOption });
      const isOpen = this._isOpen ? 'block' : 'none';

      this.shadowRoot.innerHTML = `
        <style>
          .select-container { position: relative; display: inline-block; font-family: sans-serif; }
          .select-button { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; width: 100%; text-align: left; }
          .select-button span { color: red; }
          .select-button:focus { outline: 2px solid #007bff; }
          .select-dropdown { position: absolute; top: 100%; left: 0; z-index: 10; background: #fff; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); min-width: 200px; display: ${isOpen}; }
          .select-dropdown[aria-hidden="true"] { display: none; }
          .select-dropdown custom-option:focus { outline: 2px solid #007bff; }
        </style>
  
        <div class="select-container">
          <button class="select-button" aria-haspopup="true" aria-expanded="${
            this._isOpen
          }">
          <span>
              ${
                selectedOption?.label
                  ? selectedOption?.label
                  : this._label ?? 'Select an option'
              }
            </span>
          </button>
          <div class="select-dropdown" role="listbox" aria-hidden="${!this
            ._isOpen}">
            <slot></slot>
          </div>
        </div>
      `;

      if (
        this._isOpen &&
        !selectedOption &&
        this._options.length > 0
      ) {
        this._options[0].focus();
      }
    }
  }

  customElements.define('custom-select', CustomSelect);
})();

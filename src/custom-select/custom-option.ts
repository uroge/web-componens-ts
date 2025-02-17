export class CustomOption extends HTMLElement {
  private _value: string = '';
  private _label: string = '';
  private _selected: boolean = false;

  static get observedAttributes() {
    return ['value', 'label', 'selected'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._processSlotContent();
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
    } else if (name === 'label') {
      this._label = newValue ?? '';
    } else if (name === 'selected') {
      this._selected = newValue !== null;
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

  get selected(): boolean {
    return this._selected;
  }

  set selected(selected: boolean) {
    if (selected) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  focus() {
    this.shadowRoot?.querySelector('div')?.focus();
  }

  private _processSlotContent() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    // Run after slot assigns light DOM content
    setTimeout(() => {
      const assignedNodes = slot.assignedNodes();
      assignedNodes.forEach((node) => {
        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent?.trim()
        ) {
          // Wrap text nodes with span
          const span = document.createElement('span');
          span.textContent = node.textContent;
          (node as ChildNode).replaceWith(span); // Replace raw text with span

          // Update the label from the text content
          this._label = node.textContent?.trim() ?? '';
        }
      });
    });
  }
  private _render() {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
        <style>
            div {
                display: block;
                padding: 8px 12px;
                cursor: pointer;
                outline: none;
            }

            div:focus {
                outline: 2px solid #007bff;
            }

            :host([selected]) div {
                background-color: #f0f0f0;
            }

            /* Ensures text color applies inside the slot */
            ::slotted(*) {
                color: red; /* Change text color */
            }
        </style>
        <div tabindex="0">
            <slot>
            rede</slot>
        </div>
    `;
  }
}

customElements.define('custom-option', CustomOption);

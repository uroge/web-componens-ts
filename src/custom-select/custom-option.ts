const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block; /* Important for layout */
      cursor: pointer;
      outline: none;  /* Remove default outline */
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :host([selected]) {
      background-color: #f0f0f0;
    }

    :host(:focus) {
      outline-offset: -2px;
      outline: 2px solid #007bff;
    }

    :host(:hover) {
      background-color: #f9f9f9;
    }

    div {
      display: block;
      padding: 8px 12px;
      cursor: pointer;
      outline: none;
    }

    /* Ensures text color applies inside the slot */
    ::slotted(*) {
      color: inherit; /* Change text color */
    }
  </style>
  <div>
    <slot>
    </slot>
  </div>
`;

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
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'option');
    }

    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    this._upgradeProperty('value');
    this._upgradeProperty('label');
    this._upgradeProperty('selected');
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
      this.setAttribute('aria-selected', String(this._selected));
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

  get selected(): boolean {
    return this.hasAttribute('selected');
  }

  set selected(selected: boolean) {
    if (selected) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  // When propery is set on element before its definition has been loaded
  // Reference: https://web.dev/articles/custom-elements-best-practices#make_properties_lazy
  private _upgradeProperty(prop: string) {
    const property = prop as keyof this;
    if (this.hasOwnProperty(property)) {
      let value = this[property];
      delete this[property];
      this[property] = value;
    }
  }

  private _processSlotContent() {
    const slot = this.shadowRoot?.querySelector('slot');

    if (!slot) {
      return;
    }

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
}

customElements.define('custom-option', CustomOption);

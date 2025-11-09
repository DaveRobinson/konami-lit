import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { KonamiController } from '@konami-lit/controller';

/**
 * A web component that reveals content when the Konami code is successfully entered.
 *
 * @slot initial - Content to display before the code is activated (optional)
 * @slot revealed - Content to display after successful code entry
 *
 * @fires konami-activated - Fired when the Konami code is successfully completed
 * @fires konami-progress - Fired when progress is made through the sequence
 * @fires konami-reset - Fired when the sequence is reset
 *
 * @example
 * ```html
 * <!-- Shadow DOM (default) -->
 * <konami-reveal>
 *   <div slot="initial">Press the Konami code...</div>
 *   <div slot="revealed">🎉 Secret unlocked!</div>
 * </konami-reveal>
 *
 * <!-- Light DOM (for CMS compatibility) -->
 * <konami-reveal light-dom>
 *   <div slot="initial">Press the Konami code...</div>
 *   <div slot="revealed">🎉 Secret unlocked!</div>
 * </konami-reveal>
 *
 * <!-- Custom code sequence -->
 * <konami-reveal code='["a","b","c"]'>
 *   <div slot="revealed">You pressed A, B, C!</div>
 * </konami-reveal>
 * ```
 */
@customElement('konami-reveal')
export class KonamiReveal extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      width: 100%;
    }

    ::slotted([slot="initial"]) {
      display: block;
    }

    ::slotted([slot="revealed"]) {
      display: none;
    }

    :host([activated]) ::slotted([slot="initial"]) {
      display: none;
    }

    :host([activated]) ::slotted([slot="revealed"]) {
      display: block;
    }
  `;

  /**
   * Whether to use Light DOM instead of Shadow DOM.
   * Set to true for CMS compatibility (Drupal SDC, WordPress blocks, etc.)
   * @default false
   */
  @property({ type: Boolean, attribute: 'light-dom' })
  lightDom = false;

  /**
   * Whether the Konami code has been activated
   */
  @property({ type: Boolean, reflect: true })
  activated = false;

  /**
   * Custom key sequence to detect. If not provided, uses the classic Konami code.
   * Can be set as a JSON string attribute or an array property.
   * @example code='["a","b","c"]'
   */
  @property({
    type: Array,
    converter: {
      fromAttribute: (value: string | null) => {
        if (!value) return undefined;
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
    }
  })
  code?: string[];

  /**
   * Timeout in milliseconds between key presses before resetting the sequence.
   * @default 2000
   */
  @property({ type: Number })
  timeout = 2000;

  private konami!: KonamiController;

  /**
   * Override createRenderRoot to support light DOM rendering
   */
  protected createRenderRoot() {
    return this.lightDom ? this : super.createRenderRoot();
  }

  connectedCallback() {
    super.connectedCallback();

    // Initialize controller here after properties are set
    this.konami = new KonamiController(this, {
      code: this.code,
      timeout: this.timeout
    });

    this.addEventListener('konami-activated', this.handleActivated as EventListener);
    this.addEventListener('konami-progress', this.handleProgress as EventListener);
    this.addEventListener('konami-reset', this.handleReset as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('konami-activated', this.handleActivated as EventListener);
    this.removeEventListener('konami-progress', this.handleProgress as EventListener);
    this.removeEventListener('konami-reset', this.handleReset as EventListener);
  }

  private handleActivated = () => {
    this.activated = true;
  };

  private handleProgress = (e: Event) => {
    const customEvent = e as CustomEvent;
    // Only re-dispatch if this is the original event from controller (composed: false)
    // This prevents infinite loop from re-dispatching our own re-dispatched events
    if (!customEvent.composed) {
      this.dispatchEvent(new CustomEvent('konami-progress', {
        detail: customEvent.detail,
        bubbles: true,
        composed: true
      }));
    }
  };

  private handleReset = (e: Event) => {
    // Only re-dispatch if this is the original event from controller (composed: false)
    if (!(e as CustomEvent).composed) {
      this.dispatchEvent(new CustomEvent('konami-reset', {
        bubbles: true,
        composed: true
      }));
    }
  };

  /**
   * Manually reset the activated state
   */
  reset() {
    this.activated = false;
  }

  /**
   * Get the current progress through the sequence
   */
  get progress() {
    return this.konami.progress;
  }

  /**
   * Get the total length of the sequence
   */
  get total() {
    return this.konami.total;
  }

  /**
   * Get the next expected key in the sequence
   */
  get nextExpectedKey() {
    return this.konami.nextExpectedKey;
  }

  render() {
    return html`
      <div class="container">
        <slot name="initial"></slot>
        <slot name="revealed"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'konami-reveal': KonamiReveal;
  }
}

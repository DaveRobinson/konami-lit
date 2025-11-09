import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './konami-reveal';
import type { KonamiReveal } from './konami-reveal';

describe('KonamiReveal', () => {
  let element: KonamiReveal;

  beforeEach(async () => {
    element = await fixture<KonamiReveal>(html`
      <konami-reveal>
        <div slot="initial">Initial content</div>
        <div slot="revealed">Revealed content</div>
      </konami-reveal>
    `);
  });

  describe('rendering', () => {
    it('should render the component', () => {
      expect(element).to.exist;
      expect(element.tagName).toBe('KONAMI-REVEAL');
    });

    it('should render both slots', () => {
      const slots = element.shadowRoot?.querySelectorAll('slot');
      expect(slots?.length).toBe(2);

      const initialSlot = element.shadowRoot?.querySelector('slot[name="initial"]');
      const revealedSlot = element.shadowRoot?.querySelector('slot[name="revealed"]');
      expect(initialSlot).to.exist;
      expect(revealedSlot).to.exist;
    });

    it('should show initial content by default', () => {
      const initialContent = element.querySelector('[slot="initial"]');
      expect(initialContent?.textContent).toBe('Initial content');
    });

    it('should have revealed content in the DOM', () => {
      const revealedContent = element.querySelector('[slot="revealed"]');
      expect(revealedContent?.textContent).toBe('Revealed content');
    });
  });

  describe('shadow DOM vs light DOM', () => {
    it('should use shadow DOM by default', () => {
      expect(element.shadowRoot).to.exist;
      expect(element.lightDom).toBe(false);
    });

    it('should use light DOM when light-dom attribute is set', async () => {
      const lightElement = await fixture<KonamiReveal>(html`
        <konami-reveal light-dom>
          <div slot="initial">Initial</div>
          <div slot="revealed">Revealed</div>
        </konami-reveal>
      `);

      expect(lightElement.lightDom).toBe(true);
      expect(lightElement.shadowRoot).to.be.null;
    });
  });

  describe('activation state', () => {
    it('should not be activated by default', () => {
      expect(element.activated).toBe(false);
      expect(element.hasAttribute('activated')).toBe(false);
    });

    it('should update activated state when konami-activated event is fired', async () => {
      const event = new CustomEvent('konami-activated');
      element.dispatchEvent(event);
      await element.updateComplete;

      expect(element.activated).toBe(true);
      expect(element.hasAttribute('activated')).toBe(true);
    });

    it('should reset activated state when reset() is called', async () => {
      element.activated = true;
      await element.updateComplete;

      element.reset();
      await element.updateComplete;

      expect(element.activated).toBe(false);
    });
  });

  describe('custom code sequence', () => {
    it('should accept custom code as array property', async () => {
      const customElement = await fixture<KonamiReveal>(html`
        <konami-reveal .code=${['a', 'b', 'c']}>
          <div slot="revealed">Custom sequence!</div>
        </konami-reveal>
      `);

      expect(customElement.code).to.deep.equal(['a', 'b', 'c']);
      expect(customElement.total).toBe(3);
    });

    it('should accept custom code as JSON string attribute', async () => {
      const customElement = await fixture<KonamiReveal>(html`
        <konami-reveal code='["x", "y", "z"]'>
          <div slot="revealed">Custom sequence!</div>
        </konami-reveal>
      `);

      expect(customElement.code).to.deep.equal(['x', 'y', 'z']);
      expect(customElement.total).toBe(3);
    });

    it('should use default Konami code when no custom code is provided', () => {
      expect(element.total).toBe(10);
    });
  });

  describe('timeout property', () => {
    it('should use default timeout of 2000ms', () => {
      expect(element.timeout).toBe(2000);
    });

    it('should accept custom timeout', async () => {
      const customElement = await fixture<KonamiReveal>(html`
        <konami-reveal timeout="5000">
          <div slot="revealed">Revealed</div>
        </konami-reveal>
      `);

      expect(customElement.timeout).toBe(5000);
    });
  });

  describe('event re-dispatching', () => {
    it('should re-dispatch konami-progress event with bubbles and composed', async () => {
      const progressSpy = vi.fn();
      element.addEventListener('konami-progress', progressSpy);

      // Simulate controller event (composed: false)
      const event = new CustomEvent('konami-progress', {
        detail: { position: 5, total: 10 },
        bubbles: false,
        composed: false
      });
      element.dispatchEvent(event);
      await element.updateComplete;

      // Should receive both: original (composed:false) and re-dispatched (composed:true)
      expect(progressSpy).toHaveBeenCalledTimes(2);

      // Verify one is composed (re-dispatched)
      const calls = progressSpy.mock.calls;
      const hasComposedEvent = calls.some(call => call[0].composed === true);
      expect(hasComposedEvent).toBe(true);
    });

    it('should re-dispatch konami-reset event with bubbles and composed', async () => {
      const resetSpy = vi.fn();
      element.addEventListener('konami-reset', resetSpy);

      // Simulate controller event (composed: false)
      const event = new CustomEvent('konami-reset', {
        bubbles: false,
        composed: false
      });
      element.dispatchEvent(event);
      await element.updateComplete;

      // Should receive both: original (composed:false) and re-dispatched (composed:true)
      expect(resetSpy).toHaveBeenCalledTimes(2);

      // Verify one is composed (re-dispatched)
      const calls = resetSpy.mock.calls;
      const hasComposedEvent = calls.some(call => call[0].composed === true);
      expect(hasComposedEvent).toBe(true);
    });
  });

  describe('public API', () => {
    it('should expose progress property', () => {
      expect(element.progress).toBe(0);
    });

    it('should expose total property', () => {
      expect(element.total).toBe(10);
    });

    it('should expose nextExpectedKey property', () => {
      expect(element.nextExpectedKey).toBe('ArrowUp');
    });

    it('should expose reset method', () => {
      expect(typeof element.reset).toBe('function');
    });
  });

  describe('integration with KonamiController', () => {
    it('should activate when full sequence is completed', async () => {
      const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                       'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                       'b', 'a'];

      sequence.forEach(key => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, repeat: false }));
      });

      await element.updateComplete;

      expect(element.activated).toBe(true);
    });

    it('should track progress through the sequence', async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      await element.updateComplete;

      expect(element.progress).toBe(1);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      await element.updateComplete;

      expect(element.progress).toBe(2);
    });
  });
});

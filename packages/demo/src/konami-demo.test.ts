import { describe, it, expect, beforeEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import './konami-demo';
import type { KonamiDemo } from './konami-demo';

describe('KonamiDemo', () => {
  let element: KonamiDemo;

  beforeEach(async () => {
    element = await fixture<KonamiDemo>(html`<konami-demo></konami-demo>`);
  });

  describe('rendering', () => {
    it('should render the component', () => {
      expect(element).to.exist;
      expect(element.tagName).toBe('KONAMI-DEMO');
    });

    it('should show default instructions', () => {
      const instructions = element.shadowRoot?.querySelector('.instructions');
      expect(instructions).to.exist;
      expect(instructions?.textContent).toContain('Konami Code');
    });

    it('should display progress bar', () => {
      const progressBar = element.shadowRoot?.querySelector('.progress-bar');
      expect(progressBar).to.exist;
    });

    it('should show next expected key', () => {
      const nextKey = element.shadowRoot?.querySelector('.next-key');
      expect(nextKey).to.exist;
    });

    it('should show sequence visualization', () => {
      const sequence = element.shadowRoot?.querySelector('.sequence');
      const keys = sequence?.querySelectorAll('.key');
      expect(keys?.length).toBe(10); // Konami code has 10 keys
    });
  });

  describe('activation state', () => {
    it('should not be activated by default', () => {
      expect(element.activated).toBe(false);
      expect(element.hasAttribute('activated')).toBe(false);
    });

    it('should show default content when not activated', () => {
      const defaultContent = element.shadowRoot?.querySelector('.default');
      const activatedContent = element.shadowRoot?.querySelector('.activated');

      expect(defaultContent).to.exist;
      expect(getComputedStyle(activatedContent as Element).display).toBe('none');
    });

    it('should update activated state when konami-activated event is fired', async () => {
      const event = new CustomEvent('konami-activated');
      element.dispatchEvent(event);
      await element.updateComplete;

      expect(element.activated).toBe(true);
      expect(element.hasAttribute('activated')).toBe(true);
    });

    it('should show activated content when activated', async () => {
      element.activated = true;
      await element.updateComplete;

      const activatedContent = element.shadowRoot?.querySelector('.activated');
      expect(activatedContent).to.exist;
      // Note: CSS hides/shows via :host([activated])
    });
  });

  describe('event handling', () => {
    it('should handle konami-progress event', async () => {
      const event = new CustomEvent('konami-progress', {
        detail: { position: 5, total: 10 }
      });
      element.dispatchEvent(event);
      await element.updateComplete;

      // Check that progress is reflected in the UI
      const progressFill = element.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(progressFill?.style.width).toBe('50%');
    });

    it('should handle konami-reset event', async () => {
      // First set some progress
      const progressEvent = new CustomEvent('konami-progress', {
        detail: { position: 5, total: 10 }
      });
      element.dispatchEvent(progressEvent);
      await element.updateComplete;

      // Then reset
      const resetEvent = new CustomEvent('konami-reset');
      element.dispatchEvent(resetEvent);
      await element.updateComplete;

      const progressFill = element.shadowRoot?.querySelector('.progress-fill') as HTMLElement;
      expect(progressFill?.style.width).toBe('0%');
    });
  });

  describe('reset functionality', () => {
    it('should have a reset button when activated', async () => {
      element.activated = true;
      await element.updateComplete;

      const resetButton = element.shadowRoot?.querySelector('button');
      expect(resetButton).to.exist;
      expect(resetButton?.textContent?.trim()).toBe('Try Again');
    });

    it('should reset state when reset button is clicked', async () => {
      element.activated = true;
      await element.updateComplete;

      const resetButton = element.shadowRoot?.querySelector('button') as HTMLButtonElement;
      resetButton.click();
      await element.updateComplete;

      expect(element.activated).toBe(false);
    });
  });

  describe('visual feedback', () => {
    it('should display feedback message when activated', async () => {
      const event = new CustomEvent('konami-activated');
      element.dispatchEvent(event);
      await element.updateComplete;

      // Wait a tick for the feedback to show
      await new Promise(resolve => setTimeout(resolve, 10));
      await element.updateComplete;

      const feedback = element.shadowRoot?.querySelector('.feedback');
      expect(feedback).to.exist;
    });

    it('should mark keys as correct when progress advances', async () => {
      const event = new CustomEvent('konami-progress', {
        detail: { position: 2, total: 10 }
      });
      element.dispatchEvent(event);
      await element.updateComplete;

      const correctKeys = element.shadowRoot?.querySelectorAll('.key.correct');
      expect(correctKeys?.length).toBe(2);
    });
  });
});

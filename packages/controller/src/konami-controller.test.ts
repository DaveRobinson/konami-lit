
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KonamiController, KonamiControllerEvents } from './konami-controller';
import type { ReactiveControllerHost } from 'lit';

// Mock host that implements the minimal interface
class MockHost implements ReactiveControllerHost, EventTarget {
  private controllers = new Set<any>();
  private listeners = new Map<string, Set<EventListener>>();
  updateComplete = Promise.resolve(true);

  addController(controller: any) {
    this.controllers.add(controller);
  }

  removeController(controller: any) {
    this.controllers.delete(controller);
  }

  requestUpdate() {
    // Mock - do nothing
  }

  // EventTarget implementation
  addEventListener(type: string, callback: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  removeEventListener(type: string, callback: EventListener) {
    this.listeners.get(type)?.delete(callback);
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
    return true;
  }

  // Helper for tests
  getEventListeners(type: string) {
    return this.listeners.get(type) || new Set();
  }
}

describe('KonamiController', () => {
  let host: MockHost;
  let controller: KonamiController;

  beforeEach(() => {
    host = new MockHost();
    controller = new KonamiController(host, { timeout: 1000 });
  });

  afterEach(() => {
    // Clean up if controller was connected
    if (controller) {
      controller.hostDisconnected();
    }
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should use default Konami code sequence', () => {
      expect(controller.total).toBe(10);
    });

    it('should accept custom code sequence', () => {
      const customHost = new MockHost();
      const customController = new KonamiController(customHost, {
        code: ['a', 'b', 'c']
      });
      expect(customController.total).toBe(3);
    });
  });

  describe('key input handling', () => {
    beforeEach(() => {
      // Connect controller BEFORE each test in this block
      controller.hostConnected();
    });

    afterEach(() => {
      // Disconnect AFTER each test in this block
      controller.hostDisconnected();
    });

    it('should advance on correct key', () => {
      const progressSpy = vi.fn();
      host.addEventListener('konami-progress', progressSpy);

      // First key in sequence (ArrowUp)
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false });
      window.dispatchEvent(event);

      expect(controller.progress).toBe(1);
      expect(progressSpy).toHaveBeenCalledTimes(1);
      expect(progressSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { position: 1, total: 10 }
        })
      );
    });

    it('should reset on incorrect key', () => {
      const resetSpy = vi.fn();
      host.addEventListener('konami-reset', resetSpy);

      // Correct key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(1);

      // Wrong key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: false }));
      expect(controller.progress).toBe(0);
      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it('should ignore key repeats', () => {
      const progressSpy = vi.fn();
      host.addEventListener('konami-progress', progressSpy);

      // First press
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(1);

      // Repeat (holding key)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: true }));
      expect(controller.progress).toBe(1); // Should not advance

      expect(progressSpy).toHaveBeenCalledTimes(1); // Only once
    });

    it('should complete full sequence', () => {
      const activatedSpy = vi.fn();
      host.addEventListener('konami-activated', activatedSpy);

      const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                       'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                       'b', 'a'];

      sequence.forEach(key => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, repeat: false }));
      });

      expect(activatedSpy).toHaveBeenCalledTimes(1);
      expect(controller.progress).toBe(0); // Reset after completion
    });

    it('should handle doubled inputs', () => {
      // First ArrowUp
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(1);

      // Second ArrowUp (user releases and presses again)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(2);
    });
  });

  describe('timeout behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      controller.hostConnected();
    });

    afterEach(() => {
      controller.hostDisconnected();
      vi.restoreAllMocks();
    });

    it('should reset after timeout', () => {
      const resetSpy = vi.fn();
      host.addEventListener('konami-reset', resetSpy);

      // Start sequence
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(1);

      // Advance time past timeout
      vi.advanceTimersByTime(1001);

      expect(controller.progress).toBe(0);
      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    it('should reset timeout on each correct key', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      
      // Almost timeout
      vi.advanceTimersByTime(900);
      expect(controller.progress).toBe(1);

      // Another correct key resets timer
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(2);

      // Another 900ms (would have timed out without reset)
      vi.advanceTimersByTime(900);
      expect(controller.progress).toBe(2); // Still active

      // Now timeout
      vi.advanceTimersByTime(101);
      expect(controller.progress).toBe(0);
    });
  });

  describe('lifecycle', () => {
    it('should attach keyboard listener on hostConnected', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      controller.hostConnected();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should remove keyboard listener on hostDisconnected', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      controller.hostConnected();
      controller.hostDisconnected();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    it('should clear timeout on hostDisconnected', () => {
      vi.useFakeTimers();
      controller.hostConnected();

      // Start sequence
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      
      // Disconnect before timeout
      controller.hostDisconnected();

      // Advance time - should not reset since disconnected
      const resetSpy = vi.fn();
      host.addEventListener('konami-reset', resetSpy);
      vi.advanceTimersByTime(2000);

      expect(resetSpy).not.toHaveBeenCalled();
      
      vi.restoreAllMocks();
    });
  });

  describe('public API', () => {
    beforeEach(() => {
      controller.hostConnected();
    });

    afterEach(() => {
      controller.hostDisconnected();
    });

    it('should expose progress', () => {
      expect(controller.progress).toBe(0);
      
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.progress).toBe(1);
    });

    it('should expose total sequence length', () => {
      expect(controller.total).toBe(10);
    });

    it('should expose next expected key', () => {
      expect(controller.nextExpectedKey).toBe('ArrowUp');
      
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.nextExpectedKey).toBe('ArrowUp'); // Second up
      
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', repeat: false }));
      expect(controller.nextExpectedKey).toBe('ArrowDown');
    });
  });
});
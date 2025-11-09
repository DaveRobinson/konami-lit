import {ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * Events
 */
export interface KonamiControllerEvents {
    'konami-activated': CustomEvent<void>;
    'konami-progress': CustomEvent<{position: number; total: number }>;
    'konami-reset': CustomEvent<void>;
}

export class KonamiController implements ReactiveController {
    private host: ReactiveControllerHost & EventTarget;
    // Konami Code is <up><up<down><down><left><right><left><right><b><a> but we can support other sequences.
    private code: string[];
    // How far along are we - as an array index.
    private currentPosition: number = 0;
    // Timeout in ms - after this we reset the buffer.
    private timeout: number;
    // Id generated for the timeout on this instance.
     private timeoutRef?: ReturnType<typeof setTimeout>; 

    constructor(host:ReactiveControllerHost & EventTarget, options:{
        code?: string[],
        timeout?: number
    }) {
        this.host = host;
        // Default to the OG code.
        this.code = options?.code || ['ArrowUp', 'ArrowUp',
                                        'ArrowDown', 'ArrowDown',
                                        'ArrowLeft', 'ArrowRight',
                                        'ArrowLeft', 'ArrowRight',
                                        'b', 'a'];
        // Default to 2s
        this.timeout = options?.timeout || 2000;
        // Attache to the host.
        host.addController(this);
    }

    /**
     * Event emitter.
     */
    private emit<K extends keyof KonamiControllerEvents>(
        eventName: K,
        detail?: KonamiControllerEvents[K]['detail']
    ) {
        this.host.dispatchEvent(
            new CustomEvent(eventName, {
                detail,
                bubbles: false,
                composed: false
            })
        );
    }

    /**
     * On connection attach the input listener.
     */
    hostConnected() {
        window.addEventListener('keydown', this.handleKeydown);
    }

    hostDisconnected() {
        window.removeEventListener('keydown', this.handleKeydown);
        clearTimeout(this.timeoutRef);
    }

    private handleKeydown = (e: KeyboardEvent) => {
        // Skip out on a repeat -e.g from a held key.
        if (e.repeat) {
            return;
        }
        const expected = this.code[this.currentPosition];

        if (e.key !== expected) {
            this.reset();
            return;
        }

        // Move the postion.
        this.currentPosition++;
        // Reset timer for the next input.
        clearTimeout(this.timeoutRef);
        this.timeoutRef = setTimeout(() => this.reset(), this.timeout);
        
        // Feedback to host.
        this.emit('konami-progress', {
            position: this.currentPosition,
            total: this.code.length
        });

        // Check if we're at the end.
        if (this.currentPosition === this.code.length) {
            this.emit('konami-activated');
            this.host.requestUpdate();
            this.reset();
        }
    };

    /**
     * Reset to the beginning.
     */
    private reset() {
        const isPartial = this.currentPosition > 0;
        // Move state back.
        this.currentPosition = 0;
        clearTimeout(this.timeoutRef);
        // Let the host know that we reset.
        if (isPartial) {
            this.emit('konami-reset');
        }
    }

    /**
     * Public util functions.
     */

    get progress() {
        return this.currentPosition;
    }

    get total() {
        return this.code.length;
    }

    get nextExpectedKey() {
        return this.code[this.currentPosition];
    }



}
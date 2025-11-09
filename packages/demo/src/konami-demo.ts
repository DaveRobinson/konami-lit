// src/konami-demo.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { KonamiController } from '@konami-lit/controller';

@customElement('konami-demo')
export class KonamiDemo extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .container {
      border: 2px solid #ccc;
      border-radius: 8px;
      padding: 2rem;
      background: #f5f5f5;
      transition: all 0.3s ease;
    }

    .container.success {
      border-color: #28a745;
      background: #d4edda;
    }

    .container.error {
      border-color: #dc3545;
      background: #f8d7da;
      animation: shake 0.5s;
    }

    .container.timeout {
      border-color: #ffc107;
      background: #fff3cd;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }

    h1 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .instructions {
      margin: 1rem 0;
      padding: 1rem;
      background: white;
      border-radius: 4px;
      border-left: 4px solid #0066cc;
    }

    .status {
      margin: 1rem 0;
      font-size: 1.2rem;
    }

    .feedback {
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .feedback.show {
      opacity: 1;
    }

    .feedback.success {
      background: #d4edda;
      color: #155724;
      border: 2px solid #28a745;
    }

    .feedback.error {
      background: #f8d7da;
      color: #721c24;
      border: 2px solid #dc3545;
    }

    .feedback.timeout {
      background: #fff3cd;
      color: #856404;
      border: 2px solid #ffc107;
    }

    .progress {
      margin: 1rem 0;
    }

    .progress-bar {
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0066cc, #00aaff);
      transition: width 0.2s ease;
    }

    .progress-fill.success {
      background: linear-gradient(90deg, #28a745, #20c997);
    }

    .progress-fill.error {
      background: linear-gradient(90deg, #dc3545, #ff6b6b);
    }

    .next-key {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border-radius: 4px;
      font-weight: bold;
      font-family: monospace;
      font-size: 1.1rem;
    }

    .sequence {
      margin: 1rem 0;
      font-family: monospace;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .key {
      padding: 0.5rem;
      background: white;
      border: 2px solid #ccc;
      border-radius: 4px;
      min-width: 60px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .key.correct {
      background: #d4edda;
      border-color: #28a745;
      transform: scale(1.1);
    }

    .key.error {
      background: #f8d7da;
      border-color: #dc3545;
      animation: wiggle 0.3s;
    }

    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-5deg); }
      75% { transform: rotate(5deg); }
    }

    .activated {
      display: none;
      text-align: center;
      font-size: 3rem;
      animation: celebration 0.5s ease;
    }

    :host([activated]) .activated {
      display: block;
    }

    :host([activated]) .default {
      display: none;
    }

    @keyframes celebration {
      0% { transform: scale(0) rotate(-180deg); opacity: 0; }
      50% { transform: scale(1.2) rotate(10deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: #0066cc;
      color: white;
      transition: all 0.2s;
    }

    button:hover {
      background: #0052a3;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    button:active {
      transform: translateY(0);
    }

    .emoji {
      font-size: 4rem;
      margin: 1rem 0;
    }
  `;

  @property({ type: Boolean, reflect: true })
  activated = false;

  @state()
  private progress = 0;

  @state()
  private feedbackMessage = '';

  @state()
  private feedbackType: 'success' | 'error' | 'timeout' | '' = '';

  @state()
  private showFeedback = false;

  @state()
  private containerState: 'normal' | 'success' | 'error' | 'timeout' = 'normal';

  private konami = new KonamiController(this, {
    timeout: 2000
  });

  private feedbackTimeout?: number;

  connectedCallback() {
    super.connectedCallback();
    
    this.addEventListener('konami-activated', this.handleActivated);
    this.addEventListener('konami-progress', this.handleProgress);
    this.addEventListener('konami-reset', this.handleReset);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('konami-activated', this.handleActivated);
    this.removeEventListener('konami-progress', this.handleProgress);
    this.removeEventListener('konami-reset', this.handleReset);
    clearTimeout(this.feedbackTimeout);
  }

  private showTemporaryFeedback(message: string, type: 'success' | 'error' | 'timeout') {
    this.feedbackMessage = message;
    this.feedbackType = type;
    this.showFeedback = true;
    this.containerState = type;

    clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = window.setTimeout(() => {
      this.showFeedback = false;
      if (type !== 'success') {
        this.containerState = 'normal';
      }
    }, 2000);
  }

  private handleActivated = () => {
    this.activated = true;
    this.showTemporaryFeedback('🎉 SUCCESS! You unlocked the secret!', 'success');
    console.log('🎮 Konami Code Activated!');
  };

  private handleProgress = (e: Event) => {
    const { position } = (e as CustomEvent).detail;
    this.progress = position;
    console.log(`Progress: ${position}/${this.konami.total}`);
    
    // Clear any error state when making progress
    if (this.containerState === 'error' || this.containerState === 'timeout') {
      this.containerState = 'normal';
      this.showFeedback = false;
    }
  };

  private handleReset = () => {
    const wasInProgress = this.progress > 0;
    this.progress = 0;
    
    if (wasInProgress) {
      // Determine if it was a timeout or wrong key
      // Since reset is called from both, we'll show timeout message
      // (In a real implementation, you might want to distinguish these in the controller)
      this.showTemporaryFeedback('Sorry! Sequence timed out or you pressed the wrong key.', 'timeout');
      console.log('Sequence timed out or wrong input');
    }
  };

  private reset() {
    this.activated = false;
    this.progress = 0;
    this.showFeedback = false;
    this.containerState = 'normal';
    this.feedbackMessage = '';
  }

  render() {
    const sequence = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A'];
    const progressPercent = (this.progress / this.konami.total) * 100;
    const progressClass = this.containerState === 'success' ? 'success' : 
                         this.containerState === 'error' ? 'error' : '';

    return html`
      <div class="container ${this.containerState}">
        <div class="default">
          <h1>Konami Code Demo</h1>
          
          <div class="instructions">
            <p><strong>Try the Konami Code:</strong></p>
            <p>Press: <code>↑ ↑ ↓ ↓ ← → ← → B A</code></p>
            <p><small>Use arrow keys on your keyboard, then b and a keys</small></p>
            <p><small>You have 2 seconds between each key press</small></p>
          </div>

          ${this.showFeedback ? html`
            <div class="feedback ${this.feedbackType} ${this.showFeedback ? 'show' : ''}">
              ${this.feedbackMessage}
            </div>
          ` : ''}

          <div class="status">
            Next key: <span class="next-key">${this.konami.nextExpectedKey}</span>
          </div>

          <div class="progress">
            <div class="progress-bar">
              <div class="progress-fill ${progressClass}" style="width: ${progressPercent}%"></div>
            </div>
            <p>${this.progress} / ${this.konami.total} keys</p>
          </div>

          <div class="sequence">
            ${sequence.map((key, index) => html`
              <div class="key ${index < this.progress ? 'correct' : ''}">
                ${key}
              </div>
            `)}
          </div>
        </div>

        <div class="activated">
          <div class="emoji">🎮 🎉 ✨</div>
          <div style="font-size: 2rem; margin: 1rem 0;">SUCCESS!</div>
          <div style="font-size: 1.2rem; color: #155724;">You unlocked the secret!</div>
          <button @click=${this.reset}>
            Try Again
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'konami-demo': KonamiDemo;
  }
}
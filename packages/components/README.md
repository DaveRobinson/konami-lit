# @konami-lit/components

Reusable Lit web components using the Konami code controller.

## Components

### `<konami-reveal>`

A web component that reveals content when the Konami code (or custom sequence) is successfully entered.

## Usage

### Standard Web Application

```html
<script type="module">
  import '@konami-lit/components';
</script>

<konami-reveal>
  <div slot="initial">Try the Konami code...</div>
  <div slot="revealed">🎉 You found the secret!</div>
</konami-reveal>
```

### CMS Integration

For CMS usage (Drupal SDC, WordPress Gutenberg, etc.), use the pre-built bundles with light DOM mode:

#### IIFE Bundle (recommended for CMS)

```html
<script src="bundles/konami-reveal.light.iife.js"></script>

<konami-reveal light-dom>
  <div slot="initial">Press the Konami code...</div>
  <div slot="revealed">Secret revealed!</div>
</konami-reveal>
```

#### ESM Bundle

```html
<script type="module" src="bundles/konami-reveal.light.esm.js"></script>

<konami-reveal light-dom>
  <div slot="initial">Press the Konami code...</div>
  <div slot="revealed">Secret revealed!</div>
</konami-reveal>
```

### Custom Key Sequence

```html
<konami-reveal code='["a","b","c"]'>
  <div slot="revealed">You pressed A, B, C!</div>
</konami-reveal>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `light-dom` | boolean | `false` | Use light DOM instead of shadow DOM (required for most CMS) |
| `activated` | boolean | `false` | Whether the code has been activated |
| `code` | string[] | Konami code | Custom key sequence (as JSON array string) |
| `timeout` | number | `2000` | Timeout between keypresses (ms) |

## Slots

| Slot | Description |
|------|-------------|
| `initial` | Content shown before activation (optional) |
| `revealed` | Content shown after successful code entry |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `konami-activated` | `void` | Fired when sequence completes |
| `konami-progress` | `{position: number, total: number}` | Fired on each correct key |
| `konami-reset` | `void` | Fired when sequence resets |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `reset()` | `void` | Manually reset the activated state |

## Public Properties

| Property | Type | Description |
|----------|------|-------------|
| `progress` | number | Current position in sequence |
| `total` | number | Total length of sequence |
| `nextExpectedKey` | string | Next key in the sequence |

## Building

```bash
# Build TypeScript
npm run build

# Build CMS bundles
npm run bundle

# Build everything (TypeScript + bundles)
npm run build
```

This creates:
- `dist/` - TypeScript compiled output for module usage
- `bundles/` - Standalone bundles for CMS integration
  - `konami-reveal.esm.js` - ES module (shadow DOM)
  - `konami-reveal.iife.js` - IIFE bundle (shadow DOM)
  - `konami-reveal.light.esm.js` - ES module (light DOM optimized)
  - `konami-reveal.light.iife.js` - IIFE bundle (light DOM optimized, recommended for CMS)

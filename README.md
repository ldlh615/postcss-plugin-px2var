# postcss-plugin-px2var

A PostCSS plugin that replaces `px` values with a CSS Variable-powered scale using `calc`. It turns `10px` into `calc(10*var(--your-unit))` so you can control a global sizing scale via a single CSS variable.

## Features

- Converts `px` values to `calc(<px>*var(--your-unit))`
- Skips values already using the configured CSS variable
- Supports selector and property blacklists
- Optional inline or comment-based ignore tokens per declaration
- Ignores `px` inside quoted strings and `url(...)`

## Installation

```bash
npm i postcss-plugin-px2var
```

## Usage (PostCSS API)

```js
const fs = require('fs');
const postcss = require('postcss');
const px2var = require('postcss-plugin-px2var');

const css = fs.readFileSync('src/styles/app.css', 'utf8');

const options = {
  include: /my-project\/(src|styles)/i, // required: only files matching this regex are processed
  cssVariable: '--ke-unit', // required: the CSS variable to multiply by
  replace: true, // replace in-place; if false, add a cloned declaration after
  selectorBlackList: [/^\.no-scale/], // optional: selectors to skip
  propBlackList: ['border-width'], // optional: properties to skip
  ignoreIdentifier: 'no-px', // optional: token to skip individual declarations
};

postcss([px2var(options)])
  .process(css, { from: 'src/styles/app.css', to: 'dist/app.css' })
  .then((result) => {
    fs.writeFileSync('dist/app.css', result.css);
  });
```

## Input / Output

```css
/* input */
h1 {
  margin: 0 0 20px;
  font-size: 32px; /* no-px */
  line-height: 1.2;
  border-width: 1px;
}

/* output (with cssVariable: --ke-unit, propBlackList: ['border-width']) */
h1 {
  margin: 0 0 calc(20 * var(--ke-unit));
  font-size: 32px; /* no-px */
  line-height: 1.2;
  border-width: 1px;
}
```

Notes:

- Declarations with `ignoreIdentifier` token are skipped. You can also place it as a trailing comment: `font-size: 16px; /* no-px */`.
- Declarations or property names that already include `cssVariable` are skipped.
- `px` inside quotes or `url(...)` is ignored.

## Options

```js
{
  include: undefined,        // RegExp (required): processed only if file path matches
  cssVariable: '',           // String (required): e.g. '--ke-unit'
  selectorBlackList: [],     // Array<String|RegExp>: selectors to skip
  propBlackList: [],         // Array<String|RegExp>: properties to skip
  ignoreIdentifier: false,   // String|false: token to mark declaration to skip
  replace: true              // Boolean: true to replace, false to insert cloned declaration after
}
```

- `include` RegExp matched against the absolute file path. If not set or doesn't match, no changes are made.
- `cssVariable` The CSS variable name used in `calc`, e.g. `--ke-unit`.
- `selectorBlackList` Skip rules whose selector matches any string (substring) or RegExp.
- `propBlackList` Skip declarations whose property matches any string (substring) or RegExp.
- `ignoreIdentifier` When set to a string token (e.g. `'no-px'`), skip declarations that contain this token in the value or have it as the next sibling comment.
- `replace` If `true`, declaration value is replaced. If `false`, a cloned declaration with the converted value is inserted right after the original (you keep `px` as fallback).

## PostCSS Config / Bundlers

Create `postcss.config.js`:

```js
module.exports = {
  plugins: [
    require('postcss-plugin-px2var')({
      include: /my-project\/(src|styles)/i,
      cssVariable: '--ke-unit',
      selectorBlackList: [/^\.no-scale/],
      propBlackList: ['border-width'],
      ignoreIdentifier: 'no-px',
      replace: true,
    }),
  ],
};
```

Example CSS variable definition (global scale):

```css
:root {
  --ke-unit: 0.01rem;
} /* every px becomes px * 0.01rem */
```

## How It Works

- The plugin scans declaration values for `px` and replaces them with `calc(<number>*var(--your-unit))`.
- It performs several guards: file path must match `include`, `cssVariable` must be provided, selector/property blacklists, and ignore token.
- Text inside quotes and `url(...)` is intentionally preserved.

## License

MIT

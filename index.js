const postcss = require('postcss');

const defaultOpts = {
  include: undefined, // regexp: /keenoho-ui/gi
  cssVariable: '', // css var: --ke-unit
  cssVariableFallback: undefined, // css var fallback function: (origin, num, unit) => { return origin }
  cssVariableFallbackOrigin: false, // fallback to origin if cssVariableFallback is not set
  selectorBlackList: [],
  propBlackList: [],
  ignoreIdentifier: false,
  replace: true,
};

function blacklistedSelector(blacklist, selector) {
  if (typeof selector !== 'string') return false;

  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return selector.indexOf(regex) !== -1;

    return selector.match(regex);
  });
}

function blacklistedProp(blacklist, prop) {
  if (typeof prop !== 'string') return false;

  return blacklist.some(function (regex) {
    if (typeof regex === 'string') return prop.indexOf(regex) !== -1;

    return prop.match(regex);
  });
}

module.exports = postcss.plugin('postcss-plugin-px2var', function (options) {
  const opts = { ...defaultOpts, ...options };

  var regText = `"[^"]+"|\'[^\']+\'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)(px)`;
  var pxRegex = new RegExp(regText, 'ig');

  return (css) => {
    css.walkDecls((decl, i) => {
      // 1st check include and cssVariable
      if (
        !opts.include ||
        !opts.cssVariable ||
        !css.source.input.file ||
        css.source.input.file.match(opts.include) === null
      ) {
        return;
      }

      // 2st check 'px'
      if (decl.value.indexOf('px') === -1) {
        return;
      }

      // 3. check value or prop has cssVariable
      if (decl.value.indexOf(opts.cssVariable) !== -1 || decl.prop.indexOf(opts.cssVariable) !== -1) {
        return;
      }

      // 4. check blacklistedSelector
      if (blacklistedSelector(opts.selectorBlackList, decl.parent.selector)) {
        return;
      }

      // 5. check propBlackList
      if (blacklistedProp(opts.propBlackList, decl.prop)) {
        return;
      }

      // 6. check ignoreIdentifier
      if (opts.ignoreIdentifier) {
        if (decl.value.indexOf(opts.ignoreIdentifier) !== -1) {
          return;
        }
        const next = decl.next();
        if (next && next.type === 'comment' && next.text === opts.ignoreIdentifier) {
          return;
        }
      }

      // start process value
      const value = decl.value.replace(pxRegex, (_, num, px) => {
        if (typeof opts.cssVariableFallback === 'function') {
          return `calc(${num}*var(${opts.cssVariable},${opts.cssVariableFallback(_, num, px)}))`;
        } else if (opts.cssVariableFallbackOrigin) {
          return `calc(${num}*var(${opts.cssVariable},${_}))`;
        } else {
          return `calc(${num}*var(${opts.cssVariable}))`;
        }
      });

      // replace or insert value
      if (opts.replace) {
        decl.value = value;
      } else {
        decl.parent.insertAfter(
          i,
          decl.clone({
            value: value,
          })
        );
      }
    });
  };
});

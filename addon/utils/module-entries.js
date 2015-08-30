/*globals requirejs */

if (typeof requirejs.entries === 'undefined') {
  requirejs.entries = requirejs._eak_seen;
}

export default requirejs.entries;

import { expect } from 'chai';
import { buildOutputText } from '../lib/helpers';

describe('Build output Text', function () {
  it('should show the correct table output for a file diff', function () {
    const diff = {
      'auto-import-fastboot.js': { raw: 221142, gzip: 76707 },
      'ember-website.js': { raw: -2995, gzip: -1013 },
      'ember-website-fastboot.js': { raw: 0, gzip: 0 },
      'vendor.js': { raw: -388401, gzip: -129560 },
      'ember-website.css': { raw: 0, gzip: 0 },
      'vendor.css': { raw: 0, gzip: 0 },
    };

    const text = buildOutputText(diff);

    expect(text).to.equal(`### Asset Size Comparison

Asset | Raw | Gzip | Status
--- | --- | --- | ---
auto-import-fastboot.js|+221 kB|+76.7 kB|⛔️ Size Increased
ember-website.js|-3 kB|-1.01 kB|✂️ Size Decreased
ember-website-fastboot.js| 0 B| 0 B|✅ No Change
vendor.js|-388 kB|-130 kB|✂️ Size Decreased
ember-website.css| 0 B| 0 B|✅ No Change
vendor.css| 0 B| 0 B|✅ No Change`);
  });
});

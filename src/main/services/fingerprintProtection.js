const FINGERPRINT_SCRIPT = `
(function() {
  if (window.__novaFp) return;
  window.__novaFp = true;
  const noise = () => Math.floor(Math.random() * 10) - 5;
  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      const ctx = this.getContext('2d');
      if (ctx) {
        const img = ctx.getImageData(0, 0, Math.min(this.width, 16), Math.min(this.height, 16));
        for (let i = 0; i < img.data.length; i += 4) img.data[i] ^= noise();
        ctx.putImageData(img, 0, 0);
      }
      return origToDataURL.apply(this, args);
    };
  } catch {}
  try {
    const origGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Nova GPU';
      if (param === 37446) return 'Nova Renderer';
      return origGetParameter.call(this, param);
    };
  } catch {}
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  } catch {}
})();
`;

function getFingerprintScript() {
  return FINGERPRINT_SCRIPT;
}

function setupFingerprintHeaders(sess, enabled) {
  if (!enabled) return;
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['DNT'] = '1';
    details.requestHeaders['Sec-GPC'] = '1';
    callback({ requestHeaders: details.requestHeaders });
  });
}

module.exports = { getFingerprintScript, setupFingerprintHeaders, FINGERPRINT_SCRIPT };

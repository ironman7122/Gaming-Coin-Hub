/**
 * Payment API Bridge - Integration point for future payment gateway
 *
 * When integrating a real payment API:
 * 1. Implement PAYMENT_API_HOOK to sync with your backend (credit/debit)
 * 2. Call PaymentAPI.creditAgent() from your server after verifying Chime/Crypto payment
 * 3. Never trust client-only amounts - validate on server before crediting
 * 4. Use HTTPS, validate webhooks, verify amounts server-side
 *
 * Safe integration checklist:
 * - Validate payment on YOUR backend before crediting
 * - Use idempotency keys for credit/debit to prevent double-processing
 * - Log all payment events server-side
 * - Store API keys in env vars, never in client code
 */
(function() {
  var PAYMENT_METHODS = { CHIME: 'chime', CRYPTO: 'crypto' };

  function creditAgent(agentId, method, amount, ref) {
    if (typeof AgentData === 'undefined') return false;
    AgentData.addBalance(amount, method === 'crypto' ? PAYMENT_METHODS.CRYPTO : PAYMENT_METHODS.CHIME, ref || '');
    return true;
  }

  if (typeof window.PAYMENT_API_HOOK !== 'function') {
    window.PAYMENT_API_HOOK = function(action, data) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[PaymentAPI]', action, data);
      }
    };
  }

  /**
   * Purchase API - Called when agent clicks Purchase
   * Override processPurchase to integrate your backend:
   * 1. API searches for username in game system
   * 2. API loads coins to that username
   * 3. Return Promise.resolve(true) on success, Promise.resolve(false) on failure
   * Example: return fetch('/api/purchase', { method: 'POST', body: JSON.stringify(payload) })
   *   .then(r => r.json()).then(d => d.success);
   */
  function processPurchase(payload) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[PurchaseAPI] processPurchase', payload);
    }
    return Promise.resolve(true);
  }

  window.PaymentAPI = {
    PAYMENT_METHODS: PAYMENT_METHODS,
    creditAgent: creditAgent
  };

  window.PurchaseAPI = {
    processPurchase: processPurchase
  };
})();

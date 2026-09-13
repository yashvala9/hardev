/* Shared, independently testable cart calculations. Amounts are in rupees. */
(function (root) {
  'use strict';
  const clean = value => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  function restore(raw, catalog) {
    if (!Array.isArray(raw)) return [];
    const result = [];
    for (const row of raw) {
      if (!row || typeof row.id !== 'string' || !Number.isInteger(row.quantity) || row.quantity < 1) continue;
      const product = catalog.find(p => p.id === row.id);
      if (!product || !Number.isInteger(row.variant) || !product.variants[row.variant]) continue;
      const existing = result.find(r => r.id === row.id && r.variant === row.variant);
      if (existing) existing.quantity = Math.min(99, existing.quantity + row.quantity);
      else result.push({id: row.id, variant: row.variant, quantity: Math.min(99, row.quantity)});
    }
    return result;
  }
  function lines(cart, catalog) {
    return restore(cart, catalog).map(row => {
      const product = catalog.find(p => p.id === row.id);
      const variant = product.variants[row.variant];
      return {...row, name: product.name, label: variant.label, price: variant.price, image: product.image, total: variant.price * row.quantity};
    });
  }
  function message(cart, catalog, customer) {
    const items = lines(cart, catalog);
    if (!items.length) throw new Error('Your cart is empty.');
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const address = clean(customer.address);
    const locality = [clean(customer.city), clean(customer.state)].filter(Boolean).join(', ');
    const pin = clean(customer.pincode);
    return [
      'Hello Hardev! 👋',
      "I'd like to place an order:", '',
      '*ORDER SUMMARY*',
      ...items.map((item, i) => `${i + 1}. ${item.name} — ${item.label}\n   Qty: ${item.quantity} × ₹${item.price} = ₹${item.total}`), '',
      `*PRODUCT SUBTOTAL: ₹${subtotal}*`,
      'Delivery charges: Please confirm',
      'Final total: Please confirm', '',
      '*DELIVERY DETAILS*',
      `Name: ${clean(customer.name)}`,
      `Phone: ${clean(customer.phone)}`,
      `Address: ${address}`,
      ...(locality || pin ? [`${locality}${locality && pin ? ' — ' : ''}${pin}`] : []),
      ...(clean(customer.notes) ? [`Notes: ${clean(customer.notes)}`] : []), '',
      '*PAYMENT*',
      'Please confirm product availability and the final total, then share a payment link or UPI QR code.',
      'Payment is pending; this is an order request only.'
    ].join('\n');
  }
  const api = {restore, lines, message};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HardevCart = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

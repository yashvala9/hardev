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
    return [
      'Hello Hardev! I would like to request this order:', '',
      ...items.map((item, i) => `${i + 1}. ${item.name} — ${item.label}\n   ${item.quantity} × ₹${item.price} = ₹${item.total}`), '',
      `Product subtotal: ₹${items.reduce((sum, item) => sum + item.total, 0)}`,
      'Delivery charges and final total: please confirm.', '',
      `Name: ${clean(customer.name)}`, `Phone: ${clean(customer.phone)}`,
      `Delivery address: ${clean(customer.address)}`,
      `${clean(customer.city)}, ${clean(customer.state)} — ${clean(customer.pincode)}`,
      ...(clean(customer.notes) ? [`Notes: ${clean(customer.notes)}`] : []), '',
      'Please confirm availability and the final total, then share a payment link or UPI QR code. This is an order request; payment has not been made.'
    ].join('\n');
  }
  const api = {restore, lines, message};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HardevCart = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

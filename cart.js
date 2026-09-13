(function () {
  'use strict';
  const core = window.HardevCart;
  const catalog = [];
  const key = 'hardev-cart-v1';
  const money = n => `₹${n.toLocaleString('en-IN')}`;
  const make = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
  const button = (text, cls, action) => { const el = make('button', cls, text); el.type = 'button'; el.addEventListener('click', action); return el; };
  document.querySelectorAll('article').forEach(article => {
    const order = article.querySelector('a[href*="wa.me"]');
    const heading = article.querySelector('h3');
    if (!order || !heading) return;
    const id = order.dataset.testid.replace('order-btn-', '');
    let chips = [...article.querySelectorAll('[data-testid^="price-chip-"]')];
    if (!chips.length) chips = [...article.querySelectorAll('span')].filter(el => !el.querySelector('span') && el.textContent.includes('₹'));
    const variants = chips.map(chip => {
      const text = chip.textContent.replace(/\s+/g, ' ').trim();
      const split = text.lastIndexOf('₹');
      return {label: text.slice(0, split).replace(/[\s·]+$/, ''), price: Number(text.slice(split + 1).replace(/,/g, '').trim())};
    }).filter(v => v.label && Number.isFinite(v.price) && v.price > 0);
    if (!variants.length) return;
    const product = {id, category: id.includes('soap') ? 'Herbal Soaps' : (id.includes('shampoo') || id.includes('oil')) ? 'Haircare' : 'Face Care', article, name: heading.textContent.trim(), image: article.querySelector('img')?.getAttribute('src'), variants};
    catalog.push(product);
    const controls = make('div', 'hc-options');
    const label = make('label', '', 'Choose size');
    const select = make('select'); select.id = `hc-size-${id}`; select.setAttribute('aria-label', `Size for ${product.name}`);
    variants.forEach((v,i) => { const option = make('option', '', `${v.label} · ${money(v.price)}`); option.value = i; select.append(option); });
    label.append(select); controls.append(label);
    const quantityLabel = make('label', '', 'Quantity'); const quantity = make('select'); quantity.setAttribute('aria-label', `Quantity for ${product.name}`); for (let i=1;i<=10;i++) {const option=make('option','',String(i));option.value=i;quantity.append(option);} quantityLabel.append(quantity);controls.append(quantityLabel);
    const add = button('Add to cart', 'hc-add', () => {
      const variant = Number(select.value);
      const row = cart.find(r => r.id === id && r.variant === variant);
      if ((row?.quantity || 0) + Number(quantity.value) > 99) { announce('Maximum 99 of each size per request.'); return; }
      if (row) row.quantity += Number(quantity.value); else cart.push({id, variant, quantity:Number(quantity.value)});
      save(); announce(`${product.name} added to cart.`);
    });
    const buy = button('Buy now', 'hc-buy', () => { const row=cart.find(r=>r.id===id && r.variant===Number(select.value)); if((row?.quantity || 0)+Number(quantity.value)>99){announce('Maximum 99 of each size per request.');return;} add.click(); openCart(); startCheckout(); });
    const actions = make('div','hc-product-actions'); actions.append(add,buy); order.before(controls, actions); order.remove();
  });
  const grid = catalog[0]?.article.parentElement;
  if (grid) {
    const toolbar = make('div','hc-shop-tools');
    const searchLabel=make('label','','Search products'); const search=make('input');search.type='search';search.placeholder='Search shampoo, soap, face wash…';searchLabel.append(search);
    const categoryLabel=make('label','','Category');const category=make('select');['All products','Haircare','Face Care','Herbal Soaps'].forEach(value=>{const option=make('option','',value);option.value=value;category.append(option);});categoryLabel.append(category);
    const count=make('p','hc-muted');count.setAttribute('role','status');
    const filter=()=>{let found=0;for(const p of catalog){const visible=(!search.value.trim() || p.name.toLowerCase().includes(search.value.trim().toLowerCase())) && (category.value==='All products' || p.category===category.value);p.article.hidden=!visible;if(visible)found++;}count.textContent=found ? `${found} products` : 'No products found. Try another search or category.';};
    search.addEventListener('input',filter);category.addEventListener('change',filter);toolbar.append(searchLabel,categoryLabel,count);grid.before(toolbar);filter();
  }
  let cart = [];
  try { cart = core.restore(JSON.parse(localStorage.getItem(key) || '[]'), catalog); } catch (_) { /* Storage is optional. */ }
  const toast = make('div', 'hc-toast'); toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); document.body.append(toast);
  let timer;
  function announce(text) { toast.textContent = text; clearTimeout(timer); timer = setTimeout(() => {toast.textContent = '';}, 3500); }
  const trigger = button('Cart (0)', 'hc-trigger', openCart); trigger.setAttribute('aria-haspopup', 'dialog'); document.body.append(trigger);
  const navCart=button('Cart (0)','hc-nav-cart',openCart);navCart.setAttribute('aria-haspopup','dialog'); document.querySelector('nav')?.append(navCart);
  const dialog = make('dialog', 'hc-dialog'); dialog.setAttribute('aria-labelledby', 'hc-title');
  dialog.innerHTML = `<header><h2 id="hc-title">Your cart</h2><button type="button" class="hc-close" aria-label="Close cart">×</button></header><div class="hc-content"><ol class="hc-progress" aria-label="Checkout progress"><li data-step="cart" aria-current="step">1 <span>Cart</span></li><li data-step="delivery">2 <span>Delivery</span></li><li data-step="review">3 <span>Review & send</span></li></ol><div id="hc-cart-view"></div><div id="hc-checkout-view" hidden><p class="hc-muted">Review your items and add your delivery details. Hardev will confirm availability, delivery charges and payment instructions on WhatsApp.</p><form class="hc-form" id="hc-form"><label>Full name<input name="name" autocomplete="name" required maxlength="80"></label><label>Mobile number<input name="phone" type="tel" autocomplete="tel" required pattern="(?:\\+91 ?)?[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number, optionally starting with +91." maxlength="15" placeholder="9876543210"></label><label class="hc-wide">Delivery address<textarea name="address" autocomplete="street-address" required maxlength="300" rows="2" placeholder="House / flat, street, area and landmark"></textarea></label><label>City / town<input name="city" autocomplete="address-level2" required maxlength="80"></label><label>State<input name="state" autocomplete="address-level1" required maxlength="80"></label><label>PIN code<input name="pincode" autocomplete="postal-code" inputmode="numeric" required pattern="[1-9][0-9]{5}" maxlength="6" title="Enter a valid six-digit Indian PIN code."></label><label class="hc-wide">Order notes (optional)<textarea name="notes" maxlength="300" rows="2"></textarea></label><div class="hc-wide hc-notice">Your details will be included in a WhatsApp message to Hardev. Tap Send in WhatsApp to submit your request. No payment is collected on this website; your order is confirmed by Hardev after checking availability and payment.</div><div class="hc-wide hc-actions"><button type="button" id="hc-back" class="hc-secondary">Back to cart</button><button type="submit" class="hc-primary">Review order</button></div></form></div><div id="hc-final-view" hidden><div class="hc-checkout-layout"><div><h3 class="hc-section-title">Review your order</h3><p class="hc-muted">Check your items and delivery address before continuing.</p><div id="hc-review"></div><div class="hc-address-card"><h3 class="hc-section-title">Deliver to</h3><p id="hc-address"></p><button type="button" id="hc-edit-address" class="hc-remove">Change address</button></div><div class="hc-notice"><strong>Payment arranged on WhatsApp</strong><p>Hardev will confirm stock and the final amount, then share a payment link or UPI QR code. Your request is not a confirmed or paid order.</p></div></div><aside class="hc-summary"><h3 class="hc-section-title">Order summary</h3><div id="hc-final-totals"></div><p class="hc-muted">By continuing, you choose to share your delivery details with Hardev on WhatsApp.</p><button type="button" id="hc-send" class="hc-primary">Send order on WhatsApp</button><button type="button" id="hc-edit-cart" class="hc-secondary">Edit cart</button><p class="hc-muted">You will need to tap Send in WhatsApp.</p></aside></div><div id="hc-handoff" hidden class="hc-notice"><p>WhatsApp was opened with your order request. You still need to tap Send there. Your cart has been kept here.</p><label for="hc-message">If WhatsApp did not open, copy this message and send it to +91 88669 93501.</label><textarea id="hc-message" class="hc-preview" readonly></textarea><button type="button" id="hc-copy" class="hc-secondary">Copy order message</button><p id="hc-copy-status" role="status"></p></div></div></div>`;
  document.body.append(dialog);
  const cartView = dialog.querySelector('#hc-cart-view'), checkout = dialog.querySelector('#hc-checkout-view');
  const form = dialog.querySelector('form');
  let opener;
  let customer;
  const finalView = dialog.querySelector('#hc-final-view');
  function step(name) {dialog.querySelectorAll('[data-step]').forEach(el => {if(el.dataset.step===name) el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');}); dialog.scrollTop=0;}
  function startCheckout() {if(!cart.length)return;cartView.hidden=true; finalView.hidden=true; checkout.hidden=false; step('delivery'); dialog.querySelector('h2').textContent='Delivery details'; form.elements.name.focus();}
  dialog.querySelector('#hc-edit-address').onclick=startCheckout;
  dialog.querySelector('#hc-edit-cart').onclick=()=>{renderCart();dialog.querySelector('.hc-close').focus();};
  dialog.querySelector('.hc-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {document.body.classList.remove('hc-open'); opener?.focus();});
  function updateCount() { trigger.textContent = `Cart (${cart.reduce((n,r) => n+r.quantity,0)})`; navCart.textContent=trigger.textContent; }
  function save() { try {localStorage.setItem(key, JSON.stringify(cart));} catch (_) {} updateCount(); dialog.querySelector('#hc-handoff').hidden = true; }
  function openCart() { opener = document.activeElement; renderCart(); if (!dialog.open) dialog.showModal(); document.body.classList.add('hc-open'); }
  function totals(target) {
    const subtotal = core.lines(cart, catalog).reduce((n,r) => n+r.total,0);
    const total = make('div', 'hc-total'); total.append(make('span','','Product subtotal'),make('span','',money(subtotal))); target.append(total, make('p','hc-muted','Delivery charges and final total will be confirmed on WhatsApp.'));
  }
  function renderCart(focusId) {
    cartView.hidden = false; checkout.hidden = true; finalView.hidden = true; step('cart'); dialog.querySelector('h2').textContent = 'Your cart'; cartView.replaceChildren();
    if (!cart.length) {
      const empty = make('div','hc-empty'); empty.append(make('h3','','Your cart is waiting'),make('p','hc-muted','Choose a size and add your favourite homemade products.'),button('Continue browsing','hc-primary',()=>dialog.close())); cartView.append(empty); return;
    }
    core.lines(cart,catalog).forEach(row => {
      const line = make('div','hc-line');
      const img = make('img'); img.src = row.image; img.alt = ''; line.append(img);
      const info = make('div'); info.append(make('h3','',row.name),make('p','hc-muted',`${row.label} · ${money(row.price)} each`));
      const quantities = make('div','hc-quantity');
      const change = delta => { const item = cart.find(r=>r.id===row.id && r.variant===row.variant); item.quantity += delta; if (!item.quantity) cart=cart.filter(r=>r!==item); save(); renderCart(`${row.id}-${row.variant}-${delta}`); };
      [-1,1].forEach(delta => {
        const control = button(delta < 0 ? '−' : '+','hc-step',()=>change(delta)); control.id = `${row.id}-${row.variant}-${delta}`; control.setAttribute('aria-label',`${delta < 0 ? 'Decrease' : 'Increase'} ${row.name} ${row.label} quantity`); control.disabled = delta > 0 && row.quantity >= 99; quantities.append(control);
        if (delta < 0) quantities.append(make('span','',String(row.quantity)));
      });
      quantities.append(button('Remove','hc-remove',()=>{cart=cart.filter(r=>r.id!==row.id || r.variant!==row.variant); save(); renderCart(); dialog.querySelector('.hc-close').focus();}));
      info.append(quantities); line.append(info,make('strong','',money(row.total))); cartView.append(line);
    });
    totals(cartView);
    const actions = make('div','hc-actions'); actions.append(button('Continue shopping','hc-secondary',()=>dialog.close()),button('Continue to checkout','hc-primary',startCheckout)); cartView.append(actions);
    if (focusId) (document.getElementById(focusId) || dialog.querySelector('.hc-close')).focus();
  }
  dialog.querySelector('#hc-back').onclick = () => {renderCart(); dialog.querySelector('.hc-close').focus();};
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const input of form.querySelectorAll('input,textarea')) input.value = input.value.trim();
    if (!form.reportValidity() || !cart.length) return;
    dialog.querySelector('#hc-handoff').hidden=true;
    customer = Object.fromEntries(new FormData(form));
    checkout.hidden=true; finalView.hidden=false; step('review'); dialog.querySelector('h2').textContent='Review & send';
    const review=dialog.querySelector('#hc-review'); review.replaceChildren();
    core.lines(cart,catalog).forEach(r=> {const item=make('div','hc-review-item'); const img=make('img');img.src=r.image;img.alt='';const info=make('div');info.append(make('h3','',r.name),make('p','hc-muted',`${r.label} · Quantity: ${r.quantity}`));item.append(img,info,make('strong','',money(r.total)));review.append(item);});
    const summary=dialog.querySelector('#hc-final-totals');summary.replaceChildren();totals(summary);
    dialog.querySelector('#hc-address').textContent=[customer.name,customer.phone,customer.address,`${customer.city}, ${customer.state} — ${customer.pincode}`,customer.notes ? `Notes: ${customer.notes}` : ''].filter(Boolean).join('\n');
    dialog.querySelector('#hc-send').focus();
  });
  dialog.querySelector('#hc-send').onclick = () => {
    if(!cart.length || !customer) return;
    const message = core.message(cart,catalog,customer);
    dialog.querySelector('#hc-message').value=message;
    dialog.querySelector('#hc-handoff').hidden=false;
    window.open(`https://wa.me/918866993501?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    dialog.querySelector('#hc-handoff').scrollIntoView({block:'nearest'});
  };
  dialog.querySelector('#hc-copy').onclick = async () => {
    const message = dialog.querySelector('#hc-message');
    try {await navigator.clipboard.writeText(message.value); dialog.querySelector('#hc-copy-status').textContent='Order message copied.';}
    catch (_) {message.focus(); message.select(); dialog.querySelector('#hc-copy-status').textContent='Select and copy the message above.';}
  };
  window.addEventListener('storage', event => {
    if(event.key !== key && event.key !== null) return;
    try {cart=core.restore(JSON.parse(event.newValue || '[]'),catalog);} catch (_) {cart=[];}
    updateCount(); if(dialog.open) {renderCart(); dialog.querySelector('.hc-close').focus(); announce('Your cart was updated in another tab.');}
  });
  updateCount();
})();

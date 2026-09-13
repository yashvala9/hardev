const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');
function setup(stored) {
 const dom = new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://hardev.example/',runScripts:'outside-only'});
 const w=dom.window; const errors=[];w.addEventListener('error',e=>errors.push(e.error));
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.HTMLElement.prototype.scrollIntoView=function(){};
 const opened=[];w.open=(...args)=>opened.push(args);
 if(stored) w.localStorage.setItem('hardev-cart-v1',stored);
 for(const file of ['cart-core.js','cart.js']) w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 return {dom,w,d:w.document,opened,errors};
}
test('all 13 products have matching sizes, prices and cart actions',()=>{
 const {dom,d,errors}=setup();try {
 assert.equal(d.querySelectorAll('.hc-add').length,13);
 assert.equal(d.querySelectorAll('.hc-buy').length,13);
 assert.deepEqual([...d.querySelectorAll('[id^="hc-size-"]')].map(s=>s.options.length),[3,3,3,4,2,2,1,1,1,1,1,1,1]);
 assert.equal(d.querySelector('#hc-size-natural-golden-shampoo').options[1].textContent,'200 ml · ₹139');
 assert.equal(d.querySelector('#hc-size-milk-herbal-soap').options[0].textContent,'1 bar · ₹40');
 assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('cart through delivery and review produces correct WhatsApp request without clearing cart',()=>{
 const {dom,w,d,opened,errors}=setup();try {
 const select=d.querySelector('#hc-size-natural-golden-shampoo');select.value='1';
 d.querySelector('.hc-add').click();d.querySelector('.hc-add').click();
 d.querySelectorAll('.hc-add')[11].click();d.querySelector('.hc-trigger').click();
 assert.equal(d.querySelector('#hc-cart-view .hc-total').textContent,'Product subtotal₹318');
 const continueButton=[...d.querySelectorAll('button')].find(b=>b.textContent==='Continue to checkout');continueButton.click();
 const form=d.querySelector('#hc-form');
 assert.equal(form.checkValidity(),false);
 const data={name:'Test Customer',phone:'9876543210',address:'Test address',city:'Surat',state:'Gujarat',pincode:'395001',notes:'Call first'};
 for(const [key,value] of Object.entries(data))form.elements[key].value=value;
 assert.equal(form.checkValidity(),true);
 form.elements.phone.value='+91 9876543210';assert.equal(form.checkValidity(),true);
 form.elements.phone.value='123';assert.equal(form.checkValidity(),false);form.elements.phone.value=data.phone;
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(d.querySelector('#hc-final-view').hidden,false);
 assert.match(d.querySelector('#hc-address').textContent,/Test Customer/);
 assert.equal(d.querySelectorAll('.hc-review-item').length,2);
 d.querySelector('#hc-send').click();assert.equal(opened.length,1);
 const url=new URL(opened[0][0]);assert.equal(url.pathname,'/918866993501');
 assert.match(url.searchParams.get('text'),/2 × ₹139 = ₹278/);assert.match(url.searchParams.get('text'),/Product subtotal: ₹318/);
 assert.equal(JSON.parse(w.localStorage.getItem('hardev-cart-v1')).length,2);
 assert.equal(w.localStorage.getItem('hardev-cart-v1').includes('Test Customer'),false);
 assert.equal(d.querySelector('#hc-message').value,url.searchParams.get('text'));
 d.querySelector('#hc-edit-address').click();assert.equal(form.elements.name.value,'Test Customer');
 assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('search, category, saved cart, removal and buy now work',()=>{
 const {dom,w,d,errors}=setup('[{"id":"milk-herbal-soap","variant":0,"quantity":2}]');try {
 assert.equal(d.querySelector('.hc-trigger').textContent,'Cart (2)');
 const search=d.querySelector('.hc-shop-tools input');search.value='shampoo';search.dispatchEvent(new w.Event('input'));
 assert.equal(d.querySelectorAll('article:not([hidden])').length,3);
 search.value='';search.dispatchEvent(new w.Event('input'));const category=d.querySelector('.hc-shop-tools select');category.value='Herbal Soaps';category.dispatchEvent(new w.Event('change'));assert.equal(d.querySelectorAll('article:not([hidden])').length,5);
 d.querySelector('.hc-trigger').click();d.querySelector('.hc-line .hc-remove').click();assert.match(d.querySelector('#hc-cart-view').textContent,/Your cart is waiting/);
 d.querySelector('.hc-close').click();d.querySelectorAll('.hc-buy')[8].click();assert.equal(d.querySelector('#hc-checkout-view').hidden,false);
 assert.deepEqual(errors,[]);
 }finally{dom.window.close();}
});
test('malformed stored cart does not prevent shopping',()=>{const {dom,d}=setup('{broken');try{assert.equal(d.querySelector('.hc-trigger').textContent,'Cart (0)');d.querySelector('.hc-add').click();assert.equal(d.querySelector('.hc-trigger').textContent,'Cart (1)');}finally{dom.window.close();}});

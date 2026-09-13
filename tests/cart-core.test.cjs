const {test} = require('node:test');
const assert = require('node:assert/strict');
const cart = require('../cart-core.js');
const catalog = [{id:'shampoo',name:'Shampoo',variants:[{label:'100 ml',price:69},{label:'200 ml',price:139}]},{id:'soap',name:'Herbal Soap',variants:[{label:'1 bar',price:40}]}];
test('restoration rejects invalid and obsolete rows and clamps merged quantities',()=>{
 assert.deepEqual(cart.restore([null,{id:'gone',variant:0,quantity:2},{id:'soap',variant:2,quantity:1},{id:'soap',variant:0,quantity:-1},{id:'soap',variant:0,quantity:2.5},{id:'soap',variant:0,quantity:80},{id:'soap',variant:0,quantity:40}],catalog),[{id:'soap',variant:0,quantity:99}]);
 assert.deepEqual(cart.restore({},catalog),[]);
});
test('different sizes remain separate and client-supplied prices are ignored',()=>{
 const rows=cart.lines([{id:'shampoo',variant:0,quantity:2,price:1},{id:'shampoo',variant:1,quantity:1}],catalog);
 assert.equal(rows.length,2);assert.equal(rows.reduce((n,r)=>n+r.total,0),277);
});
test('WhatsApp message includes items, delivery and pending payment without inventing shipping',()=>{
 const text=cart.message([{id:'soap',variant:0,quantity:3}],catalog,{name:'Test Customer',phone:'9876543210',address:'12 Test Road\nNear Park',city:'Surat',state:'Gujarat',pincode:'395001',notes:'Call first'});
 assert.match(text,/Qty: 3 × ₹40 = ₹120/);assert.match(text,/\*PRODUCT SUBTOTAL: ₹120\*/);assert.match(text,/Address: 12 Test Road Near Park/);assert.match(text,/Payment is pending; this is an order request only/);assert.match(text,/Delivery charges: Please confirm/);assert.match(text,/\*PAYMENT\*/);
 const url=new URL('https://wa.me/918866993501?text='+encodeURIComponent(text));assert.equal(url.searchParams.get('text'),text);
});
test('empty cart cannot produce an order request',()=>{assert.throws(()=>cart.message([],catalog,{}),/empty/);});

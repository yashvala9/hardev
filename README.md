# Hardev

Static herbal-products storefront. Open `index.html` through a static web server.
No backend or payment gateway is needed for this ordering flow.

## Shopping flow

Search/filter products, choose a size and quantity, add to cart or buy now, enter
an Indian delivery address, review the request, and open a prefilled WhatsApp
message to Hardev. The customer must press Send in WhatsApp. Hardev confirms
availability, delivery charges and the final total, then arranges payment.

The cart is stored on the current browser using localStorage. Delivery details
are kept in memory only and included in the WhatsApp message at the customer's
request. The website does not create a server-side order, confirm payment,
reserve stock or provide order tracking. Opening WhatsApp never clears the cart.

## Maintaining products

The cart reads names, size/price chips and images from the catalogue's HTML
articles. Keep each product's `order-btn-*` identifier stable and unique, and
retain the catalogue price-chip markup when updating prices. The existing
WhatsApp enquiry link remains as a fallback when JavaScript is disabled.
The recipient number is set in `cart.js` and the existing enquiry links.

Verify the existing Small/Big facial and jelly bar labels with the client:
both currently list 60 gm. Shipping charges are intentionally not invented.

## Verification and deployment

`npm install` installs the development-only DOM test dependency.
`npm test` runs calculation and simulated shopping-flow tests. WhatsApp is mocked;
tests do not send messages. `npm run test:core` requires no dependencies.
`npm run build` packages static assets into `dist/client` and an asset-serving
Worker into `dist/server/index.js` for Sites. Production requires no npm runtime
or client libraries. Browser visual and real-device WhatsApp QA remain separate.

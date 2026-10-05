import { readFile } from 'node:fs/promises';
import { evaluateMarket } from './engine.mjs';
const config = JSON.parse(await readFile(new URL('../config.example.json', import.meta.url), 'utf8'));
Object.assign(config, {
  mode: 'paper', maxSpendSar: 100, maxTicketPriceSar: 60, maxTicketsPerEvent: 1,
  targetResalePriceSar: 85, maxPurchaseFeePercent: 5, maxResaleFeePercent: 8,
  minNetProfitSar: 10, maxQuoteAgeSeconds: 30
});
const snapshot = {
  eventId: 'demo-event', status: 'on_sale', resaleAllowed: true, verified: true,
  observedAt: Date.now(), resaleFeePercent: 5, resaleFeeSar: 0,
  listings: [{id:'demo-listing', priceSar:55, purchaseFeePercent:3, purchaseFeeSar:0, available:true, availableQty:2, verified:true}]
};
console.log(JSON.stringify(evaluateMarket(snapshot, config), null, 2));

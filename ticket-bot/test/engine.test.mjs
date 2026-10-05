import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMarket } from '../src/engine.mjs';
const config = {
  mode:'paper', maxSpendSar:100, maxTicketPriceSar:60, maxTicketsPerEvent:1,
  targetResalePriceSar:85, maxPurchaseFeePercent:5, maxResaleFeePercent:8,
  minNetProfitSar:10, maxQuoteAgeSeconds:30
};
const market = overrides => ({
  eventId:'e1', status:'on_sale', resaleAllowed:true, verified:true, observedAt:Date.now(),
  resaleFeePercent:5, resaleFeeSar:0,
  listings:[{id:'l1',priceSar:55,purchaseFeePercent:3,purchaseFeeSar:0,available:true,availableQty:2,verified:true}],
  ...overrides
});
test('returns a capped paper candidate only when expected net meets the floor', () => {
  const result=evaluateMarket(market(),config);
  assert.equal(result.action,'paper-buy-candidate');
  assert.equal(result.quantity,1);
  assert.ok(result.estimatedPurchaseTotalSar <= config.maxSpendSar);
  assert.ok(result.estimatedNetProfitSar >= config.minNetProfitSar);
});
test('skips a ticket above the configured price ceiling', () => {
  const result=evaluateMarket(market({listings:[{id:'l1',priceSar:61,available:true,availableQty:1,verified:true}]}),config);
  assert.equal(result.action,'skip');
});
test('skips resale where the event does not allow it', () => {
  assert.equal(evaluateMarket(market({resaleAllowed:false}),config).action,'skip');
});
test('never evaluates a live order in this starter package', () => {
  assert.match(evaluateMarket(market(),{...config,mode:'live'}).reason,/locked/);
});
test('skips stale quotes', () => {
  assert.equal(evaluateMarket(market({observedAt:Date.now()-60000}),config).reason,'market quote is stale');
});

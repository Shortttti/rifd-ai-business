const finitePositive = value => Number.isFinite(Number(value)) && Number(value) > 0;
const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Pure decision logic. It never places orders or opens a payment page. */
export function evaluateMarket(snapshot, config) {
  const reject = reason => ({ action: 'skip', reason });
  if (!snapshot || !config) return reject('missing market data or configuration');
  if (config.mode !== 'paper') return reject('live mode is locked until an approved platform adapter is implemented');
  if (snapshot.status !== 'on_sale') return reject('event is not on sale');
  if (snapshot.resaleAllowed !== true) return reject('platform/event does not explicitly allow resale');
  if (snapshot.verified !== true) return reject('listing data is not verified');
  if (!finitePositive(config.maxSpendSar) || !finitePositive(config.maxTicketPriceSar)) return reject('set a spend ceiling and maximum ticket price');
  if (!finitePositive(config.targetResalePriceSar)) return reject('set a target resale price');
  if (!finitePositive(config.maxTicketsPerEvent)) return reject('set a positive ticket quantity cap');
  if (!Number.isFinite(snapshot.observedAt)) return reject('market timestamp is missing');
  const ageSeconds = (Date.now() - snapshot.observedAt) / 1000;
  if (ageSeconds < -5 || ageSeconds > Number(config.maxQuoteAgeSeconds ?? 30)) return reject('market quote is stale');
  const listing = snapshot.listings?.filter(item => item.verified === true && item.available === true)
    .sort((a, b) => Number(a.priceSar) - Number(b.priceSar))[0];
  if (!listing) return reject('no verified tickets are available');
  const quantity = Math.min(Number(config.maxTicketsPerEvent), Number(listing.availableQty ?? 1));
  if (!Number.isInteger(quantity) || quantity < 1) return reject('invalid quantity');
  const unitPrice = Number(listing.priceSar);
  if (!finitePositive(unitPrice) || unitPrice > Number(config.maxTicketPriceSar)) return reject('ticket exceeds the configured unit price cap');
  if (Number(listing.purchaseFeePercent ?? 0) > Number(config.maxPurchaseFeePercent ?? 0)) return reject('purchase fee exceeds the configured cap');
  if (Number(snapshot.resaleFeePercent ?? 0) > Number(config.maxResaleFeePercent ?? 0)) return reject('resale fee exceeds the configured cap');

  const purchaseTotal = money(quantity * unitPrice * (1 + Number(listing.purchaseFeePercent ?? 0) / 100) + Number(listing.purchaseFeeSar ?? 0));
  if (purchaseTotal > Number(config.maxSpendSar)) return reject('order exceeds the total spend ceiling');
  const expectedResale = Number(config.targetResalePriceSar);
  const resaleNet = money(quantity * expectedResale * (1 - Number(snapshot.resaleFeePercent ?? 0) / 100) - Number(snapshot.resaleFeeSar ?? 0));
  const expectedProfit = money(resaleNet - purchaseTotal);
  if (expectedProfit < Number(config.minNetProfitSar ?? 0)) return reject('expected net profit is below the configured minimum');

  return {
    action: 'paper-buy-candidate',
    eventId: String(snapshot.eventId ?? ''),
    listingId: String(listing.id ?? ''),
    quantity,
    unitPriceSar: money(unitPrice),
    estimatedPurchaseTotalSar: purchaseTotal,
    targetResalePriceSar: money(expectedResale),
    estimatedNetProfitSar: expectedProfit,
    note: 'A positive estimate is not a guaranteed sale or profit.'
  };
}

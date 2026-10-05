# Ticket trading agent — starter core

This folder contains a tested decision engine for a Webook-like ticket marketplace challenge. It can decide whether a *simulated* ticket purchase meets price, total-spend, fee, resale-permission, quote-freshness, and minimum-profit limits. It does not connect to any site and cannot place or resell real tickets.

## Run the simulation

Requires Node.js 20 or newer. From this folder:

```sh
npm test
npm run simulate
```

The example prints a paper-trade candidate only. Values in the example are fictional and are not recommendations.

## What must be connected for live use

The private platform's host name is not enough by itself. A live connector must know how that platform exposes a verified ticket listing, how it accepts an order, and how it lists an owned ticket for resale. This starter intentionally has no browser scraping, credential handling, card entry, or live-order code. A live adapter should use an interface expressly allowed by the platform owner and event rules, and should enforce a user-set maximum total spend on every order.

Set the actual platform address only in a local, untracked configuration file. Never commit passwords, session cookies, API keys, or payment-card details to this public repository. Keep payment details on the platform's own checkout page. Begin in paper mode; the `live` mode is deliberately locked until a verified adapter and explicit limits exist.

# EqualiF.I. Planner — Play Submission Packet

Prepared 2026-10-21. Status key: ✅ ready · ⏳ waiting · ❓ verify in Console

## Binary

- ✅ AAB: `release/equalifi-release.aab` — v1.0.0 (versionCode 1), signed with the
  local upload key (SHA-256 in assetlinks), jarsigner-verified.
- ✅ Bundle verified: package `org.axiomzetainnovations.financialindependence`,
  Play Billing client + TWA Digital Goods payment service present.
- Target: Internal testing track first. **Do NOT release to production until the
  `equalifi_monthly` subscription product + trial offer exist** — the app is
  hard-gated and would otherwise lock users behind an unpurchasable paywall.

## Store listing (draft copy)

- **Title:** EqualiF.I. Planner
- **Short description (77/80):** Calculate your FI number, pay off debt, and model retirement with confidence.
- **Full description (draft):**

  EqualiF.I. Planner is an educational financial-planning tool that helps you
  find your Financial Independence number and build a plan to reach it.

  • Calculate your FI number from your spending, income, and savings rate
  • Model debt payoff and see how extra payments change your timeline
  • Budget cash flow and test "what-if" scenarios
  • Evaluate risk and project retirement outcomes over time

  SUBSCRIPTION: EqualiF.I. Planner is available by subscription inside the
  Android app — 7-day free trial, then $11.99/month, auto-renews until
  cancelled. Manage or cancel anytime in Google Play > Subscriptions.

  EqualiF.I. Planner is an educational tool. It does not provide individualized
  financial, tax, legal, or investment advice.

- **Category:** Finance · **Tags:** financial planning, budgeting, retirement
- **Icon:** `public/pwa-512x512.png` (512×512) ✅
- **Screenshots:** `public/screenshot-mobile.png` (540×960) ✅ seed set;
  capture 2–4 more from the live app at submission time.
- **Feature graphic (1024×500):** ⏳ not yet created — make from brand colors
  (#166534 on #faf7f2) before production submission (not required for internal testing).
- **Privacy policy:** https://equalifi-planner.vercel.app/privacy.html ✅ live

## Declarations (prepare in Console)

- **Data safety (draft — ❓ verify against the live build):** account info
  (email, user ID — Firebase Auth) and financial info entered by the user
  (income, debts, goals — stored in Firestore). Data encrypted in transit;
  not sold; not shared with third parties for advertising. Account/data
  deletion: ✅ in-app flow built 2026-10-21 (account menu → Delete Account:
  re-authenticates, deletes Firestore profile + plan docs, then the Firebase
  user; warns that deletion does NOT cancel the Play subscription) plus
  contact-email deletion via the privacy policy. Answer "yes" on the form.
- **Content rating:** questionnaire — finance reference/educational tool, no
  objectionable content; expected outcome Everyone.
- **Target audience:** 18+ (financial product).
- **Financial features declaration:** personal financial management /
  budgeting features; no lending, no crypto, no trading.
- **Ads:** contains no ads.
- **App access:** subscription-gated; provide reviewer note that the full app
  requires the Play subscription (trial available) and license-testing is on.

## Blockers / sequence

1. ⏳ **Merchant account** (Zebulon only): Play Console → Monetize → set up
   Google Payments merchant account (LLC tax/bank). Verified still missing
   2026-10-21 for the whole developer account.
2. After (1): create subscription `equalifi_monthly`, base plan $11.99/mo,
   activate; add introductory offer: free trial 7 days, new subscribers.
3. Upload AAB to Internal testing → add license testers → device-test the
   purchase → trial → unlock flow end to end.
4. After first upload: copy the Play **app-signing** SHA-256 from
   Console → Setup → App signing into `public/.well-known/assetlinks.json`
   as a second fingerprint, redeploy web app.
5. Server-side purchase verification (Play Developer API + RTDN) is the
   documented pre-production hardening item; v1 is client-side
   `listPurchases()`.

# EqualiF.I. Planner — Google Play Release Setup

Status key: ✅ done in this repo · ⏳ needs Play Console / Zebulon action

## App identity

- App name: **EqualiF.I. Planner**
- Package: `org.axiomzetainnovations.financialindependence`
- Version: 1.0.0 (versionCode 1)
- Form: Trusted Web Activity (Bubblewrap) wrapping the hosted PWA
- PWA host: https://equalifi-planner.vercel.app
- Privacy policy: https://equalifi-planner.vercel.app/privacy.html

## ✅ Already prepared in this repo

- PWA manifest (via vite-plugin-pwa), service worker, icons (192/512/maskable), screenshots.
- `twa-manifest.json`: host set to `equalifi-planner.vercel.app`,
  `features.playBilling.enabled = true`, `alphaDependencies.enabled = true`
  (required for the Digital Goods API / Play Billing in a TWA).
- Google Play Billing in-app via the Digital Goods API
  (`src/billing/`, `src/components/PaywallModal.tsx`):
  - Free inside the Android app: assessment steps 1–8.
  - Premium: Dashboard, Scenarios, Report (steps 9–11) + saved scenarios.
  - On the open web the billing API does not exist, so the planner stays
    ungated and the paywall explains the Android app.
- `public/privacy.html` privacy policy page.
- `.github/workflows/build-aab.yml`: CI job (manual dispatch) that builds
  the signed AAB with Bubblewrap 1.25.x (Play Billing Library 8 /
  target SDK 36 line). Gradle cannot run on the agent VM, so the AAB is
  built in GitHub Actions.

## Subscription products — RESTORED (2026-10-21)

The paywall was removed on 2026-10-10 (fully free), then Zebulon
directed a Play subscription again on 2026-10-21 as a per-product
exception: **7-day free trial, then $11.99/month, HARD GATE** — inside
the Android app the whole planner requires an active subscription
(a trial counts as active). The billing code (Digital Goods API) is
restored in `src/billing/` + `src/components/PaywallModal.tsx`; the
Oct Stripe web paywall is NOT restored. The open web stays ungated
(Digital Goods cannot run there).

### Subscription product (create in Play Console)

Monetize → Subscriptions → Create subscription:

| Product ID | Base plan | Price (USD) | Period |
|---|---|---|---|
| `equalifi_monthly` | monthly (auto-renewing) | $11.99 | 1 month |

- The product ID above must match `src/billing/plans.ts` exactly.
- Set the US price as above; let Play auto-convert for other countries.
- Activate the base plan.
- Add an **introductory offer** to the base plan: **free trial, 7 days**,
  eligible for new subscribers. The trial lives in Play Console, not
  in code; the app's purchase UI copy reflects it.
- Creating subscriptions requires a completed Google Payments
  merchant profile — the step that blocked this in Oct 2026.

## ⏳ Play Console steps (need Zebulon's go-ahead)

1. Create app "EqualiF.I. Planner" (app, free with in-app purchases,
   category Finance) under the Axiom Zeta Innovations developer account.
2. Create the subscription product above, activate its base plan, and
   add the 7-day free-trial introductory offer.
3. Generate the upload keystore (done locally — see below), then set repo
   secrets `ANDROID_KEYSTORE_BASE64`, `BUBBLEWRAP_KEYSTORE_PASSWORD`,
   `BUBBLEWRAP_KEY_PASSWORD`; run the "Build Android App Bundle" workflow;
   upload the resulting `app-release-bundle.aab` to a Closed or Internal
   testing track first.
4. After the first upload, open Play Console → Setup → App signing and copy
   the **App signing key** SHA-256 fingerprint into
   `public/.well-known/assetlinks.json` as a second fingerprint (the file
   already carries the local upload-key fingerprint), then redeploy the
   web app. Without this the TWA shows a browser address bar instead of
   running fullscreen.
5. Store listing: name, short/full description (educational planner,
   not financial advice), icon, feature graphic, phone screenshots
   (`public/screenshot-mobile.png` can seed these).
6. Declarations: Data safety (account info + financial info entered by
   user, stored in Firebase; no data sold/shared), Content rating,
   Target audience 18+, Financial features declaration, Privacy policy
   URL above.
7. License testing: add tester Gmail accounts so subscriptions can be
   test-purchased without charge; test the full purchase → premium
   unlock flow on a real device from the testing track.
8. Production hardening before public launch: verify purchases
   server-side with the Google Play Developer API + Real-time Developer
   Notifications (v1 entitlement is client-side `listPurchases()`).

## Signing key

- Generated locally: `android.keystore` (alias `android`) in this project
  directory, gitignored, with the password in `.keystore-pass.txt`
  (also gitignored). **Back both up off this VM before the Play upload** —
  losing the upload key means a Play support reset process.

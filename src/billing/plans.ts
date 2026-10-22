/**
 * Google Play subscription catalogue for EqualiF.I. Planner.
 *
 * These itemIds MUST match the subscription product IDs created in
 * Google Play Console (Monetize > Subscriptions). Prices are set in
 * Play Console per country; the USD fallbacks below are only used for
 * display when the Digital Goods API cannot return a localized price
 * (e.g. when running on the open web, outside the Android app).
 *
 * Pricing decided 2026-10-21: 7-day free trial, then $11.99/month
 * (USD base). The free trial is NOT implemented in code — it is an
 * introductory offer configured on the base plan in Play Console;
 * the purchase UI copy reflects it. Single monthly product only
 * (the earlier yearly product is dropped).
 */
export interface PlanDef {
  itemId: string;
  name: string;
  periodLabel: string;
  fallbackPrice: string;
  blurb: string;
}

export const SUBSCRIPTION_PLANS: PlanDef[] = [
  {
    itemId: 'equalifi_monthly',
    name: 'Monthly',
    periodLabel: '/month',
    fallbackPrice: '$11.99',
    blurb:
      '7-day free trial, then $11.99/month. Full planner — cancel anytime in Google Play.',
  },
];

export const PLAN_ITEM_IDS = SUBSCRIPTION_PLANS.map((p) => p.itemId);

/** Display copy for the trial offer (configured in Play Console). */
export const TRIAL_COPY = '7-day free trial, then $11.99/month';

/** Google Play Billing service provider URL for the Digital Goods API. */
export const PLAY_BILLING_SERVICE_URL = 'https://play.google.com/billing';

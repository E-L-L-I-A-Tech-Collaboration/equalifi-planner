import React from 'react';
import { X, Check, Crown, RefreshCw } from 'lucide-react';
import { SUBSCRIPTION_PLANS, TRIAL_COPY } from '../billing/plans';
import type { SubscriptionState } from '../billing/useSubscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sub: SubscriptionState;
  /**
   * Hard-gate mode: rendered as the app's subscription screen with no
   * way to dismiss it (used when the Android app has no active
   * subscription). Hides the close button.
   */
  blocking?: boolean;
}

function formatPrice(
  sub: SubscriptionState,
  itemId: string,
  fallback: string,
): string {
  const detail = sub.details[itemId];
  if (detail?.price) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: detail.price.currency,
      }).format(Number(detail.price.value));
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * EqualiF.I. Premium paywall.
 *
 * Inside the Google Play app this drives Play Billing through the
 * Digital Goods API. On the open web it explains the subscription and
 * points to the Android app; the web planner itself stays ungated.
 *
 * Offer: 7-day free trial, then $11.99/month. The trial is an
 * introductory offer configured in Play Console, not code.
 */
export default function PaywallModal({ isOpen, onClose, sub, blocking }: PaywallModalProps) {
  if (!isOpen) return null;

  const inPlay = sub.status === 'free' || sub.status === 'premium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 print:hidden">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-white relative">
          {!blocking && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6" />
            <h2 className="text-xl font-black tracking-tight">EqualiF.I. Premium</h2>
          </div>
          <p className="text-sm text-white/85 mt-1">
            {blocking
              ? 'The planner requires an active subscription in the Android app. Start your free trial to continue.'
              : 'Unlock your full Financial Independence dashboard, scenario modeling, and printable report.'}
          </p>
          <p className="text-sm font-bold text-white mt-2">{TRIAL_COPY}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {sub.status === 'premium' ? (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">You&apos;re Premium.</p>
                <p className="text-sm text-emerald-800">
                  Your Google Play subscription is active. Manage or cancel it
                  anytime in Google Play &gt; Subscriptions.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.itemId}
                    className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-400 transition-colors"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {plan.name}
                    </div>
                    <div className="text-2xl font-black text-zinc-900">
                      {formatPrice(sub, plan.itemId, plan.fallbackPrice)}
                      <span className="text-sm font-semibold text-zinc-500">
                        {plan.periodLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 flex-1">{plan.blurb}</p>
                    <button
                      type="button"
                      disabled={!inPlay || sub.purchasingItemId !== null}
                      onClick={() => void sub.purchase(plan.itemId)}
                      className="mt-1 w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-emerald-700 transition-all cursor-pointer"
                    >
                      {sub.purchasingItemId === plan.itemId
                        ? 'Opening Google Play…'
                        : inPlay
                          ? 'Start 7-day free trial'
                          : 'Available in the Android app'}
                    </button>
                  </div>
                ))}
              </div>

              {!inPlay && (
                <p className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  Subscriptions are sold through Google Play inside the
                  EqualiF.I. Planner Android app. This web version stays open
                  so you can explore the planner first.
                </p>
              )}

              <button
                type="button"
                onClick={() => void sub.refresh()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore purchase
              </button>

              {sub.error && (
                <p className="text-xs text-red-600">{sub.error}</p>
              )}

              <p className="text-[11px] leading-relaxed text-zinc-500">
                {TRIAL_COPY}. Auto-renews until cancelled. Payment is charged
                to your Google Play account; manage or cancel anytime in
                Google Play subscriptions. EqualiF.I. Planner is an
                educational tool and does not provide individualized
                financial, tax, legal, or investment advice.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

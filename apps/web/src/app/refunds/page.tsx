import type { Metadata } from "next"
import { LegalShell, LegalSection, LegalList } from "@/components/legal/legal-shell"

export const metadata: Metadata = {
  title: "Refunds & Cancellations",
  description: "How refunds and cancellations work for Vision Menu subscriptions and food orders.",
}

export default function RefundsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Refunds & Cancellations"
      subtitle="How refunds and cancellations work — for Vision Menu subscriptions, and for food orders placed with a restaurant."
      updated="29 July 2026"
    >
      <LegalSection title="Overview">
        <p>
          This policy covers two separate kinds of payment, because Vision Menu is a technology
          platform, not a restaurant:
        </p>
        <LegalList
          items={[
            "Subscription fees, paid by restaurant owners to Vision Menu for use of the platform (Free, Basic, and Pro plans)",
            "Food order payments, paid by diners directly to the restaurant they ordered from, either in cash or online",
          ]}
        />
        <p>
          Because these are different transactions between different parties, they're covered
          separately below.
        </p>
      </LegalSection>

      <LegalSection title="Subscription plans">
        <p>
          Basic and Pro subscription plans are digital services activated immediately on upgrade
          — your higher menu-item and table limits, and features such as branding, delivery
          zones, analytics, and AR, unlock as soon as payment is confirmed. Because the plan is
          delivered instantly, subscription fees are non-refundable once a billing period has
          begun.
        </p>
        <p>
          There's nothing to actively cancel, because paid plans don't auto-renew. If a plan
          isn't renewed before its current 30-day period ends, the account simply reverts to
          Free-plan limits at the end of that period — you keep full access to what you paid for
          until it expires.
        </p>
        <p>
          We don't offer partial or pro-rata refunds for unused days within a billing period,
          including if you downgrade, stop using the Service, or close your account before the
          period ends.
        </p>
      </LegalSection>

      <LegalSection title="Food orders">
        <p>
          Every food order placed through Vision Menu is a transaction between the diner and the
          restaurant. Vision Menu is the technology behind the order, not the seller of the food,
          and — because restaurants connect their own payment accounts — we never hold the funds
          for a food order.
        </p>
        <LegalList
          items={[
            <>
              <span className="font-semibold text-ink">Cash orders. </span>
              Payment is made and settled directly at the restaurant's counter. Any refund or
              adjustment is handled by the restaurant, in person, at the time of order.
            </>,
            <>
              <span className="font-semibold text-ink">Online orders. </span>
              Payment goes directly into the restaurant's own connected payment account (Cashfree
              in India, Stripe abroad). If an order needs to be refunded — a cancellation, an
              unavailable item, or something went wrong — the restaurant processes that refund
              through its own payment provider, back to the diner's original payment method.
            </>,
          ]}
        />
        <p>
          Because Vision Menu never holds order funds, we're not able to issue a food-order
          refund ourselves. We'll always help point you to the right restaurant contact, but the
          decision and processing of a food-order refund rests with that restaurant, under its own
          cancellation and refund policy.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund or cancellation">
        <p>
          For a subscription question, email support@visionmenu.app from your account's
          registered email address and we'll confirm your plan status and billing history.
        </p>
        <p>
          For a food order — a wrong item, a cancellation, a refund — contact the restaurant
          directly using the details on your order confirmation or receipt, or speak to a staff
          member at the counter. If you're not sure how to reach the restaurant, email us at
          support@visionmenu.app and we'll help you get in touch.
        </p>
      </LegalSection>

      <LegalSection title="Timelines">
        <p>
          Subscription changes — upgrades, downgrades, or reversion to Free — take effect as
          described above, either immediately or at the end of your current billing period.
        </p>
        <p>
          Food-order refund timelines depend on the restaurant and, for online payments, on its
          payment provider — typically a few business days once the restaurant approves the
          refund. Vision Menu doesn't control these timelines, since we're not the party holding
          the funds.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy can be sent to{" "}
          <a
            href="mailto:support@visionmenu.app"
            className="font-semibold text-primary hover:underline"
          >
            support@visionmenu.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  )
}

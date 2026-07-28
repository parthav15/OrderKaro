import type { Metadata } from "next"
import { LegalShell, LegalSection, LegalList } from "@/components/legal/legal-shell"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern use of the Vision Menu platform.",
}

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms & Conditions"
      subtitle="The rules that govern your use of Vision Menu. Please read them before creating a restaurant account."
      updated="29 July 2026"
    >
      <LegalSection title="Acceptance of terms">
        <p>
          These Terms & Conditions ("Terms") govern access to and use of Vision Menu
          (visionmenu.app), the software-as-a-service platform described below. They form a
          binding agreement between you and Vision Menu ("we", "us", "our").
        </p>
        <p>
          By creating a restaurant account, or by otherwise accessing or using the Service, you
          agree to be bound by these Terms. If you're accepting on behalf of a restaurant or
          business, you confirm you have the authority to do so. If you don't agree to these
          Terms, please don't use the Service.
        </p>
      </LegalSection>

      <LegalSection title="What Vision Menu provides">
        <p>
          Vision Menu is a technology platform for restaurants. It gives a restaurant a
          QR-code-based digital menu and ordering flow, kitchen and counter display screens to
          manage fulfilment, optional AR/3D dish previews, configurable delivery zones, and sales
          analytics.
        </p>
        <p>
          We build, host, and maintain this software. We are not a restaurant, we don't prepare
          or deliver food, and we are not a party to the sale of any food or beverage ordered
          through the Service — that relationship is between the diner and the restaurant, as
          explained below.
        </p>
      </LegalSection>

      <LegalSection title="Accounts & eligibility">
        <p>
          To use Vision Menu, a restaurant must create an account and provide accurate, current
          information about itself and its business. The person creating the account must be at
          least 18 years old and authorised to act on behalf of that restaurant.
        </p>
        <p>
          You're responsible for keeping your login credentials confidential and for all activity
          under your account, including activity by any staff members you invite into roles such
          as manager, kitchen, or counter. Tell us immediately at support@visionmenu.app if you
          suspect unauthorised access to your account.
        </p>
      </LegalSection>

      <LegalSection title="Subscriptions, billing & taxes">
        <p>
          Vision Menu offers Free, Basic, and Pro subscription plans. Each plan has its own
          limits on menu items and tables, and its own set of features — such as custom branding,
          delivery zones, analytics, and AR menus — as described on our Pricing page. The Free
          plan costs ₹0 and can be used indefinitely.
        </p>
        <p>
          Basic and Pro are paid plans, billed in Indian Rupees (INR) for a fixed 30-day period
          at the price shown on our Pricing page at the time of purchase, plus any taxes required
          by law (such as GST) unless stated otherwise.
        </p>
        <p>
          Paid plans do not renew automatically. There's nothing to actively cancel: if a plan
          isn't renewed before its 30-day period ends, the account is not suspended — it simply
          reverts to Free-plan limits at the end of that period. If your menu items, tables, or
          enabled features exceed what the Free plan allows, you won't be able to add more until
          you upgrade again. You can upgrade, downgrade, or let a plan lapse at any time from your
          account settings. See our Refunds & Cancellations policy for how billing periods and
          refunds work.
        </p>
      </LegalSection>

      <LegalSection title="The restaurant–diner relationship & payments">
        <p>
          Vision Menu is a technology provider, not a restaurant, and not the seller of any food
          or beverage ordered through the Service. Every order placed on a restaurant's Vision
          Menu page is a direct transaction between the diner and that restaurant.
        </p>
        <p>
          Restaurants connect their own payment gateway account to accept online payments —
          Cashfree for restaurants in India, Stripe for restaurants abroad. When a diner pays
          online, the payment is collected and settled directly into the restaurant's own
          connected account. Vision Menu never receives, holds, or has access to a diner's order
          payment, and takes zero commission on any food order, on every plan.
        </p>
        <p>
          Diners may also be offered the choice to pay in cash at the restaurant's counter, which
          is settled entirely between the diner and the restaurant with no involvement from
          Vision Menu. Vision Menu does not offer a wallet or any stored balance — every order is
          paid for individually, either in cash or online.
        </p>
        <p>
          Because we are not a party to the order, we are not responsible for the quality,
          safety, pricing, availability, or preparation of any food or beverage, or for a
          restaurant's fulfilment of an order. Restaurants are solely responsible for complying
          with applicable food-safety, licensing, consumer-protection, and tax obligations for the
          orders they take.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>When using Vision Menu, you agree not to:</p>
        <LegalList
          items={[
            "Use the Service for any unlawful purpose, or in a way that infringes another person's rights",
            "Access, or attempt to access, another restaurant's account, data, or menu without authorisation",
            "Probe, scan, or attempt to breach the security of the Service, or interfere with its normal operation",
            "Upload menu content, images, or 3D models you don't have the rights to use, or that are false, misleading, obscene, or unlawful",
            "Use our notification tools — email, SMS, or WhatsApp — to send unsolicited or unrelated messages to diners",
            "Reverse-engineer, resell, or white-label the Service without our written permission",
          ]}
        />
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The Vision Menu name, logo, software, and platform design belong to us and are
          protected by applicable intellectual property laws. Nothing in these Terms gives you
          rights to our brand or software beyond what's needed to use the Service as intended.
        </p>
        <p>
          You keep ownership of the content you upload — menu items, descriptions, photos, dish
          names, branding, and 3D models — and you grant us a limited licence to host, display,
          and process that content solely to operate the Service for you, such as showing your
          menu to diners or generating a photo you've requested. You're responsible for having
          the rights to any content you upload.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers & limitation of liability">
        <p>
          The Service is provided "as is" and "as available." We work to keep Vision Menu
          reliable, but we don't guarantee it will be uninterrupted, error-free, or available at
          all times, and we're not liable for losses caused by outages, bugs, or the third-party
          services we depend on, such as payment gateways, SMS/WhatsApp providers, or hosting
          infrastructure.
        </p>
        <p>
          To the fullest extent permitted by law, our total liability arising out of or relating
          to the Service is limited to the subscription fees you paid us in the three months
          before the claim arose. We're not liable for indirect, incidental, or consequential
          damages, or for any dispute, loss, or claim arising from a food order itself — including
          food quality, delivery, or refunds — which are matters between the diner and the
          restaurant, not us.
        </p>
      </LegalSection>

      <LegalSection title="Suspension & termination">
        <p>
          We may suspend or terminate a restaurant account that breaches these Terms, misuses the
          Service, fails to pay applicable fees, or where we reasonably believe continued access
          poses a risk to diners, other restaurants, or the Service itself.
        </p>
        <p>
          You can close your account at any time by emailing support@visionmenu.app. Closing an
          account doesn't entitle you to a refund of an active paid-plan period — see our Refunds
          & Cancellations policy. On termination, your menu and ordering page stop being publicly
          accessible; we may retain account and order records as required by law or as described
          in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We may update these Terms from time to time to reflect changes to the Service, our
          practices, or the law. We'll update the "Last updated" date above, and where a change
          is material we'll make reasonable efforts to notify account owners by email. Continuing
          to use Vision Menu after a change takes effect means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law
          principles. Any dispute arising out of or relating to these Terms or the Service is
          subject to the exclusive jurisdiction of the competent courts of India.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms can be sent to{" "}
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

import type { Metadata } from "next"
import { LegalShell, LegalSection, LegalList } from "@/components/legal/legal-shell"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Vision Menu collects, how we use it, and your choices.",
}

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="What information Vision Menu collects, how we use it, and the choices you have."
      updated="29 July 2026"
    >
      <LegalSection title="Information we collect">
        <p>We collect different information depending on how you use Vision Menu.</p>
        <p>
          <span className="font-semibold text-ink">Restaurant owners & staff. </span>
          Your name, email address, and phone number; details about your restaurant, such as its
          name, address, cuisine, branding, and menu content; and, if you enable online payments,
          the payout and bank details needed to connect a Cashfree or Stripe account — these are
          collected and stored by the payment gateway itself, not by Vision Menu.
        </p>
        <p>
          <span className="font-semibold text-ink">Diners. </span>
          Your name and phone number, used to identify an order and send status updates, and your
          order history — items ordered, order value, and timestamps — tied to the restaurant you
          ordered from.
        </p>
        <p>
          <span className="font-semibold text-ink">Usage & device data. </span>
          From everyone who uses the Service, we automatically collect usage and device data,
          such as pages visited, device and browser type, and approximate access times, to keep
          the Service secure and working correctly.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            "Operate the Service — digital menus, order placement, kitchen and counter displays, and AR previews",
            "Route and process payments — through a restaurant's own connected gateway for food orders, or through our platform billing for subscription fees",
            "Send order-status notifications, by email and, where a restaurant has enabled it, WhatsApp or SMS",
            "Provide customer support and respond to enquiries",
            "Monitor, secure, and improve the platform",
            "Meet our legal and tax obligations",
          ]}
        />
      </LegalSection>

      <LegalSection title="Sharing & disclosure">
        <p>
          We don't sell your personal information to anyone. We share it only where it's
          necessary to run the Service:
        </p>
        <LegalList
          items={[
            "Payment gateways (Cashfree, Stripe) — to process and route payments, either to a restaurant's own connected account for food orders, or to our platform account for subscription billing",
            "Our SMS/WhatsApp notification provider (Twilio) — to deliver optional order-status messages, where a restaurant has enabled them",
            "Hosting, database, and infrastructure providers — who store and run the Service on our behalf, under confidentiality obligations",
            "Regulators or authorities, where required by law or a valid legal request",
          ]}
        />
        <p>
          A restaurant can see the orders, name, and phone number tied to an order placed with
          it — that's necessary for it to prepare and hand over the order.
        </p>
      </LegalSection>

      <LegalSection title="Data security">
        <p>
          We encrypt sensitive stored credentials, including restaurant payment-gateway API keys,
          at rest, and we restrict access to personal data to the systems and team members who
          need it to operate the Service. No method of storage or transmission is perfectly
          secure, but we take reasonable technical and organisational measures to protect your
          information against unauthorised access, alteration, or loss.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use cookies and similar local storage to keep you signed in, remember preferences
          such as your cart or selected restaurant, and understand how the Service is used so we
          can improve it. We don't use cookies for third-party advertising.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We keep account and order data for as long as an account is active, and for a
          reasonable period afterwards to meet accounting, tax, and legal obligations, resolve
          disputes, and enforce our agreements. You can request deletion of your personal data as
          described below, subject to records we're legally required to keep.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on where you're located, you may have the right to access, correct, or
          request deletion of the personal information we hold about you, and to object to or
          restrict certain uses of it. To exercise any of these rights, email
          support@visionmenu.app — we'll verify your request and respond within a reasonable
          time.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Vision Menu's diner-facing ordering flow can be used by people of any age placing a
          food order — for example, students ordering at a college canteen. We only collect the
          minimal information needed to fulfil an order, such as a name and phone number, and we
          don't knowingly collect more than that from a child. If you believe a child has shared
          more information with us than necessary, contact support@visionmenu.app and we'll
          delete it.
        </p>
        <p>
          Restaurant accounts, separately, may only be created by someone 18 or older, as set out
          in our Terms & Conditions.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this Privacy Policy as our Service or legal obligations change. We'll
          update the "Last updated" date above, and for material changes we'll make reasonable
          efforts to notify restaurant owners by email.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this Privacy Policy, or requests about your personal data, can be sent
          to{" "}
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

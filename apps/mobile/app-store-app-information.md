# Vision Menu — App Store Connect prompts

Two paste-ready Claude Chrome-extension prompts. Values are Vision-Menu-specific and inferred from the codebase (name `Vision Menu`, bundle `com.visionmenu.app`, live policy pages on `visionmenu.app`).

---

## 1) App Information page

**Paste into the Claude Chrome extension while on Vision Menu → App Information in App Store Connect. Save each section; do NOT click Add for Review / Submit.**

> You are configuring the **App Information** page for Vision Menu. Set these exactly, then Save each section:
>
> - Name: `Vision Menu`
> - Subtitle: `Scan, order, skip the line`
> - Primary Language: `English (U.S.)`
> - Primary Category: `Food & Drink`   Secondary Category: `Business`
> - Content Rights: select `No, it does not contain, show, or access third-party content`
> - Age Rating → click **Edit** → answer the questionnaire with the **lowest / negative** option for every single item:
>   - Cartoon or Fantasy Violence: `None`
>   - Realistic Violence: `None`
>   - Prolonged Graphic or Sadistic Realistic Violence: `None`
>   - Profanity or Crude Humor: `None`
>   - Mature/Suggestive Themes: `None`
>   - Horror/Fear Themes: `None`
>   - Medical/Treatment Information: `None`
>   - Alcohol, Tobacco, or Drug Use or References: `None`
>   - Simulated Gambling: `None`
>   - Sexual Content or Nudity: `None`
>   - Graphic Sexual Content and Nudity: `None`
>   - Contests: `None`
>   - Unrestricted Web Access: `No`
>   - Gambling: `No`
>   - Made for Kids: `No`
>   - → this should produce a **4+** rating. Save.
> - Privacy Policy URL: `https://visionmenu.app/privacy`
> - Leave **License Agreement** on Apple's default EULA (do not upload a custom one).
>
> When done, report which fields saved, the age-rating result, and anything that blocked saving. Do NOT submit anything for review.

---

## 2) App Review Information (on the version page, not App Information)

**Paste while on the app **version** page, in the App Review Information section. Fill only; do NOT submit for review.**

> You are filling the **App Review Information** section for the Vision Menu version. Set exactly, then Save:
>
> - Sign-In required: `Yes`
> - Demo Account — User Name: `sachidanandsabrwal@gmail.com`
> - Demo Account — Password: `password123`
> - Contact — First Name: `Parthav`   Last Name: `Sabrwal`   Email: `<your email>`   Phone: `<your phone>`
> - Notes:
>   `Vision Menu is a QR-based restaurant ordering platform with three roles in one app: diner, restaurant owner, and kitchen/counter. OWNER: the demo account above signs in as a restaurant owner (menu, orders, analytics, settings). DINER (customer): on the diner sign-in screen enter phone number 9000000042 and any name, tap Send Code, then enter the code 424242. Diner login normally delivers a one-time code over WhatsApp/SMS; this reserved test number accepts the fixed code above so you can review the full ordering flow without a live phone. After signing in as a diner, open a restaurant (e.g. "SN College Canteen"), add items to the cart, and place an order.`
>
> When done, report which fields saved and anything that blocked saving. Do NOT submit for review.

---

### Notes / choices
- **Subtitle** `Scan, order, skip the line` = 26/30 chars. Swap freely.
- **Secondary Category** set to `Business` (owner/kitchen management side); `Lifestyle` is an equally valid alternative.
- **Content Rights = No**: restaurants manage their own menus inside the platform; the app itself doesn't license third-party media.
- ✅ **Reviewer OTP bypass is live** — diner phone `9000000042` + code `424242` logs in without a real OTP (env-gated `REVIEW_TEST_PHONE`/`REVIEW_TEST_CODE`, prod only; no real user is affected). After the app is approved you can delete those two Vercel env vars to turn it off.

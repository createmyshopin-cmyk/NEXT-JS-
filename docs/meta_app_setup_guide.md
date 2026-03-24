# Complete Guide to Setting up your Meta App for Instagram Automations

This guide walks you through perfectly setting up a new Meta App so your Instagram Webhooks (DMs and Comments) correctly trigger the backend without getting blocked by Meta.

## Step 1: Create the Meta App
1. Go to the [Meta Developer Dashboard](https://developers.facebook.com/apps/) and log in.
2. Click the green **Create App** button.
3. **What do you want your app to do?** Select **Other** -> **Next**.
4. **Select an app type:** Select **Business** -> **Next**.
5. Add an App Name (e.g., "TravelVoo Instagram Bot") and link your Business Account if prompted. Click **Create app**.

## Step 2: Add Necessary Products
You now need to add two specific products to your dashboard. Scroll down to **Add products to your app**:
1. Find **Instagram Graph API** and click **Set up**.
2. Go back to the Dashboard, find **Webhooks** and click **Set up**.
3. *Optional but recommended for the OAuth login flow:* Find **Facebook Login for Business** and click **Set up**. 

## Step 3: Configure the Webhook
This is the most critical step to ensure your server receives messages.

1. In the left sidebar, click **Webhooks**.
2. In the top-right dropdown, select **Instagram** (it defaults to "Page", you must switch it to Instagram).
3. Click **Subscribe to this object**.
   - **Callback URL:** `https://travelvoo.in/api/webhooks/instagram` (or `https://www.travelvoo.in/api/webhooks/instagram`, depending on what you expect your main domain to be).
   - **Verify Token:** Create a strong, unique password-like string here (Example: `TravelVooBotSecureToken2026`). 
   - Click **Verify and Save**. (If this succeeds, your server is officially connected).
4. **Subscribe to Fields:** Once verified, scroll down the list of Webhook fields and hit **Subscribe** on the following:
   - `messages`
   - `comments`
   - `messaging_postbacks` (If you use buttons/quick replies in your flows).

## Step 4: Add Tester Accounts (Crucial for "Development Mode")
Because your app is brand new, it is currently in **Development Mode**. Meta aggressively blocks all webhooks if an incoming message is from a random account. **Only accounts listed as a "Tester" will trigger your webhook!**

1. In the left sidebar, go to **App Roles** -> **Roles**.
2. Scroll to the **Testers** section and click **Add Testers**.
3. Select **Instagram Tester**, type in the personal Instagram username you plan to send the test DMs/Comments *from*, and click Add.
4. **Important final step here:** Log into the Instagram mobile app with that personal test account, go to **Settings & Privacy -> Website permissions -> App and Website testers**, and **Accept** the tester invitation!

## Step 5: Update Your Platform Credentials
Now that the app and webhook are created, you must copy the credentials so your database can decrypt them and authenticate signatures.

1. In the left sidebar, go to **App Settings** -> **Basic**.
2. Note your **App ID** and **App Secret** (click "Show" and enter your Facebook password to view).
3. You need to securely input these into your backend (likely through your app's admin panel if the UI exists, or directly into your `saas_meta_platform_config` table):
   - `meta_app_id` = The App ID
   - `app_secret_encrypted` = The App Secret (You must encrypt it if inserting directly, or put it in your [.env.local](file:///d:/travel%20voo%20NEXT%20JS%20FULL%20APP/NEXT%20JS/.env.local) as `META_APP_SECRET=your_secret_here`).
   - `webhook_verify_token` = The Verify Token you created in Step 3.

## Step 6: Test!
1. Go back to your TravelVoo web application (`/admin/setup` or similar) and **Connect your Instagram Account** so the bot authorizes the new Meta App.
2. Go to your Instagram Automations dashboard, set a keyword rule (e.g., `price`).
3. Take out your phone, log into the **Personal Test Account** you added in Step 4.
4. Send a DM to your connected business page with the word "price".
5. The automation should reply instantly.

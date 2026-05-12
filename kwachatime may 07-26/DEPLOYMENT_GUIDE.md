# 🚀 KwachaTime Deployment & APK Guide

This guide contains the exact steps to move your application from this development environment to a live production site on **Netlify** and a functional **Android APK**.

---

## 1. Firebase Production Setup (CRITICAL)
Firebase will block all login attempts from your new Netlify URL unless you authorize it.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **`kwacha-timee`**.
3.  Navigate to **Authentication** > **Settings** > **Authorized Domains**.
4.  Click **Add Domain** and enter your Netlify URL (e.g., `your-app-name.netlify.app`).
5.  *Optional:* Also add `localhost` if you plan to run it on your own computer.

---

## 2. Netlify Deployment
When you upload your ZIP file to Netlify, you must configure the "Environment Variables" so the AI and Email systems work.

### Step-by-Step:
1.  Upload your ZIP to Netlify.
2.  Go to **Site Settings** > **Environment Variables**.
3.  Add the following keys and values:

| Key | Value |
| :--- | :--- |
| `VITE_GEMINI_API_KEY` | (Your Gemini API Key) |
| `VITE_RESEND_API_KEY` | `re_Rg3XgrJv_KqkuWRKBYLWb4CzG3AqdtGTz` |
| `VITE_GOOGLE_APPS_SCRIPT_URL` | `https://script.google.com/macros/s/ksOlAvl-QbyOoLoqv0kJl78UP-8KXmL8bRNYKoiEu_w/exec` |

4.  **Trigger a Re-deploy** after saving these variables.

---

## 3. Converting to APK (Median.co)
To ensure the app runs smoothly as an Android app, use these settings in Median:

*   **App URL:** Use your live Netlify URL.
*   **Permissions:** Ensure **Camera** and **Internet** permissions are requested (required for borrower photos and database sync).
*   **User Agent:** Use the default "Mobile Browser" user agent. Do not use a restricted "WebView" agent, as Google Login may block it.
*   **Persistence:** The app is configured with `browserLocalPersistence`, meaning users will stay logged in even if they close the app.

---

## 4. Administrator Access
The following emails are hardcoded as **System Administrators**. Once they log in via Google, they will automatically see the **Management Command Center**.

*   `naphtali.tre@gmail.com`
*   `ocmwila@networkit.info`
*   `pa@networkit.info`
*   `naphtali@networkit.info`

---

## 5. Troubleshooting
*   **Login fails on phone:** Ensure the domain is authorized in Firebase (Step 1).
*   **Emails not sending:** Check that the `VITE_RESEND_API_KEY` is correct in Netlify.
*   **AI Assessment not working:** Ensure `VITE_GEMINI_API_KEY` is set in Netlify.

---
*Generated on April 10, 2026 | KwachaTime Micro-Lending Systems*

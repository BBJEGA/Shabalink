
# 🎨 Branding Your Emails in Supabase

To fix the "Supabase Auth" sender name and make the email look professional, follow these steps in your **Supabase Dashboard**.

## 1. Change Sender Name (Important!)
1.  Go to **Authentication** (icon on left sidebar).
2.  Click **Providers** > **Email**.
3.  Scroll down to **SMTP Settings** (or just "Sender Configuration" if using default).
4.  **Sender Email**: Try to use `noreply@shabalink.com` (note: for high deliverability, you eventually need a custom SMTP like SendGrid/Resend, but for now just change the name).
5.  **Sender Name**: Change "Supabase Auth" to **Shabalink**.

## 2. Customize the "Confirm Email" Template
1.  Go to **Authentication** > **Email Templates**.
2.  Click on **Confirm Your Signup**.
3.  **Subject**: Change to `Welcome to Shabalink! Confirm your account`.
4.  **Body**: Replace the content with this HTML template:

```html
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fdbd5e; border-radius: 10px;">
  <h2 style="color: #4f46e5; text-align: center;">Welcome to Shabalink! 🚀</h2>
  <p style="color: #374151; font-size: 16px;">
    Hi there,
  </p>
  <p style="color: #374151; font-size: 16px;">
    Thanks for joining Shabalink, your go-to platform for affordable VTU services. 
    Please confirm your email address to activate your wallet and start transacting.
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" 
       style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
       Confirm My Account
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    If you didn't create this account, please ignore this email.
  </p>
</div>
```

## 3. Fix "Confirm Email Not Working"
If clicking the link doesn't log you in or go to the dashboard:
1.  Go to **Authentication** > **URL Configuration**.
2.  **Site URL**: Set this to your Vercel URL (e.g., `https://shabalink.vercel.app`).
3.  **Redirect URLs**: Add the following:
    *   `https://shabalink.vercel.app/auth/callback`
    *   `https://shabalink.vercel.app`
    *   `http://localhost:3000/auth/callback` (for local testing)

This ensures Supabase allows the user to be redirected back to your app after clicking the link.

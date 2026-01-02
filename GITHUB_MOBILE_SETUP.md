# GitHub Mobile Verification Guide

This guide will help you verify your GitHub account with the GitHub Mobile app and obtain verification codes.

## What is GitHub Mobile Verification?

GitHub Mobile allows you to manage your GitHub account from your mobile device. When you enable two-factor authentication (2FA) or need to verify your identity, you'll need verification codes.

## Getting Verification Codes

There are several ways to get verification codes for GitHub:

### Method 1: Using GitHub Mobile App

1. **Download GitHub Mobile**
   - iOS: Download from the [App Store](https://apps.apple.com/app/github/id1477376905)
   - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=com.github.android)

2. **Sign in to the App**
   - Open the GitHub Mobile app
   - Tap "Sign in"
   - Enter your GitHub username and password
   - If you have 2FA enabled, you'll need to enter a code (see below methods)

3. **Access Verification Codes**
   - Once signed in, the app can generate verification codes
   - Go to Settings → Account → Two-factor authentication
   - Use the generated codes when signing in on other devices

### Method 2: Using Authenticator App (Recommended)

1. **Set up 2FA with an Authenticator App**
   - Go to GitHub.com → Settings → Password and authentication
   - Click "Enable two-factor authentication"
   - Choose "Set up using an app"
   - Scan the QR code with an authenticator app like:
     - Google Authenticator
     - Microsoft Authenticator
     - Authy
     - 1Password

2. **Get Your Code**
   - Open your authenticator app
   - Find the GitHub entry
   - Use the 6-digit code that refreshes every 30 seconds

### Method 3: Using SMS Text Messages

1. **Set up SMS as a 2FA Method**
   - Go to GitHub.com → Settings → Password and authentication
   - Enable two-factor authentication
   - Choose "Set up using SMS"
   - Enter your phone number
   - Verify the number with the code sent to you

2. **Get Your Code**
   - When logging in, choose "Text me a code"
   - Enter the code sent to your phone

### Method 4: Using Recovery Codes

When you first enable 2FA, GitHub provides recovery codes:

1. **Save Your Recovery Codes**
   - Download and save them securely
   - Store them in a password manager or safe location
   - Each code can only be used once

2. **Use a Recovery Code**
   - If you can't access your authenticator app or phone
   - Use one of your saved recovery codes to sign in
   - Generate new recovery codes after using them

## First-Time Setup for GitHub Mobile

If you're setting up GitHub Mobile for the first time:

1. **Enable Two-Factor Authentication First**
   - Go to https://github.com/settings/security
   - Click "Enable two-factor authentication"
   - Follow the setup wizard
   - Save your recovery codes!

2. **Install GitHub Mobile**
   - Download the app from your device's app store
   - Open the app and sign in with your GitHub credentials

3. **Verify Your Device**
   - Enter the 2FA code from your authenticator app
   - The GitHub Mobile app is now verified and can be used to access your account

## Troubleshooting

### "I don't have access to my verification codes"

- **Use recovery codes**: Enter one of your saved recovery codes
- **Use SMS**: If you set up SMS, request a code via text message
- **Contact GitHub Support**: If you've lost access to all 2FA methods, contact GitHub support at https://support.github.com/

### "The app won't accept my verification code"

- Make sure your device's time is correct (authenticator apps are time-based)
- Wait for a new code to generate (codes refresh every 30 seconds)
- Check that you're entering the code for the correct account

### "I lost my recovery codes"

- Sign in to GitHub.com with your current 2FA method
- Go to Settings → Password and authentication
- Generate new recovery codes
- Save them securely this time!

## Security Best Practices

1. **Use an authenticator app** instead of SMS when possible (more secure)
2. **Save your recovery codes** in a secure location
3. **Don't share verification codes** with anyone
4. **Keep your backup methods updated** (phone number, recovery codes)
5. **Review your security settings** regularly at https://github.com/settings/security

## Need More Help?

- GitHub's official 2FA documentation: https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa
- GitHub Support: https://support.github.com/
- GitHub Mobile documentation: https://docs.github.com/en/get-started/using-github/github-mobile

---

**Note**: This guide is for GitHub account verification and is not specific to the Snake game repository. If you're a contributor to this project and need help with repository access, please reach out to the repository maintainers.

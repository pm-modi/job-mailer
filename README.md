# JobMailer

JobMailer is a lightweight PHP + JavaScript app for sending job application emails through Gmail SMTP.

It lets a user:
- add their own Gmail + App Password
- attach a PDF resume
- write the email manually or rewrite it with AI
- import company emails with JSON
- send the same reviewed subject/body to all selected companies

## Features

- Gmail SMTP sending with PHPMailer
- AI rewrite flow for subject/body editing
- PDF resume attachment
- Company list with manual add and JSON import
- Bulk sending with delay control
- Browser-based UI

## Project Structure

```text
job-mail/
|- index.html
|- css/style.css
|- js/app.js
|- js/companies.js
|- php/sendmail.php
|- php/ai-proxy.php
|- composer.json
|- vendor/
```

## Requirements

- PHP 8+
- Composer
- Gmail account with App Password enabled
- Web server or local PHP server

## Local Setup

1. Install dependencies:

```bash
composer install
```

2. Set your AI API key as an environment variable:

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
```

3. Start the local PHP server:

```bash
php -S localhost:8080
```

4. Open:

```text
http://localhost:8080
```

## How To Use

1. Open the `Setup` tab.
2. Enter Gmail address, Gmail App Password, your name, and optionally a PDF resume.
3. In `AI Writer`, write or rewrite the email content.
4. Add companies manually or import them with JSON.
5. Select the target companies.
6. Click `SEND ALL EMAILS NOW`.

The app sends the current subject and current email body visible in the editor. It does not auto-send an old hardcoded template anymore.

## JSON Import Format

```json
[
  { "name": "Company One", "email": "hr@companyone.com", "type": "startup" },
  { "name": "Company Two", "email": "jobs@companytwo.com", "type": "product" }
]
```

## AI Key Notes

- Do not commit real API keys to GitHub.
- `php/ai-proxy.php` now expects `GROQ_API_KEY` from the environment.
- If the key is missing, AI rewrite requests will fail until the environment variable is set.

## Gmail Notes

- Use a Gmail App Password, not your normal Gmail password.
- Keep a sending delay to reduce delivery risk.
- Test with your own email first before sending to a larger list.

## Troubleshooting

- `PHPMailer not found`
  Run `composer install`

- `Authentication failed`
  Check Gmail App Password and verify 2-step verification is enabled

- `AI key missing`
  Set `GROQ_API_KEY` before starting the app

- `CORS` or fetch issue
  Run the app through `php -S localhost:8080` instead of opening `index.html` directly with `file://`

## GitHub Safety

This project can be prepared for GitHub, but a real API key must never remain inside tracked files.

If you want, the next step can be:
1. add a `.gitignore`
2. initialize git
3. prepare the first commit
4. tell you the exact GitHub push commands

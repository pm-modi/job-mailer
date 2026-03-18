# JobMailer

JobMailer is a lightweight PHP + JavaScript app for sending job application emails through Gmail SMTP.

It lets a user:
- add their own Gmail + App Password
- attach a PDF resume
- write the email manually or rewrite it with AI
- import company emails with JSON
- send the same reviewed subject/body to all selected companies
- persist sender profile, company list, and send logs on the backend

## Features

- Gmail SMTP sending with PHPMailer
- AI rewrite flow for subject/body editing
- PDF resume attachment
- Company list with manual add and JSON import
- Bulk sending with delay control
- Browser-based UI
- Simple backend persistence with JSON file storage

## Project Structure

```text
job-mail/
|- index.html
|- css/style.css
|- js/app.js
|- js/companies.js
|- php/sendmail.php
|- php/ai-proxy.php
|- php/state.php
|- php/save-profile.php
|- php/save-companies.php
|- php/log-send.php
|- composer.json
|- vendor/
|- data/runtime/storage.json
```

## Requirements

- PHP 8+
- Composer
- Gmail account with App Password enabled
- Web server or local PHP server
- Write access to `data/runtime/`

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

## Backend Storage

The backend stores:
- sender email and sender name
- current company list
- send logs with recipient, subject, status, and timestamp

The Gmail App Password is not stored in backend storage.

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

## Deployment

This project is easiest to deploy on a container-friendly host because it already includes a `Dockerfile`.

Recommended option:
- Railway

Why Railway:
- simple Docker deploy
- free HTTPS on Railway domains
- custom domain support with SSL
- supports attached volumes for persistent file storage

Important:
- the backend storage file must live on persistent storage in production
- on Railway, attach a volume and mount it for the `data/runtime/` directory
- set `GROQ_API_KEY` as an environment variable in the host dashboard

Deployment checklist:
1. push the repo to GitHub
2. create a Railway project from the GitHub repo
3. add `GROQ_API_KEY` in Railway variables
4. attach persistent storage for `data/runtime/`
5. deploy and use the generated HTTPS domain

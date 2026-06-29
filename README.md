# OldTech Telegram Bot

Railway-ready Telegram bot for the OldTech medical equipment website:

https://v1old.vercel.app/

The bot is built as a separate backend service. It does not require changes to the website repo.

## Features

- RU / EN language selection
- Medical catalog matching the website categories
- Product detail screens with practical specifications
- Add / remove equipment quantities
- Request summary
- Required personal-data consent before lead collection
- Lead collection flow: name, organization, phone, email, comment
- Admin notification to Telegram
- Website button that opens `https://v1old.vercel.app/`
- Railway-ready long-polling deployment

## Project structure

```txt
oldtech-telegram-bot/
  src/
    bot.ts
    i18n.ts
    products.ts
  .env.example
  .gitignore
  package.json
  railway.json
  tsconfig.json
```

## Local setup

Install dependencies:

```bash
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Fill `.env`:

```env
BOT_TOKEN=your_new_token_from_botfather
ADMIN_CHAT_ID=864200186
WEBSITE_URL=https://v1old.vercel.app/
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## Railway deployment

1. Upload this project to a new GitHub repository.
2. Open Railway.
3. Create **New Project**.
4. Choose **Deploy from GitHub repo**.
5. Select this bot repository.
6. Go to **Variables** and add:

```env
BOT_TOKEN=your_new_token_from_botfather
ADMIN_CHAT_ID=864200186
WEBSITE_URL=https://v1old.vercel.app/
```

7. Deploy.

Railway will run:

```bash
npm run build
npm run start
```

The bot uses long polling, so you do not need a webhook URL.

## Important security note

Never commit your real `BOT_TOKEN` to GitHub. Add the real token only in Railway Variables or a local `.env` file.

If a token is ever posted publicly, revoke it in @BotFather and create a new one.

## Commands

- `/start` — language selection and main menu
- `/catalog` — product catalog
- `/request` — current request/cart
- `/clear` — clear request/cart
- `/help` — help and website link

## Editing products

Edit `src/products.ts` to add or change catalog items. Each product has:

```ts
{
  id: "ct-64",
  category: "КТ / CT",
  ruName: "Компьютерный томограф 64 среза",
  enName: "64-slice CT scanner",
  ruDesc: "...",
  enDesc: "...",
  maker: "GE / Siemens / Canon",
  specs: ["64 slices", "DICOM / PACS"]
}
```

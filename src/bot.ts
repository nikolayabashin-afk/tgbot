import "dotenv/config";
import { Markup, Telegraf, type Context } from "telegraf";
import { dictionary } from "./i18n.js";
import { getProduct, productDescription, productName, products, type Lang } from "./products.js";

type LeadStep = "idle" | "name" | "company" | "phone" | "email" | "comment";

type Session = {
  lang: Lang;
  cart: Record<string, number>;
  step: LeadStep;
  lead: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    comment?: string;
  };
};

const botToken = process.env.BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;
const websiteUrl = process.env.WEBSITE_URL || "https://v1old.vercel.app/";

if (!botToken) {
  throw new Error("BOT_TOKEN is missing. Add it in Railway Variables or local .env.");
}

if (!adminChatId) {
  throw new Error("ADMIN_CHAT_ID is missing. Add it in Railway Variables or local .env.");
}

const bot = new Telegraf(botToken);
const sessions = new Map<number, Session>();

function getSession(ctx: Context): Session {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    return { lang: "ru", cart: {}, step: "idle", lead: {} };
  }

  const existing = sessions.get(chatId);
  if (existing) return existing;

  const session: Session = {
    lang: "ru",
    cart: {},
    step: "idle",
    lead: {},
  };
  sessions.set(chatId, session);
  return session;
}

function cartCount(session: Session): number {
  return Object.values(session.cart).reduce((sum, qty) => sum + qty, 0);
}

function mainMenuKeyboard(lang: Lang) {
  const t = dictionary[lang];
  return Markup.inlineKeyboard([
    [Markup.button.callback(`🩺 ${t.catalog}`, "catalog")],
    [Markup.button.callback(`🧾 ${t.request}`, "request"), Markup.button.url(`🌐 ${t.website}`, websiteUrl)],
    [Markup.button.callback(`🌍 ${t.lang}`, "language"), Markup.button.callback(`❔ ${t.help}`, "help")],
  ]);
}

function languageKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Русский", "set_lang:ru"), Markup.button.callback("English", "set_lang:en")],
  ]);
}

function catalogKeyboard(lang: Lang) {
  return Markup.inlineKeyboard([
    ...products.map((product) => [
      Markup.button.callback(`${product.category} · ${productName(product, lang)}`, `product:${product.id}`),
    ]),
    [Markup.button.callback(`⬅️ ${dictionary[lang].mainMenu}`, "menu")],
  ]);
}

function productKeyboard(productId: string, lang: Lang) {
  const t = dictionary[lang];
  return Markup.inlineKeyboard([
    [Markup.button.callback(`➕ ${t.add}`, `add:${productId}`)],
    [Markup.button.callback(`➖ ${t.remove}`, `remove:${productId}`)],
    [Markup.button.callback(`🧾 ${t.request}`, "request"), Markup.button.callback(`⬅️ ${t.back}`, "catalog")],
  ]);
}

function requestKeyboard(lang: Lang, canSubmit: boolean) {
  const t = dictionary[lang];
  const rows = [];
  if (canSubmit) rows.push([Markup.button.callback(`✅ ${t.startLead}`, "lead:start")]);
  rows.push([Markup.button.callback(`🗑 ${t.clear}`, "clear")]);
  rows.push([Markup.button.callback(`🩺 ${t.catalog}`, "catalog"), Markup.button.callback(`⬅️ ${t.mainMenu}`, "menu")]);
  return Markup.inlineKeyboard(rows);
}

function consentKeyboard(lang: Lang) {
  const t = dictionary[lang];
  return Markup.inlineKeyboard([
    [Markup.button.callback(`✅ ${t.agree}`, "consent:yes")],
    [Markup.button.callback(`⬅️ ${t.decline}`, "consent:no")],
  ]);
}

function formatProduct(productId: string, lang: Lang): string {
  const product = getProduct(productId);
  const t = dictionary[lang];
  if (!product) return t.notFound;

  return [
    `*${escapeMarkdown(productName(product, lang))}*`,
    `_${escapeMarkdown(product.category)}_`,
    "",
    escapeMarkdown(productDescription(product, lang)),
    "",
    `*${escapeMarkdown(t.makers)}:* ${escapeMarkdown(product.maker)}`,
    `*${escapeMarkdown(t.specs)}:* ${product.specs.map(escapeMarkdown).join(", ")}`,
  ].join("\n");
}

function formatCart(session: Session): string {
  const t = dictionary[session.lang];
  const rows = Object.entries(session.cart)
    .map(([productId, qty]) => {
      const product = getProduct(productId);
      if (!product) return null;
      return `• ${escapeMarkdown(productName(product, session.lang))} — ${escapeMarkdown(t.quantity)}: ${qty}`;
    })
    .filter(Boolean);

  if (rows.length === 0) return t.emptyRequest;
  return [`*${escapeMarkdown(t.requestTitle)}*`, "", ...rows].join("\n");
}

function formatAdminLead(session: Session, ctx: Context): string {
  const t = dictionary[session.lang];
  const from = ctx.from;
  const username = from?.username ? `@${from.username}` : "—";
  const cartRows = Object.entries(session.cart)
    .map(([productId, qty]) => {
      const product = getProduct(productId);
      if (!product) return null;
      return `• ${productName(product, session.lang)} — ${qty}`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    `🆕 ${t.adminNew}`,
    "",
    `Language: ${session.lang.toUpperCase()}`,
    `Telegram: ${username}`,
    `Telegram ID: ${from?.id ?? "—"}`,
    "",
    `Name: ${session.lead.name || "—"}`,
    `Organization: ${session.lead.company || "—"}`,
    `Phone: ${session.lead.phone || "—"}`,
    `Email: ${session.lead.email || "—"}`,
    "",
    `Equipment:\n${cartRows || "—"}`,
    "",
    `Comment:\n${session.lead.comment || "—"}`,
    "",
    `Website: ${websiteUrl}`,
  ].join("\n");
}

function escapeMarkdown(value: string): string {
  return value.replace(/([_\\*\[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

async function showMenu(ctx: Context) {
  const session = getSession(ctx);
  const t = dictionary[session.lang];
  await ctx.reply(
    `*${escapeMarkdown(t.welcomeTitle)}*\n\n${escapeMarkdown(t.welcomeText)}\n\n${escapeMarkdown(t.menu)}:`,
    { parse_mode: "MarkdownV2", ...mainMenuKeyboard(session.lang) }
  );
}

async function showCatalog(ctx: Context) {
  const session = getSession(ctx);
  await ctx.reply(dictionary[session.lang].catalog, catalogKeyboard(session.lang));
}

async function showRequest(ctx: Context) {
  const session = getSession(ctx);
  await ctx.reply(formatCart(session), {
    parse_mode: "MarkdownV2",
    ...requestKeyboard(session.lang, cartCount(session) > 0),
  });
}

bot.start(async (ctx) => {
  const session = getSession(ctx);
  session.step = "idle";
  await ctx.reply(
    `${dictionary[session.lang].chooseLanguage}`,
    languageKeyboard()
  );
});

bot.command("catalog", showCatalog);
bot.command("request", showRequest);
bot.command("clear", async (ctx) => {
  const session = getSession(ctx);
  session.cart = {};
  session.step = "idle";
  session.lead = {};
  await ctx.reply(dictionary[session.lang].cleared, mainMenuKeyboard(session.lang));
});
bot.command("help", async (ctx) => {
  const session = getSession(ctx);
  await ctx.reply(dictionary[session.lang].helpText.replace("{website}", websiteUrl), mainMenuKeyboard(session.lang));
});

bot.action("language", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(dictionary[getSession(ctx).lang].chooseLanguage, languageKeyboard());
});

bot.action(/^set_lang:(ru|en)$/, async (ctx) => {
  const session = getSession(ctx);
  session.lang = ctx.match[1] as Lang;
  session.step = "idle";
  await ctx.answerCbQuery(session.lang === "ru" ? "Русский" : "English");
  await showMenu(ctx);
});

bot.action("menu", async (ctx) => {
  await ctx.answerCbQuery();
  await showMenu(ctx);
});

bot.action("catalog", async (ctx) => {
  await ctx.answerCbQuery();
  await showCatalog(ctx);
});

bot.action("help", async (ctx) => {
  const session = getSession(ctx);
  await ctx.answerCbQuery();
  await ctx.reply(dictionary[session.lang].helpText.replace("{website}", websiteUrl), mainMenuKeyboard(session.lang));
});

bot.action(/^product:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const session = getSession(ctx);
  await ctx.answerCbQuery();
  await ctx.reply(formatProduct(productId, session.lang), {
    parse_mode: "MarkdownV2",
    ...productKeyboard(productId, session.lang),
  });
});

bot.action(/^add:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const session = getSession(ctx);
  const product = getProduct(productId);
  if (!product) {
    await ctx.answerCbQuery(dictionary[session.lang].notFound);
    return;
  }
  session.cart[productId] = (session.cart[productId] || 0) + 1;
  await ctx.answerCbQuery(`${dictionary[session.lang].added}: ${productName(product, session.lang)}`);
  await showRequest(ctx);
});

bot.action(/^remove:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const session = getSession(ctx);
  const product = getProduct(productId);
  if (!product || !session.cart[productId]) {
    await ctx.answerCbQuery(dictionary[session.lang].notFound);
    return;
  }
  session.cart[productId] -= 1;
  if (session.cart[productId] <= 0) delete session.cart[productId];
  await ctx.answerCbQuery(`${dictionary[session.lang].removed}: ${productName(product, session.lang)}`);
  await showRequest(ctx);
});

bot.action("request", async (ctx) => {
  await ctx.answerCbQuery();
  await showRequest(ctx);
});

bot.action("clear", async (ctx) => {
  const session = getSession(ctx);
  session.cart = {};
  session.step = "idle";
  session.lead = {};
  await ctx.answerCbQuery(dictionary[session.lang].cleared);
  await ctx.reply(dictionary[session.lang].cleared, mainMenuKeyboard(session.lang));
});

bot.action("lead:start", async (ctx) => {
  const session = getSession(ctx);
  await ctx.answerCbQuery();
  if (cartCount(session) === 0) {
    await ctx.reply(dictionary[session.lang].emptyRequest, catalogKeyboard(session.lang));
    return;
  }
  session.step = "idle";
  session.lead = {};
  await ctx.reply(dictionary[session.lang].consent, consentKeyboard(session.lang));
});

bot.action("consent:no", async (ctx) => {
  const session = getSession(ctx);
  session.step = "idle";
  await ctx.answerCbQuery();
  await ctx.reply(dictionary[session.lang].declined, mainMenuKeyboard(session.lang));
});

bot.action("consent:yes", async (ctx) => {
  const session = getSession(ctx);
  session.step = "name";
  session.lead = {};
  await ctx.answerCbQuery();
  await ctx.reply(dictionary[session.lang].askName);
});

bot.on("text", async (ctx) => {
  const session = getSession(ctx);
  const text = ctx.message.text.trim();
  const t = dictionary[session.lang];

  if (session.step === "idle") {
    await ctx.reply(t.menu, mainMenuKeyboard(session.lang));
    return;
  }

  if (session.step === "name") {
    session.lead.name = text;
    session.step = "company";
    await ctx.reply(t.askCompany);
    return;
  }

  if (session.step === "company") {
    session.lead.company = text;
    session.step = "phone";
    await ctx.reply(t.askPhone);
    return;
  }

  if (session.step === "phone") {
    session.lead.phone = text;
    session.step = "email";
    await ctx.reply(t.askEmail);
    return;
  }

  if (session.step === "email") {
    session.lead.email = text;
    session.step = "comment";
    await ctx.reply(t.askComment);
    return;
  }

  if (session.step === "comment") {
    session.lead.comment = text === "-" ? "" : text;
    session.step = "idle";
    await bot.telegram.sendMessage(adminChatId, formatAdminLead(session, ctx));
    await ctx.reply(t.sent, mainMenuKeyboard(session.lang));
  }
});

bot.catch((error, ctx) => {
  console.error("Bot error", { error, update: ctx.update });
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

void bot.launch().then(() => {
  console.log("OldTech Telegram bot is running with long polling.");
});

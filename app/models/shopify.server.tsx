import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";
import prisma from "../db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      console.log("✅ afterAuth hook - saving session:", session.shop);
      await shopify.registerWebhooks({ session });
    },
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
    unstable_newEmbeddedAuthStrategy: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;

/**
 * ✅ Safe login wrapper: checks Shopify cookie session, then DB.
 */
export async function login(request: Request) {
  try {
    // 1️⃣ Try to get active Shopify session from cookies
    const result = await shopify.login(request);
    if (result?.session) {
      console.log("✅ Found active Shopify session from cookie:", result.session.shop);
      return { session: result.session, redirectUrl: result.redirectUrl, error: null };
    }

    // 2️⃣ No active cookie session → fallback to DB lookup
    console.log("🔍 No active session cookie found, checking DB...");
    const existingSessions = await prisma.session.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log("🗂 Sessions in DB:", existingSessions);

    if (existingSessions.length > 0) {
      const latestSession = existingSessions[0];
      console.log("✅ Found session in DB:", latestSession.shop);

      return {
        session: latestSession,
        redirectUrl: "/app/settings",
        error: null,
      };
    }

    console.warn("⚠️ No session found in DB");
    return { session: null, redirectUrl: null, error: "No active session found" };
  } catch (err: any) {
    console.error("❌ Shopify login failed:", err.message || err);
    return { session: null, redirectUrl: null, error: "Login failed" };
  }
}

export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

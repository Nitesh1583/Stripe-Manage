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
 * ✅ Safe login wrapper:
 * - Reads Shopify token (if inside admin)
 * - Finds matching session in DB
 */
export async function login(request: Request) {
  try {
    // 1️⃣ Try to get active session via Shopify cookies
    const result = await shopify.login(request);
    if (result?.session) {
      console.log("✅ Found active session from cookie:", result.session.shop);
      return { session: result.session, redirectUrl: result.redirectUrl, error: null };
    }

    // 2️⃣ If no session cookie, decode public token to get shop name
    try {
      const auth = await shopify.authenticate.public(request);
      if (auth?.session?.shop) {
        console.log("🔑 Extracted shop from JWT:", auth.session.shop);

        // 3️⃣ Look up session in DB by shop name
        const dbSession = await prisma.session.findFirst({
          where: { shop: auth.session.shop },
          orderBy: { createdAt: "desc" },
        });

        if (dbSession) {
          console.log("✅ Found session in DB for shop:", dbSession.shop);
          return { session: dbSession, redirectUrl: "/app/settings", error: null };
        }
      }
    } catch (err) {
      console.warn("⚠️ No valid public token found in request:", err.message || err);
    }

    console.warn("⚠️ No session found (cookie or DB)");
    return { session: null, redirectUrl: null, error: "No active session found" };
  } catch (err: any) {
    console.error("❌ Shopify login failed:", err.message || err);
    return { session: null, redirectUrl: null, error: "Login failed" };
  }
}

export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

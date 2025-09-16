// app/models/shopify.server.tsx
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
      console.log("afterAuth hook - session.shop:", session?.shop);
      try {
        await shopify.registerWebhooks({ session });
      } catch (err) {
        console.warn("registerWebhooks failed:", err);
      }
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
 * Safe login wrapper:
 * - Try shopify.login(request) (cookie/session)
 * - If none, fallback to session table in DB (prisma.session)
 * - Returns consistent shape: { session, redirectUrl, error }
 */
export async function login(request: Request) {
  try {
    // 1) Try the library login (reads cookies / oauth callback)
    const result = await shopify.login(request);

    if (result?.session) {
      // result.session may be an object from shopify library
      console.log("shopify.login() returned session:", result.session?.shop);
      return {
        session: result.session,
        redirectUrl: result.redirectUrl || null,
        error: null,
      };
    }

    // 2) Fallback: check session table in DB for any stored session
    // Note: your Session model (in schema.prisma) does not appear to have createdAt,
    // so we'll findFirst — if you have multiple shops you'll want to filter by shop.
    console.log("No session cookie. Checking prisma.session table for any session...");

    const dbSession = await prisma.session.findFirst();

    console.log(" prisma.session.findFirst() ->", dbSession);

    if (dbSession && dbSession.shop) {
      // return the DB session row; loader will read dbSession.shop and upsert user
      return {
        session: dbSession,
        redirectUrl: "/app/settings",
        error: null,
      };
    }

    // nothing found
    return { session: null, redirectUrl: null, error: "No active session found" };
  } catch (err: any) {
    console.error("shopify.login() threw:", err?.message ?? err);
    return { session: null, redirectUrl: null, error: "Login failed" };
  }
}

export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

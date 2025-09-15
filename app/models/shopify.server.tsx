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
 * ✅ Safe login wrapper: returns {session, redirectUrl, error?}
 */
export async function login(request: Request) {
  try {
    const result = await shopify.login(request);

    // If cookie/session is valid, return it
    if (result?.session) {
      return { session: result.session, redirectUrl: result.redirectUrl, error: null };
    }

    /**
     * ✅ Fallback: Manually check DB by extracting shop param
     */
    const url = new URL(request.url);
    const shopParam = url.searchParams.get("shop");
    if (shopParam) {
      const dbSession = await prisma.session.findFirst({
        where: { shop: shopParam },
      });

      if (dbSession) {
        console.log("✅ Found session in DB for shop:", shopParam);
        return { session: dbSession, redirectUrl: "/app/settings", error: null };
      }
    }

    return { session: null, redirectUrl: null, error: "No active session found" };
  } catch (err: any) {
    console.error("❌ Shopify login failed:", err.message || err);
    return { session: null, redirectUrl: null, error: "Login failed" };
  }
}

export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

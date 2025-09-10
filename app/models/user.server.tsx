import db from "../db.server";
import { redirect } from '@remix-run/node';
 
//create shopify stripe app user

export async function createUser(formData, shop){
  try {
    const formInput = Object.fromEntries(formData);
    const email = formInput["email"];
    const stripePublishKey = null;
    const stripeSecretKey = formInput["stripeSecretKey"];
    const errors = {};
    const stripepublishKeyRegex = /^pk_(test|live)_/;
    const stripesecretKeyRegex = /^(sk_test|sk_live)_/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Email
    if (!emailRegex || !emailRegex.test(email)) {
      errors.email = "Please enter a valid Email Address";
    }
    // Validate Stripe publishable key
    // if (!stripePublishKey || !stripepublishKeyRegex.test(stripePublishKey)) {
    //   errors.stripePublishKey = "Please enter a valid Stripe publishable key";
    // }

    // Validate Stripe secret key
    if (!stripeSecretKey || !stripesecretKeyRegex.test(stripeSecretKey)) {
      errors.stripeSecretKey = "Please enter a valid Stripe secret key";
    }

    if (Object.keys(errors).length > 0) {
      return { errors, message: "Fill correct all field correctly", isError: true };
    }
    const existingEmail = await db.user.findFirst({ where: { email: email } })
    if (existingEmail) {
      return { message: "Email already registred!", errors, isError: true };
    }
    const existingUser = await db.user.findFirst({ where: { shop: shop } })
    if (existingUser) {
      return { message: "User already registred!", errors, isError: true };
    }
    else {
      const user = await db.user.create({
        data: {
          shop: shop,
          email: email,
          stripePublishKey: stripePublishKey,
          stripeSecretKey: stripeSecretKey
        }
      })
      return { message: "User created successfully", errors, user: user };
    }
  } catch (error) {
    return { message: "Unable to create account", error };
  }
}

//update shopify stripe app user

export async function updateUserAccountSetting(formData, shop){
  try {
    const formInput = Object.fromEntries(formData);
    const email = formInput["email"];

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      return { errors, message: "Fill all fields correctly", isError: true };
    }

    const existingUser = await db.user.findFirst({ where: { email: email } });
    if (existingUser) {
      return { message: "Email already registred", isError: true };
    }
    const existingShop = await db.user.findFirst({ where: { shop: shop } });

    if (existingShop == null) {
      await db.user.upsert({
        where: { shop: shop },
        update: { email: email },
        create: {
          shop: shop, email: email,
          // stripePublishKey: existingShop.stripePublishKey, stripeSecretKey: existingShop.stripeSecretKey
        }
      });
      return { message: "Email saved successfully!", isError: false };
    }
    else {
      await db.user.upsert({
        where: { shop: shop },
        update: { email: email },
        create: {
          shop: shop, email: email,
          // stripePublishKey: existingShop.stripePublishKey, stripeSecretKey: existingShop.stripeSecretKey
        }
      });
      return { message: "User info updated", isError: false };
    }

  } catch (error) {
    return { message: `Unable to update account info ${error.message}`, isError: true };
    // return { message: `${shop}`, isError: true };
  }
}

//update shopify stripe app user
export async function updateUserStripeSetting(formData, shop) {
  try {
    const formInput = Object.fromEntries(formData);
    const stripePublishKey = null;
    const stripeSecretKey = formInput["stripeSecretKey"];
    const errors = {};
    const stripesecretKeyRegex = /^(sk_test|sk_live)_/;

    if (!stripeSecretKey || !stripesecretKeyRegex.test(stripeSecretKey)) {
      errors.stripeSecretKey = "Please enter a valid Stripe secret key";
    }

    if (Object.keys(errors).length > 0) {
      return { errors, message: "Fill correct all field correctly", isError: true };
    }

    // Check if user already had a key or this is first time saving
    const existingUser = await db.user.findFirst({ where: { shop: shop } });
    // const isFirstTime = !existingUser?.stripeSecretKey;
    const isFirstTime = existingUser.premiumUser;

    await db.user.update({
      where: { shop: shop },
      data: {
        stripePublishKey: stripePublishKey,
        stripeSecretKey: stripeSecretKey,
      },
    });

    if (isFirstTime == 0) {
      return redirect('https://admin.shopify.com/store/'+shop.split(".")[0]+'/charges/stripe-manage/pricing_plans');
    }
    if (isFirstTime == 1 || isFirstTime == 2) {
      return {
        message: "Stripe apikeys updated",
        errors,
        isError: false,
        redirectToPricing: isFirstTime, //  return for redirect
      };
    }

  } catch (error) {
    return { message: "Unable to stripe apikeys", error, isError: true };
  }
}

export async function saveShopifyChargeId(shop: string, chargeId: string) {
  try {
    // Create/Update subscription table
    const subscriptionUserData = await db.subscriptionUser.upsert({
      where: { subscription_id: chargeId },
      update: {
        subscription_status: "active",
        created_date: new Date(), // updating with today's date
        sub_update_date: new Date().toISOString(),
      },
      create: {
        shop_url: shop,
        subscription_id: chargeId,
        created_date: new Date(),
        subscription_status: "active",
      },
    });

    // Update or create User table
    const updatedUser = await db.user.upsert({
      where: { shop },
      update: { 
        shopifyChargeId: chargeId,
        premiumUser: 1, // mark user as premium
        subCount:1,
        updatedAt: new Date(),
      },
      create: {
        shop,
        shopifyChargeId: chargeId,
        premiumUser: 0,
        subCount: 0
      },
    });

    return { 
      message: "Charge ID saved successfully", 
      user: updatedUser, 
      subscription: subscriptionUserData, 
      isError: false 
    };
  } catch (error: any) {
    return { message: `Unable to save charge ID: ${error.message}`, isError: true };
  }
}




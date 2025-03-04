import { Stripe } from 'stripe';
import db from "../db.server"
// Route to handle subscription creation
export async function buyPremiumMemberShip(shop, paymentMethod) {
  try {
    // Create a new Stripe customer
    const userInfo = await db.user.findFirst({
      where:{
        shop:shop
      }
    });
    const email=userInfo.email;
    const adminData = await db.admin.findFirst();
    const stripe = new Stripe(adminData.stripeSecretKey);
    if (!stripe) {
      return { message: "Internal Server issue. Try again later..", isError: true };
    }
    const customer = await stripe.customers.create({
      email,
      payment_method: paymentMethod,
      invoice_settings: {
        default_payment_method: paymentMethod
      }
    });

    // Create a new Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        { price: 'your_stripe_price_id' }
      ],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    return({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    return({ error: error.message });
  }
}

export async function cancelPremiumMemberShip(req, res) {
  const { subscriptionId } = req.body;

  try {
    const adminData = await db.admin.findFirst();
    const stripe = new Stripe(adminData.stripeSecretKey);
    await stripe.subscriptions.del(subscriptionId);
    return { message: 'Subscription cancelled',isError:false };
  } catch (error) {
    return { message: 'Internal server error',isError:false,error:error.message };
  }
};

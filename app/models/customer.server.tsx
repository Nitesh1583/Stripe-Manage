import { Stripe } from "stripe";
import db from "../db.server";

//Create Customer Message 
export async function createStripeCustomer(){
  try {
    return { message: "Customer created successfully",isError: false };
  } catch (error) {
    return { message: "Unable to create customer",isError: true };
  }
}

export async function fetchStripeCustomers(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const customers = await stripe.customers.list();
    const data = customers.data;
    let  customerData = [];
    let paymentMethod = '';
    let cardlast4 = '';
    let cardbrand = '';
    const existingShop = await db.SubscriptionUser.findFirst({ 
      where: { 
        shop_url: userInfo.shop, 
        sub_cancel_date: null 
      }
    }); 

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if(element.invoice_settings.default_payment_method != null) {
        paymentMethod = await stripe.paymentMethods.retrieve(element.invoice_settings.default_payment_method);
      }

      if (paymentMethod) {

        if(paymentMethod.card) {
          cardlast4= paymentMethod.card.last4;
          cardbrand= paymentMethod.card.brand;
        }

        if(paymentMethod.us_bank_account) {
          cardlast4= paymentMethod.us_bank_account.last4;
          cardbrand= "Bank Account";
        }
      }
      
      if (element.name && element.email) {
        customerData.push({
          ...element,
          last4: cardlast4,
          brand: cardbrand,
        });
      }
    }
    return { customers: customerData, UserInfo:userInfo, premiumUser: userInfo.premiumUser, subdata: existingShop, isError:false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}

// Fetch Customers based on search fileter
export async function fetchSearchStripeCustomer(searchValue, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const { data } = await stripe.customers.list();

    const filteredData = data.filter((item) => {
      const customerName = item.data?.name || "";
      const customerEmail = item.data?.email || "";

      return customerName.includes(searchedVal) || customerEmail.toLowerCase().includes(searchedVal.toLowerCase());
    });

    return { payments: filteredData,  isError: false };
  }catch(error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}

// Fetch recent stripe Customer's with limit -> 5
export async function fetchStripeRecentCustomers(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const recentStripeCustomers = await stripe.customers.list({ limit:5 });
    const data = recentStripeCustomers.data;
    let  recentStripeCustomersData = [];
    let paymentMethod = '';
    let cardlast4 = '';
    let cardbrand = '';
    const existingShop = await db.SubscriptionUser.findFirst({ 
      where: { 
        shop_url: userInfo.shop, 
        sub_cancel_date: null 
      }
    }); 

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if(element.invoice_settings.default_payment_method != null) {
        paymentMethod = await stripe.paymentMethods.retrieve(element.invoice_settings.default_payment_method);
      }

      if (paymentMethod) {

        if(paymentMethod.card) {
          cardlast4= paymentMethod.card.last4;
          cardbrand= paymentMethod.card.brand;
        }

        if(paymentMethod.us_bank_account) {
          cardlast4= paymentMethod.us_bank_account.last4;
          cardbrand= "Bank Account";
        }
      }
      
      if (element.name && element.email) {
        recentStripeCustomersData.push({
          ...element,
          last4: cardlast4,
          brand: cardbrand,
        });
      }
    }
    return { recentStripeCustomers: recentStripeCustomersData, UserInfo:userInfo, premiumUser: userInfo.premiumUser, subdata: existingShop, isError:false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}
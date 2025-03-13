import { Stripe } from "stripe";

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
    return { customers: customers.data, UserInfo:userInfo, premiumUser: userInfo.premiumUser,isError:false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}

export async function fetchStripeCustomerData(id) {
  try{
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const customerData = await stripe.customers.retrieve(id);
    return { customerDetail: customerData.data, isError:false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}

export async function fetchSearchStripeCustomer(searchValue) {
  try{
    const stripe = new Stripe(userInfo.stripeSecretKey);
    let queryName = '';
    let queryEmail = '';
    let queryDate = '';
    let searchQuery = '';
    if (queryName) {
      searchQuery = "{query: 'name:\'"+searchValue+"\''}";
    }
    if (queryEmail) {
      searchQuery = "{query: 'email:\'"+searchValue+"\''}";
    }
    if (queryDate) {
      searchQuery = "{query: 'created:\'"+searchValue+"\''}";
    }
    const customers = await stripe.customers.search(searchQuery);
    return { customers: customers.data, isError:false };
  }catch(error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}
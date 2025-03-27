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
    const data = customers.data;
    let  customerData = [];
    let paymentMethod = '';
    let cardlast4 = '';
    let cardbrand = '';
    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if(element.invoice_settings.default_payment_method != null) {
        paymentMethod = await stripe.paymentMethods.retrieve(element.invoice_settings.default_payment_method);
      }

      // console.log(paymentMethod);
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
    return { customers: customerData, UserInfo:userInfo, premiumUser: userInfo.premiumUser,isError:false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}

// export async function fetchStripeCustomerData(id) {
//   try{
//     const stripe = new Stripe(userInfo.stripeSecretKey);
//     const customerData = await stripe.customers.retrieve(id);
    
//     // Fetch the payment method details if a default payment method exists
//     let last4 = "N/A";
//     // let brand = "Unknown";
//     if (customerData.invoice_settings?.default_payment_method) {
//       const paymentMethod = await stripe.paymentMethods.retrieve(
//         customerData.invoice_settings.default_payment_method
//       );
//       last4 = paymentMethod?.card?.last4 || "N/A No";
//       // brand = paymentMethod?.card?.brand || "Unknown";
//     }

//     return { customerDetail: customerData.data, last4, isError:false };
//   } catch (error) {
//     return { message: "Something went wrong. Try again later.", error,isError: true };
//   }
// }
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
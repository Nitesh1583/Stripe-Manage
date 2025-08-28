import { Stripe } from "stripe";
import { currency } from "../utils/currency";
import db from "../db.server";

//Fetch Stripe Products

export async function fetchStripeProducts(userInfo) {
  const stripe = new Stripe(userInfo.stripeSecretKey);
  const products = await stripe.products.list();

  const currencyData= currency.find((item)=>{
    return item.code === products.currency;
  })
  const existingShop = await db.SubscriptionUser.findFirst({ where: { shop_url: userInfo.shop, sub_cancel_date: null }}); 

  const productsWithData = await Promise.all(
    products.data.map(async (product) => {
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 1,
      });

      // let imageUrls = [];
      // if (product.images && product.images.length > 0) {
      //   for (let i = 0; i < product.images.length; i++) {
      //     const imageData = await stripe.files.retrieve(product.images[i]);
      //     imageUrls.push(imageData.url);
      //   }
      // }

      return {
        ...product,
        id: product.id,
        name: product.name,
        created: product.created,
        updated: product.updated,
        description: product.description,
        // images: imageUrls, // Push image URLs directly
        price:
          prices?.data?.length > 0 ? prices.data[0].unit_amount / 100 : null,
        currency: prices?.data?.length > 0 ? prices.data[0].currency : null,
        currencyData
      };
    }),
  );

  return { products: productsWithData, UserInfo:userInfo, premiumUser: userInfo.premiumUser, subdata: existingShop, isError:false};
}

// fetch single stripe product

export async function fetchStripeSingleProductById(userInfo, productid) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey)
    const product = await stripe.products.retrieve(productid);
    const price = await stripe.prices.retrieve(product.default_price);
    const currencyData= currency.filter((item)=>{
      return (item.code).toLocaleLowerCase() === price.currency;
    })
    return {product,price,currencyData} ;
  } catch (error) {
    return { message: "An unexpected error occurred when creating the product.", isError: true };
  }
}
// Helper method to create a new product

export async function createProduct(formData, shop) {
  try {
    return { message: "Product created successfully", isError: false };
  } catch (error) {
    return { message: "An unexpected error occurred when creating the product.", isError: true };
  }
}


// fetch single stripe product

export async function fetchStripeSingleProductByPriceid(userInfo, defaultPriceId) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const price = await stripe.prices.retrieve(defaultPriceId);
    const product = await stripe.products.retrieve(price.product);
    const currencyData = currency.filter(item => item.code.toLowerCase() === price.currency.toLowerCase());
    return { product, price, currencyData };
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return { message: "An unexpected error occurred when fetching the product.", isError: true };
  }
}

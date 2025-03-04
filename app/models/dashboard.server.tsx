import { Stripe } from "stripe"; // Importing Stripe from the stripe package
import { currency } from '../utils/currency';

async function calculateFinancialMetrics(stripe, startDate, endDate) {
  try {
    const payments = await stripe.paymentIntents.list({
      created: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    });

    const totalRevenue = payments.data.reduce((sum, payment) => sum + payment.amount, 0);
    const refunds = payments.data.reduce((sum, payment) => sum + (payment.status === 'succeeded' && payment.cancellation_reason ? payment.amount : 0), 0);
    const netRevenue = totalRevenue - refunds;
    const successfulPayments = payments.data.filter(payment => payment.status === 'succeeded').length;
    const failedPayments = payments.data.filter(payment => payment.status === 'failed').length;
    const conversionRate = successfulPayments / (successfulPayments + failedPayments) * 100;
    const customers = await stripe.customers.list({ created: { gte: startDate.toISOString(), lte: endDate.toISOString() } });
    const activeCustomers = new Set(payments.data.map(payment => payment.customer));
    const newCustomers = customers.data.length;
    const paymentMethods = payments.data.reduce((counts, payment) => {
      const method = payment.payment_method_types && payment.payment_method_types[0] || 'unknown';
      counts[method] = (counts[method] || 0) + 1;
      return counts;
    }, {});

    return {
      revenue: totalRevenue,
      refunds,
      netRevenue,
      successfulPayments,
      failedPayments,
      conversionRate,
      activeCustomers: activeCustomers.size,
      newCustomers,
      paymentMethods,
    };
  } catch (error) {
    throw new Error(`Error calculating financial metrics: ${error.message}`);
  }
}


export async function stripeDashboardData(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    if (!stripe) throw new Error('Unable to connect with stripe');
    const today = new Date();
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); 
    const metrics = await calculateFinancialMetrics(stripe, startDate, today);
    const visualizationData = {
      metrics,
    };
    return visualizationData;
  } catch (error) {
    return { message: error.message, isError: true };
  }
}
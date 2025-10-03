import HTTPSProxyAgent from "https-proxy-agent";
import Stripe from "stripe";
import * as config from "../../config";

const STRIPE_ACCOUNT_API_KEY = process.env.STRIPE_ACCOUNT_API_KEY || "";
const STRIPE_ACCOUNT_TEST_API_KEY =
  process.env.STRIPE_ACCOUNT_TEST_API_KEY || "";

const stripeConfig: Stripe.StripeConfig = {
  apiVersion: "2020-08-27",
};

if (config.server.HTTPS_PROXY) {
  // @ts-expect-error was previously ts-ignore
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY);
}

const stripeApi = new Stripe(STRIPE_ACCOUNT_API_KEY, stripeConfig);
const stripeTestApi = new Stripe(STRIPE_ACCOUNT_TEST_API_KEY, stripeConfig);

export function getStripeApi(live: boolean): Stripe {
  return (live && stripeApi) || stripeTestApi;
}

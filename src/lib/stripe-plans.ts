export const STRIPE_PLANS = {
  plus: {
    monthly: { priceId: "price_1T3zkNH7IRFB6gqObtWc6gv5", productId: "prod_U23sAKDoEq8OES" },
    annual: { priceId: "price_1T3zkbH7IRFB6gqO2mzqrZDl", productId: "prod_U23skBVnn0VuO1" },
  },
  pro: {
    monthly: { priceId: "price_1T3zl3H7IRFB6gqOyUJGRvfg", productId: "prod_U23sma8YXQQIDT" },
    annual: { priceId: "price_1T3zlSH7IRFB6gqO6WwEXP4m", productId: "prod_U23tHVjIomeZla" },
  },
  enterprise: {
    monthly: { priceId: "price_1T3zlmH7IRFB6gqOPr0fsrrI", productId: "prod_U23toHCQFVRSOr" },
    annual: { priceId: "price_1T3zm4H7IRFB6gqOpQSBEWjm", productId: "prod_U23tKmvlVDm3lS" },
  },
} as const;

// Map Stripe product IDs to internal plan names
export const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_U23sAKDoEq8OES: "plus",
  prod_U23skBVnn0VuO1: "plus",
  prod_U23sma8YXQQIDT: "pro",
  prod_U23tHVjIomeZla: "pro",
  prod_U23toHCQFVRSOr: "enterprise",
  prod_U23tKmvlVDm3lS: "enterprise",
};

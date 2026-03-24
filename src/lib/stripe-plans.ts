export const STRIPE_PLANS = {
  plus: {
    monthly: { priceId: "price_1TEW3vH7IRFB6gqOKnn2f8Js", productId: "prod_UCvvAhvb6yV5Is" },
    annual: { priceId: "price_1TEW4IH7IRFB6gqOKQZrmz3x", productId: "prod_UCvwJONSMfqBgY" },
  },
  pro: {
    monthly: { priceId: "price_1TEWQTH7IRFB6gqOlZS9ns8T", productId: "prod_UCwJECieX5LR5L" },
    annual: { priceId: "price_1TEWU8H7IRFB6gqO6dQsehmo", productId: "prod_UCwMJoE6gHRzYl" },
  },
  enterprise: {
    monthly: { priceId: "price_1TEWUUH7IRFB6gqOl4hprUp7", productId: "prod_UCwNnACPlGeYLS" },
    annual: { priceId: "price_1TEWUkH7IRFB6gqOyFTebsfY", productId: "prod_UCwNi4wQNSspnv" },
  },
} as const;

// Map Stripe product IDs to internal plan names
export const PRODUCT_TO_PLAN: Record<string, string> = {
  // New prices
  prod_UCvvAhvb6yV5Is: "plus",
  prod_UCvwJONSMfqBgY: "plus",
  prod_UCwJECieX5LR5L: "pro",
  prod_UCwMJoE6gHRzYl: "pro",
  prod_UCwNnACPlGeYLS: "enterprise",
  prod_UCwNi4wQNSspnv: "enterprise",
  // Legacy prices (existing subscriber)
  prod_U23sAKDoEq8OES: "plus",
  prod_U23skBVnn0VuO1: "plus",
  prod_U23sma8YXQQIDT: "pro",
  prod_U23tHVjIomeZla: "pro",
  prod_U23toHCQFVRSOr: "enterprise",
  prod_U23tKmvlVDm3lS: "enterprise",
};

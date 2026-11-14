/** { method, pattern, action, category } — mutations & auth only */
const RULES = [
    // Account
    { method: "POST", pattern: /^\/api\/user\/signup-user$/, action: "user.signup", category: "account" },
    { method: "PATCH", pattern: /^\/api\/user\/verify-user$/, action: "user.verify_otp", category: "account" },
    { method: "POST", pattern: /^\/api\/store\/create-store$/, action: "store.signup", category: "account" },
    { method: "PATCH", pattern: /^\/api\/store\/store-otp$/, action: "store.verify_otp", category: "account" },
    { method: "PATCH", pattern: /^\/api\/store\/resubmit-verification\/[^/]+$/, action: "store.resubmit_verification", category: "account" },
    { method: "PATCH", pattern: /^\/api\/store\/update-store\/[^/]+$/, action: "store.update", category: "store" },
    { method: "DELETE", pattern: /^\/api\/store\/delete-store\/[^/]+$/, action: "store.delete", category: "store" },

    // Plans & subscriptions
    { method: "POST", pattern: /^\/api\/plan\/[^/]+\/purchase-plan\/[^/]+$/, action: "plan.purchase", category: "plan" },
    { method: "PATCH", pattern: /^\/api\/plan\/[^/]+\/update-card$/, action: "plan.update_card", category: "plan" },
    { method: "PATCH", pattern: /^\/api\/plan\/[^/]+\/action-plan\/[^/]+$/, action: "plan.subscription_action", category: "plan" },
    { method: "POST", pattern: /^\/api\/plan\/[^/]+\/create-plan$/, action: "plan.create", category: "plan" },
    { method: "PATCH", pattern: /^\/api\/plan\/[^/]+\/update-plan\/[^/]+$/, action: "plan.update", category: "plan" },
    { method: "DELETE", pattern: /^\/api\/plan\/[^/]+\/delete-plan\/[^/]+$/, action: "plan.delete", category: "plan" },
    { method: "POST", pattern: /^\/api\/riders\/[^/]+\/create-riders$/, action: "rider.invited", category: "account" },
    { method: "PATCH", pattern: /^\/api\/riders\/verify-rider$/, action: "rider.verify_otp", category: "account" },
    { method: "PATCH", pattern: /^\/api\/riders\/[^/]+\/submit-rider-verification$/, action: "rider.submit_details", category: "account" },
    { method: "POST", pattern: /^\/api\/admin\/create-admin$/, action: "admin.create", category: "account" },

    // Auth
    { method: "POST", pattern: /^\/api\/global\/login$/, action: "auth.login", category: "auth" },
    { method: "POST", pattern: /^\/api\/global\/logout$/, action: "auth.logout", category: "auth" },
    { method: "PATCH", pattern: /^\/api\/global\/forget-password$/, action: "auth.forgot_password", category: "auth" },
    { method: "PATCH", pattern: /^\/api\/global\/verify-otp$/, action: "auth.verify_otp", category: "auth" },
    { method: "PATCH", pattern: /^\/api\/global\/reset-password$/, action: "auth.reset_password", category: "auth" },
    { method: "PATCH", pattern: /^\/api\/global\/resend-otp$/, action: "auth.resend_otp", category: "auth" },
    { method: "PATCH", pattern: /^\/api\/global\/change-password\/[^/]+$/, action: "auth.change_password", category: "auth" },

    // Products
    { method: "POST", pattern: /^\/api\/products\/create-product\/[^/]+$/, action: "product.create", category: "product" },
    { method: "PATCH", pattern: /^\/api\/products\/[^/]+\/update-product\/[^/]+$/, action: "product.update", category: "product" },
    { method: "DELETE", pattern: /^\/api\/products\/[^/]+\/delete-products\/[^/]+$/, action: "product.delete", category: "product" },

    // Orders
    { method: "POST", pattern: /^\/api\/orders\/[^/]+\/place$/, action: "order.place", category: "order" },
    { method: "POST", pattern: /^\/api\/orders\/[^/]+\/reorder$/, action: "order.reorder", category: "order" },
    { method: "POST", pattern: /^\/order\/api\/[^/]+\/reorder$/, action: "order.reorder", category: "order" },
    { method: "POST", pattern: /^\/order\/api\/[^/]+\/place$/, action: "order.place", category: "order" },
    { method: "PATCH", pattern: /^\/api\/orders\/store\/[^/]+\/[^/]+\/respond$/, action: "order.store_respond", category: "order" },
    { method: "PATCH", pattern: /^\/order\/api\/store\/[^/]+\/[^/]+\/respond$/, action: "order.store_respond", category: "order" },
    { method: "PATCH", pattern: /^\/api\/orders\/rider\/[^/]+\/[^/]+\/accept$/, action: "order.rider_accept", category: "order" },
    { method: "PATCH", pattern: /^\/order\/api\/rider\/[^/]+\/[^/]+\/accept$/, action: "order.rider_accept", category: "order" },
    { method: "PATCH", pattern: /^\/api\/orders\/[^/]+\/status$/, action: "order.status_update", category: "order" },
    { method: "PATCH", pattern: /^\/order\/api\/[^/]+\/status$/, action: "order.status_update", category: "order" },

    // Cart
    { method: "POST", pattern: /^\/api\/cart\/add$/, action: "cart.add", category: "cart" },
    { method: "PUT", pattern: /^\/api\/cart\/[^/]+$/, action: "cart.update", category: "cart" },
    { method: "DELETE", pattern: /^\/api\/cart\/[^/]+\/[^/]+$/, action: "cart.remove_item", category: "cart" },

    // Reviews
    { method: "POST", pattern: /^\/api\/review\/products\/[^/]+\/reviews$/, action: "review.product_create", category: "review" },
    { method: "POST", pattern: /^\/api\/review\/rider\/[^/]+\/reviews$/, action: "review.rider_create", category: "review" },
];

export const matchAuditRule = (method, path) => {
    const normalizedPath = path.split("?")[0];
    return RULES.find(
        (rule) => rule.method === method && rule.pattern.test(normalizedPath)
    );
};

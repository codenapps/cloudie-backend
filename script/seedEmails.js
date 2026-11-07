/**
 * Shared seed test emails (same env vars as seedTestData.js / deleteSeedTestData.js).
 */
export function getSeedEmails() {
    return {
        store: (process.env.SEED_STORE_EMAIL || "seed.store@test.local").toLowerCase(),
        user: (process.env.SEED_USER_EMAIL || "seed.user@test.local").toLowerCase(),
        rider: (process.env.SEED_RIDER_EMAIL || "seed.rider@test.local").toLowerCase(),
    };
}

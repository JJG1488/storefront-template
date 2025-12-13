// In-memory token store for admin authentication
// In production, consider using a database or Redis for persistence
export const activeTokens = new Set<string>();

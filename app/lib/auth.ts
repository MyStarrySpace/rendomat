import { createAuthClient } from "@neondatabase/neon-js/auth";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_URL!;

export const authClient = createAuthClient(authUrl);

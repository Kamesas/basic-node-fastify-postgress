import { FastifyReply } from "fastify";
import { config } from "../config";

/**
 * Sets authentication cookies
 * Access token: Returned in response body for Authorization header usage
 * Refresh token: Set as httpOnly cookie for security
 */
export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
): void {
  // Only set refresh token as httpOnly cookie
  // Access token will be sent in response body and used via Authorization header
  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true, // Prevents JavaScript from accessing the cookie (XSS protection)
    secure: config.nodeEnv === "production", // Only send cookie over HTTPS in production
    sameSite: "lax", // Prevents CSRF attacks while allowing navigation from external sites
    path: "/api/auth", // Cookie sent to all auth endpoints (login, refresh, logout)
    maxAge: config.refreshTokenCookieMaxAge, // Matches JWT refresh token expiry (7 days)
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie("refreshToken", {
    path: "/api/auth",
  });
}

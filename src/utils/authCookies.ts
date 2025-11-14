import { FastifyReply } from "fastify";
import { config } from "../config";

// TODO: need to read about all these one more time

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
): void {
  reply.setCookie("accessToken", accessToken, {
    httpOnly: true, // Prevents JavaScript from accessing the cookie (XSS protection)
    secure: config.nodeEnv === "production", // Only send cookie over HTTPS in production
    sameSite: "lax", // Prevents CSRF attacks while allowing navigation from external sites
    path: "/", // Cookie is valid for all routes
    maxAge: 15 * 60, // Cookie expires in 15 minutes (in seconds)
  });

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true, // Prevents JavaScript from accessing the cookie (XSS protection)
    secure: config.nodeEnv === "production", // Only send cookie over HTTPS in production
    sameSite: "lax", // Prevents CSRF attacks while allowing navigation from external sites
    path: "/api/auth/refresh", // Cookie only sent to refresh endpoint (minimizes exposure)
    maxAge: 7 * 24 * 60 * 60, // Cookie expires in 7 days (in seconds)
  });
}

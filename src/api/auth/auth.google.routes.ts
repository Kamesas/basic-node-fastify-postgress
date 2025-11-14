import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  findUserByGoogleId,
  loginOrRegisterWithGoogle,
} from "./auth.google.models";
import { storeTokens } from "./auth.tokens.models";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { config } from "../../config";
import { setAuthCookies } from "../../utils/authCookies";

type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
};

export default async function googleAuthRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();
  f.get("/login/google/callback", async (request, reply) => {
    try {
      const { token } =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        );

      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        const errorUrl = new URL("/auth/callback", config.frontendUrl);
        errorUrl.searchParams.set(
          "error",
          "Failed to fetch user info from Google"
        );
        return reply.redirect(errorUrl.toString());
      }

      const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

      if (!userInfo || !userInfo.email) {
        const errorUrl = new URL("/auth/callback", config.frontendUrl);
        errorUrl.searchParams.set(
          "error",
          "Invalid user information received from Google"
        );
        return reply.redirect(errorUrl.toString());
      }

      const existingUser = await findUserByGoogleId(userInfo.id);

      let userId: number;
      let username: string;
      let email: string;

      if (!existingUser) {
        const result = await loginOrRegisterWithGoogle({
          googleId: userInfo.id,
          email: userInfo.email,
          displayName: userInfo.name,
          avatarUrl: userInfo.picture,
          providerData: {
            verified_email: userInfo.verified_email,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            locale: userInfo.locale,
          },
        });

        userId = result.user.id;
        username = result.user.username;
        email = result.user.email || userInfo.email;
      } else {
        userId = existingUser.id;
        username = existingUser.username;
        email = existingUser.email || userInfo.email;
      }

      const accessToken = generateAccessToken({ userId, username, email });
      const refreshToken = generateRefreshToken({ userId, username, email });

      await storeTokens(userId, refreshToken, request.headers["user-agent"]);

      setAuthCookies(reply, accessToken, refreshToken);

      const frontendRedirectUrl = new URL("/auth/callback", config.frontendUrl);
      frontendRedirectUrl.searchParams.set("success", "true");

      return reply.redirect(frontendRedirectUrl.toString());
    } catch {
      const errorUrl = new URL("/auth/callback", config.frontendUrl);
      errorUrl.searchParams.set("error", "Authentication failed");
      return reply.redirect(errorUrl.toString());
    }
  });
}

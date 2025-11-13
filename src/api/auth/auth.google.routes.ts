import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  findUserByGoogleId,
  loginOrRegisterWithGoogle,
} from "./auth.google.models";
import { storeTokens } from "./auth.tokens.models";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { config } from "../../config";

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
      fastify.log.error(
        { statusText: userInfoResponse.statusText },
        "Google API error"
      );
      return reply.code(401).send({
        error: "Failed to fetch user info from Google",
      });
    }

    const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!userInfo || !userInfo.email) {
      fastify.log.error({ userInfo }, "Invalid user info received");
      return reply.code(400).send({
        error: "Invalid user information received from Google",
      });
    }

    const existingUser = await findUserByGoogleId(userInfo.id);

    let userId: number;
    let username: string;

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
    } else {
      userId = existingUser.id;
      username = existingUser.username;
    }

    const accessToken = generateAccessToken({ userId, username });
    const refreshToken = generateRefreshToken({ userId, username });

    await storeTokens(userId, refreshToken, request.headers["user-agent"]);

    const frontendRedirectUrl = new URL("/auth/callback", config.frontendUrl);
    frontendRedirectUrl.searchParams.set("accessToken", accessToken);
    frontendRedirectUrl.searchParams.set("refreshToken", refreshToken);

    return reply.redirect(frontendRedirectUrl.toString());
  });
}

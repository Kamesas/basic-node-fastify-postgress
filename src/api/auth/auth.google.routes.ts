import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export default async function googleAuthRoutes(fastify: FastifyInstance) {
  const f = fastify.withTypeProvider<ZodTypeProvider>();

  f.get("/login/google/callback", async (request, reply) => {
    try {
      const { token } =
        await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
          request
        );

      // Fetch user info from Google
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );

      if (!userInfoResponse.ok) {
        fastify.log.error("Google API error:", userInfoResponse.statusText);
        return reply.code(401).send({
          error: "Failed to fetch user info from Google",
        });
      }

      const userInfo = (await userInfoResponse.json()) as GoogleUserInfo;

      if (!userInfo || !userInfo.email) {
        fastify.log.error("Invalid user info received:", userInfo);
        return reply.code(400).send({
          error: "Invalid user information received from Google",
        });
      }

      // TODO:
      // 1. Check if user exists in database
      // 2. Create new user or update existing one
      // 3. Generate JWT token or create session
      // 4. Return token or redirect to frontend

      return reply.send({
        message: "Authentication successful",
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          verified_email: userInfo.verified_email,
        },
      });
    } catch (error) {
      fastify.log.error("OAuth callback error:", error);
      return reply.code(500).send({
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}

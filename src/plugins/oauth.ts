import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import oauthPlugin from "@fastify/oauth2";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow(request: any): Promise<{
        token: {
          access_token: string;
          refresh_token?: string;
          token_type: string;
          expires_in: number;
        };
      }>;
    };
  }
}

const oauthSetup: FastifyPluginAsync = async (fastify) => {
  await fastify.register(oauthPlugin, {
    name: "googleOAuth2",
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || "",
        secret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/api/auth/login/google",
    callbackUri:
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:4000/api/auth/login/google/callback",
    scope: ["profile", "email"],
  });
};

export default fp(oauthSetup, {
  name: "oauth-setup",
});

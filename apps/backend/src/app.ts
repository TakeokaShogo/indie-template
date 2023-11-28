import Fastify from "fastify";
import { FastifyZod, buildJsonSchemas, register } from "fastify-zod";
import { HOST, PORT } from "./environmental-variables";
import initializer from "./initializer";
import { isDevelopmentMode } from "./vite-constant";

const fastify = Fastify({
  logger: {
    transport: isDevelopmentMode
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
    redact: ["req.headers.authorization"],
    serializers: {
      req(request) {
        return {
          // default output
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort,

          // I added
          headers: request.headers,
          protocol: request.protocol,
          originalUrl: request.originalUrl,
          routeUrl: request.routeOptions.url,
          parameters: request.params,
        };
      },
      res(reply) {
        return {
          // default output
          statusCode: reply.statusCode,

          // I added
          headers:
            typeof reply.getHeaders === "function" ? reply.getHeaders() : {},
        };
      },
    },
  },
  // disableRequestLogging: true,
});

fastify.register(initializer);

const models = {
  // channelZodSchema,
  // followersTotalZodSchema,
  // userIdParams,
  // userNameParams,
  // userZodSchema,
  // notFoundZodSchema,
};
declare module "fastify" {
  interface FastifyInstance {
    readonly zod: FastifyZod<typeof models>;
  }
}

await register(fastify, {
  jsonSchemas: buildJsonSchemas(models, { errorMessages: false }),
  swaggerOptions: {
    openapi: {
      info: {
        title: "Twitch API wrapper server with fastify",
        description:
          "twitch apiにリクエストし、その結果をフォーマットして返すfastifyで作られたAPI",
        version: "1.0.0",
      },
    },
  },
  //undefinedで初期設定
  swaggerUiOptions: isDevelopmentMode ? undefined : false,
});

fastify.zod.get("/", { operationId: "sample" }, async (request, reply) => {
  return reply.send("hello");
});

if (!isDevelopmentMode) {
  fastify.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server is listening on ${address}`);
  });
}

export const viteNodeApp = fastify;

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import closeWithGrace from "close-with-grace";
import fastifyPlugin from "fastify-plugin";
import { CLOSE_WITH_GRACE_DELAY, CORS_ORIGIN } from "./environmental-variables";

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */

async function initializer(fastify: any, options: any) {
  fastify.register(helmet);

  await fastify.register(cors, {
    origin: CORS_ORIGIN,
  });

  // graceful shutdownの設定(fastify-cli参照)
  // delayは、graceful closeが終了するまでのミリ秒数。
  const closeListeners = closeWithGrace(
    { delay: CLOSE_WITH_GRACE_DELAY },
    async function (graceObj: any) {
      if (graceObj.err) {
        fastify.log.error(graceObj.err);
      }
      await fastify.close();
    }
  );
  fastify.addHook("onClose", (_instance: any, done: () => void) => {
    closeListeners.uninstall();
    done();
  });

  // log request body
  fastify.addHook(
    "preHandler",
    function (
      req: {
        body: any;
        log: { info: (arg0: { requestBody: any }, arg1: string) => void };
      },
      _reply: any,
      done: () => void
    ) {
      if (req.body) {
        req.log.info({ requestBody: req.body }, "request body");
      }
      done();
    }
  );

  // log response body
  fastify.addHook(
    "onSend",
    function (
      req: {
        log: { info: (arg0: { responseBody: any }, arg1: string) => void };
      },
      _reply: any,
      payload: any,
      done: () => void
    ) {
      if (payload) {
        req.log.info({ responseBody: payload }, "response body");
      }
      done();
    }
  );

  // fastify.setErrorHandler<FastifyError & { serialization?: any }>(
  fastify.setErrorHandler(
    (
      error: { serialization: any },
      request: { log: { error: (arg0: any) => void } },
      reply: {
        status: (arg0: number) => {
          (): any;
          new (): any;
          send: { (arg0: { message: string }): void; new (): any };
        };
        send: (arg0: any) => void;
      }
    ) => {
      //serializationのエラー = サーバーのバグの場合は、clientに詳細なエラーを伝えない
      if (error.serialization) {
        // errorログとして残しつつ、クライアントには詳細を伝えない
        request.log.error(error);
        reply.status(500).send({ message: "serialize error" });
      } else {
        // 条件以外の場合はそのままerrorを送るようにしないと、他エラー時に何も返らなくなるので注意
        reply.send(error);
      }
    }
  );
}

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.
export default fastifyPlugin(initializer);

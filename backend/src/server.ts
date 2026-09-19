import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { closeRedis, initRedis } from "./libs/redisStore";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import { whatsappProvider } from "./providers/WhatsApp";
import sequelize from "./database";

const server = app.listen(process.env.PORT, () => {
  logger.info(`Server started on port ${process.env.PORT}`);
});

initIO(server);

gracefulShutdown(server, {
  onShutdown: async () => {
    await whatsappProvider.shutdown();
    await closeRedis();
    await sequelize.close();
  },
  forceExit: false
});

const start = async (): Promise<void> => {
  await initRedis();

  try {
    await StartAllWhatsAppsSessions();
  } catch (err) {
    logger.error({ info: "Unable to restore WhatsApp sessions", err });
  }
};

void start();

process.on("uncaughtException", err => {
  logger.error({ info: "Global uncaught exception", err });
});

process.on("unhandledRejection", err => {
  if (err) logger.error({ info: "Global unhandled rejection", err });
});

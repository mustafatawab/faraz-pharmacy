import http from "http";
import { config } from "./config/env";
import { app } from "./app";
import { logger } from "./utils/logger";
import { prisma } from "./services/prisma";
import { initializeSocket, getIO } from "./socket";

let httpServer: http.Server;

async function main() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    httpServer = http.createServer(app);
    initializeSocket(httpServer);

    httpServer.listen(config.port, "0.0.0.0", () => {
      logger.info(`Faraz Pharmacy API server running on port ${config.port}`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received — shutting down gracefully`);

  const io = getIO();
  if (io) {
    io.close();
  }

  if (httpServer) {
    httpServer.close(() => {
      prisma.$disconnect().finally(() => process.exit(0));
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }

  setTimeout(() => {
    process.exit(0);
  }, 5000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

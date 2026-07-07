import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});
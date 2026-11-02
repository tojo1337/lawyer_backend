import express, { Router } from "express";
import { toNodeHandler } from "@hot-updater/server";
import { hotUpdater } from "../config/hot-updater.config.js";
import { appConfig } from "../config/app.config.js";

const route = Router();

route.use(
  "/admin",
  (req, res, next) => {
    if (req.get("Authorization") !== `Bearer ${appConfig.adminToken}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  },
  express.json({ limit: "1mb" }),
  toNodeHandler(hotUpdater.handlers.admin),
);
route.use(
  "/ota-updates",
  (req, res, next) => {
    if (req.get("Authorization") !== `Bearer ${appConfig.clientToken}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  },
  express.json({ limit: "1mb" }),
  toNodeHandler(hotUpdater.handlers.client),
);

export { route };

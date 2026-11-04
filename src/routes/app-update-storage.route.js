import express, { Router } from "express";
import formidable from "formidable";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { appConfig } from "../config/app.config.js";

const route = Router();

const s3 = new S3Client({
  region: appConfig.s3Region,
  credentials: {
    accessKeyId: appConfig.s3AccessKey,
    secretAccessKey: appConfig.s3SecretKey,
  },
});

// Authentication middleware
const authenticate = (req, res, next) => {
  if (req.get("Authorization") !== `Bearer ${appConfig.clientToken}`) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
};

route.use(authenticate);

// Parse multipart form data using Formidable
const parseForm = (req) => {
  const form = formidable({
    multiples: false,
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    allowEmptyFiles: false,
    minFileSize: 1,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
};

// Helper to extract S3 key from storage URI
const getStorageKey = (storageUri) => {
  const url = new URL(storageUri);

  if (url.protocol !== "s3:" || url.hostname !== appConfig.hotUpdaterStorage) {
    throw new Error("Invalid storage URI");
  }

  return decodeURIComponent(url.pathname.slice(1));
};

// Upload OTA bundle
route.post("/upload", async (req, res) => {
  let uploadedFile;

  try {
    const { fields, files } = await parseForm(req);

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    const key = Array.isArray(fields.key) ? fields.key[0] : fields.key;

    uploadedFile = file;

    if (!file || !key) {
      return res.status(400).json({
        error: "File and key are required",
      });
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: appConfig.hotUpdaterStorage,
        Key: key,
        Body: createReadStream(file.filepath),
        ContentType: file.mimetype || "application/octet-stream",
        ContentLength: file.size,
      }),
    );

    return res.status(200).json({
      storageUri: `s3://${appConfig.hotUpdaterStorage}/${key}`,
    });
  } catch (error) {
    console.error("S3 upload error:", error);

    return res.status(500).json({
      error: "Failed to upload file",
    });
  } finally {
    if (uploadedFile?.filepath) {
      await unlink(uploadedFile.filepath).catch(() => {});
    }
  }
});

// Retrieve an OTA bundle
route.post("/get", express.json(), async (req, res) => {
  try {
    const { storageUri } = req.body;

    if (!storageUri) {
      return res.status(400).json({
        error: "storageUri is required",
      });
    }

    const key = getStorageKey(storageUri);

    const result = await s3.send(
      new GetObjectCommand({
        Bucket: appConfig.hotUpdaterStorage,
        Key: key,
      }),
    );

    const buffer = await result.Body.transformToByteArray();

    res.setHeader(
      "Content-Type",
      result.ContentType || "application/octet-stream",
    );

    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error("S3 retrieval error:", error);

    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({
        error: "File not found",
      });
    }

    return res.status(500).json({
      error: "Failed to retrieve file",
    });
  }
});

// Check whether an OTA bundle exists
route.post("/exists", express.json(), async (req, res) => {
  try {
    const { storageUri } = req.body;

    if (!storageUri) {
      return res.status(400).json({
        error: "storageUri is required",
      });
    }

    const key = getStorageKey(storageUri);

    await s3.send(
      new HeadObjectCommand({
        Bucket: appConfig.hotUpdaterStorage,
        Key: key,
      }),
    );

    return res.status(200).json({
      exists: true,
    });
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({
        exists: false,
      });
    }

    console.error("S3 existence check error:", error);

    return res.status(500).json({
      error: "Failed to check file",
    });
  }
});

// Delete an OTA bundle
route.delete("/delete", express.json(), async (req, res) => {
  try {
    const { storageUri } = req.body;

    if (!storageUri) {
      return res.status(400).json({
        error: "storageUri is required",
      });
    }

    const key = getStorageKey(storageUri);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: appConfig.hotUpdaterStorage,
        Key: key,
      }),
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("S3 deletion error:", error);

    return res.status(500).json({
      error: "Failed to delete file",
    });
  }
});

export { route };

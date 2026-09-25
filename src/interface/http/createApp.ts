import express, { type Express, type Request, type Response } from "express";
import multer from "multer";
import type { GetAnnualDeclaration } from "../../application/ports/GetAnnualDeclaration";
import type { GetDarfCalendar } from "../../application/ports/GetDarfCalendar";
import type { GetDashboard } from "../../application/ports/GetDashboard";
import type { GetModalityBreakdown } from "../../application/ports/GetModalityBreakdown";
import type { GetMonthlyApuration } from "../../application/ports/GetMonthlyApuration";
import type { GetPortfolio } from "../../application/ports/GetPortfolio";
import type { GetTimeline } from "../../application/ports/GetTimeline";
import type { ImportOperations } from "../../application/ports/ImportOperations";
import type { ResetDemo } from "../../application/ports/ResetDemo";
import {
  serializeAnnualDeclaration,
  serializeDashboard,
  serializeMonthlyApuration,
  serializePosition,
  serializeMoney,
} from "./serialize";

export type AppPorts = {
  importOperations: ImportOperations;
  getPortfolio: GetPortfolio;
  getMonthlyApuration: GetMonthlyApuration;
  getAnnualDeclaration: GetAnnualDeclaration;
  getDashboard: GetDashboard;
  getTimeline: GetTimeline;
  getDarfCalendar: GetDarfCalendar;
  getModalityBreakdown: GetModalityBreakdown;
  resetDemo: ResetDemo;
};

const ALLOWED_IMPORT_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function createApp(ports: AppPorts): Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.get("/portfolio", async (_req, res, next) => {
    try {
      const positions = await ports.getPortfolio.execute();
      res.status(200).json(positions.map(serializePosition));
    } catch (error) {
      next(error);
    }
  });

  app.get("/dashboard", async (req, res, next) => {
    try {
      const month = typeof req.query.month === "string" ? req.query.month : "";
      if (!MONTH_PATTERN.test(month)) {
        res.status(400).json({ error: "Query parameter month is required as YYYY-MM" });
        return;
      }
      const summary = await ports.getDashboard.execute({ month });
      res.status(200).json(serializeDashboard(summary));
    } catch (error) {
      next(error);
    }
  });

  app.get("/timeline", async (_req, res, next) => {
    try {
      const events = await ports.getTimeline.execute();
      res.status(200).json(events);
    } catch (error) {
      next(error);
    }
  });

  app.get("/darf-calendar", async (req, res, next) => {
    try {
      const rawYear = typeof req.query.year === "string" ? req.query.year : undefined;
      let year: number | undefined;
      if (rawYear !== undefined) {
        year = Number.parseInt(rawYear, 10);
        if (!Number.isInteger(year) || year < 1900 || year > 2100) {
          res.status(400).json({ error: "Query parameter year must be a valid year" });
          return;
        }
      }
      const obligations = await ports.getDarfCalendar.execute(year === undefined ? undefined : { year });
      res.status(200).json(
        obligations.map((row) => ({
          month: row.month,
          darf: serializeMoney(row.darf),
          dueDate: row.dueDate,
        })),
      );
    } catch (error) {
      next(error);
    }
  });

  app.get("/modality-breakdown", async (req, res, next) => {
    try {
      const month = typeof req.query.month === "string" ? req.query.month : "";
      if (!MONTH_PATTERN.test(month)) {
        res.status(400).json({ error: "Query parameter month is required as YYYY-MM" });
        return;
      }
      const breakdown = await ports.getModalityBreakdown.execute({ month });
      res.status(200).json({
        month: breakdown.month,
        buckets: breakdown.buckets.map((bucket) => ({
          modality: bucket.modality,
          result: serializeMoney(bucket.result),
          tax: serializeMoney(bucket.tax),
          lossCarryforward: serializeMoney(bucket.lossCarryforward),
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/apuration", async (req, res, next) => {
    try {
      const month = typeof req.query.month === "string" ? req.query.month : "";
      if (!MONTH_PATTERN.test(month)) {
        res.status(400).json({ error: "Query parameter month is required as YYYY-MM" });
        return;
      }
      const apuration = await ports.getMonthlyApuration.execute({ month });
      res.status(200).json(serializeMonthlyApuration(apuration));
    } catch (error) {
      next(error);
    }
  });

  app.get("/declaration", async (req, res, next) => {
    try {
      const rawYear = typeof req.query.year === "string" ? req.query.year : "";
      const year = Number.parseInt(rawYear, 10);
      if (!rawYear || !Number.isInteger(year) || year < 1900 || year > 2100) {
        res.status(400).json({ error: "Query parameter year is required as a valid year" });
        return;
      }
      const declaration = await ports.getAnnualDeclaration.execute({ year });
      res.status(200).json(serializeAnnualDeclaration(declaration));
    } catch (error) {
      next(error);
    }
  });

  app.post("/imports", upload.single("file"), async (req: Request, res: Response, next) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "File is required" });
        return;
      }
      if (!ALLOWED_IMPORT_MIME_TYPES.has(file.mimetype)) {
        res.status(415).json({ error: "Unsupported media type; expected CSV or XLSX" });
        return;
      }

      const result = await ports.importOperations.execute({
        filename: file.originalname,
        mimeType: file.mimetype,
        content: new Uint8Array(file.buffer),
      });

      if (!result.ok) {
        res.status(400).json({ errors: result.errors });
        return;
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/demo/reset", async (_req, res, next) => {
    try {
      const result = await ports.resetDemo.execute();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return app;
}

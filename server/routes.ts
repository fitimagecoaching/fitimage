import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProgramSchema, insertWorkoutSchema, insertWorkoutLogSchema, insertMessageSchema, insertCommunityPostSchema, insertCommunityCommentSchema, insertResourceSchema, insertHabitLogSchema, insertClientProgramSchema } from "@shared/schema";

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── AUTH ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = storage.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/register", (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existing = storage.getUserByEmail(data.email);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const user = storage.createUser({ ...data, role: "client" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", (req, res) => {
    const user = storage.getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "Not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/users/:id", (req, res) => {
    const user = storage.updateUser(Number(req.params.id), req.body);
    if (!user) return res.status(404).json({ error: "Not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/clients", (req, res) => {
    const clients = storage.getAllClients().map(({ password: _, ...c }) => c);
    res.json(clients);
  });

  // ─── PROGRAMS ──────────────────────────────────────────────────────────────
  app.get("/api/programs", (req, res) => {
    const coachId = Number(req.query.coachId) || 1;
    res.json(storage.getPrograms(coachId));
  });

  app.get("/api/programs/:id", (req, res) => {
    const prog = storage.getProgramById(Number(req.params.id));
    if (!prog) return res.status(404).json({ error: "Not found" });
    res.json(prog);
  });

  app.post("/api/programs", (req, res) => {
    try {
      const data = insertProgramSchema.parse(req.body);
      res.json(storage.createProgram(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/programs/:id", (req, res) => {
    const prog = storage.updateProgram(Number(req.params.id), req.body);
    if (!prog) return res.status(404).json({ error: "Not found" });
    res.json(prog);
  });

  app.delete("/api/programs/:id", (req, res) => {
    storage.deleteProgram(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── CLIENT PROGRAMS ───────────────────────────────────────────────────────
  app.post("/api/client-programs", (req, res) => {
    try {
      const data = insertClientProgramSchema.parse(req.body);
      res.json(storage.assignProgram(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/client-programs/:clientId", (req, res) => {
    res.json(storage.getClientPrograms(Number(req.params.clientId)));
  });

  app.get("/api/client-programs/:clientId/active", (req, res) => {
    const cp = storage.getActiveClientProgram(Number(req.params.clientId));
    res.json(cp || null);
  });

  app.patch("/api/client-programs/:id", (req, res) => {
    const cp = storage.updateClientProgram(Number(req.params.id), req.body);
    res.json(cp);
  });

  // ─── WORKOUTS ──────────────────────────────────────────────────────────────
  app.get("/api/workouts", (req, res) => {
    const programId = Number(req.query.programId);
    if (!programId) return res.status(400).json({ error: "programId required" });
    res.json(storage.getWorkoutsByProgram(programId));
  });

  app.get("/api/workouts/:id", (req, res) => {
    const w = storage.getWorkoutById(Number(req.params.id));
    if (!w) return res.status(404).json({ error: "Not found" });
    res.json(w);
  });

  app.post("/api/workouts", (req, res) => {
    try {
      const data = insertWorkoutSchema.parse(req.body);
      res.json(storage.createWorkout(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/workouts/:id", (req, res) => {
    const w = storage.updateWorkout(Number(req.params.id), req.body);
    if (!w) return res.status(404).json({ error: "Not found" });
    res.json(w);
  });

  app.delete("/api/workouts/:id", (req, res) => {
    storage.deleteWorkout(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── WORKOUT LOGS ──────────────────────────────────────────────────────────
  app.post("/api/workout-logs", (req, res) => {
    try {
      const data = insertWorkoutLogSchema.parse(req.body);
      res.json(storage.createWorkoutLog(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/workout-logs/:clientId", (req, res) => {
    res.json(storage.getWorkoutLogs(Number(req.params.clientId)));
  });

  // ─── MESSAGES ──────────────────────────────────────────────────────────────
  app.post("/api/messages", (req, res) => {
    try {
      const data = insertMessageSchema.parse(req.body);
      res.json(storage.sendMessage(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/messages/conversation/:userId1/:userId2", (req, res) => {
    res.json(storage.getConversation(Number(req.params.userId1), Number(req.params.userId2)));
  });

  app.get("/api/messages/inbox/:userId", (req, res) => {
    res.json(storage.getInbox(Number(req.params.userId)));
  });

  app.patch("/api/messages/:id/read", (req, res) => {
    storage.markRead(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── COMMUNITY ─────────────────────────────────────────────────────────────
  app.get("/api/community", (req, res) => {
    res.json(storage.getCommunityPosts());
  });

  app.post("/api/community", (req, res) => {
    try {
      const data = insertCommunityPostSchema.parse(req.body);
      res.json(storage.createCommunityPost(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/community/:id/like", (req, res) => {
    const post = storage.toggleLike(Number(req.params.id), req.body.userId);
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json(post);
  });

  app.get("/api/community/:id/comments", (req, res) => {
    res.json(storage.getComments(Number(req.params.id)));
  });

  app.post("/api/community/:id/comments", (req, res) => {
    try {
      const data = insertCommunityCommentSchema.parse({ ...req.body, postId: Number(req.params.id) });
      res.json(storage.createComment(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── RESOURCES ─────────────────────────────────────────────────────────────
  app.get("/api/resources", (req, res) => {
    // Strip file_data from list for performance
    const list = storage.getResources().map(({ fileData: _, ...r }) => r);
    res.json(list);
  });

  app.post("/api/resources", (req, res) => {
    try {
      const data = insertResourceSchema.parse(req.body);
      res.json(storage.createResource(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/resources/:id/download", (req, res) => {
    const resource = storage.getResources().find(r => r.id === Number(req.params.id));
    if (!resource) return res.status(404).json({ error: "Not found" });
    const fullResource = storage.getResources().find(r => r.id === Number(req.params.id));
    if (!fullResource) return res.status(404).json({ error: "Not found" });
    // Get full resource with fileData
    const all = storage.getResources();
    // We need fileData - re-query via a raw approach
    res.json({ error: "Use /api/resources/:id/data" });
  });

  app.get("/api/resources/:id/data", (req, res) => {
    // Get resource with file data
    const { db: database } = require("./storage");
    // Fallback: just return the full resource
    const allFull = storage.getResources();
    // getResources strips fileData, so we need direct access
    // Use the storage directly
    const r = (storage as any).getResourceFull(Number(req.params.id));
    if (!r) return res.status(404).json({ error: "Not found" });
    const buffer = Buffer.from(r.fileData, "base64");
    res.setHeader("Content-Disposition", `attachment; filename="${r.fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(buffer);
  });

  app.delete("/api/resources/:id", (req, res) => {
    storage.deleteResource(Number(req.params.id));
    res.json({ success: true });
  });

  // ─── HABIT LOGS ────────────────────────────────────────────────────────────
  app.post("/api/habits", (req, res) => {
    try {
      const data = insertHabitLogSchema.parse(req.body);
      res.json(storage.createHabitLog(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/habits/:clientId", (req, res) => {
    res.json(storage.getHabitLogs(Number(req.params.clientId)));
  });

  app.get("/api/habits/:clientId/:date", (req, res) => {
    const log = storage.getHabitLogByDate(Number(req.params.clientId), req.params.date);
    res.json(log || null);
  });
}

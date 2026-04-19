// Pure in-memory storage — no native dependencies, works on any platform
import {
  type User, type InsertUser,
  type Program, type InsertProgram,
  type ClientProgram, type InsertClientProgram,
  type Workout, type InsertWorkout,
  type WorkoutLog, type InsertWorkoutLog,
  type Message, type InsertMessage,
  type CommunityPost, type InsertCommunityPost,
  type CommunityComment, type InsertCommunityComment,
  type Resource, type InsertResource,
  type HabitLog, type InsertHabitLog,
} from "@shared/schema";

let nextId = 1;
const uid = () => nextId++;

// ─── In-memory tables ────────────────────────────────────────────────────────
const db = {
  users: [] as User[],
  programs: [] as Program[],
  clientPrograms: [] as ClientProgram[],
  workouts: [] as Workout[],
  workoutLogs: [] as WorkoutLog[],
  messages: [] as Message[],
  communityPosts: [] as CommunityPost[],
  communityComments: [] as CommunityComment[],
  resources: [] as Resource[],
  habitLogs: [] as HabitLog[],
};

// Seed coach account
db.users.push({
  id: uid(),
  name: "FitImage Coach",
  email: "coach@fitimage.com",
  password: "fitimage2024",
  role: "coach",
  avatarUrl: null,
  bio: "NASM Certified · Precision Nutrition L1 · Behavior Change Coach",
  goals: null,
  createdAt: Date.now(),
});

export interface IStorage {
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(data: InsertUser): User;
  updateUser(id: number, data: Partial<InsertUser>): User | undefined;
  getAllClients(): User[];

  getPrograms(coachId: number): Program[];
  getProgramById(id: number): Program | undefined;
  createProgram(data: InsertProgram): Program;
  updateProgram(id: number, data: Partial<InsertProgram>): Program | undefined;
  deleteProgram(id: number): void;

  assignProgram(data: InsertClientProgram): ClientProgram;
  getClientPrograms(clientId: number): ClientProgram[];
  getActiveClientProgram(clientId: number): ClientProgram | undefined;
  updateClientProgram(id: number, data: Partial<InsertClientProgram>): ClientProgram | undefined;

  getWorkoutsByProgram(programId: number): Workout[];
  getWorkoutById(id: number): Workout | undefined;
  createWorkout(data: InsertWorkout): Workout;
  updateWorkout(id: number, data: Partial<InsertWorkout>): Workout | undefined;
  deleteWorkout(id: number): void;

  createWorkoutLog(data: InsertWorkoutLog): WorkoutLog;
  getWorkoutLogs(clientId: number): WorkoutLog[];
  getWorkoutLogsByWorkout(workoutId: number): WorkoutLog[];

  sendMessage(data: InsertMessage): Message;
  getConversation(userId1: number, userId2: number): Message[];
  getInbox(userId: number): Message[];
  markRead(messageId: number): void;

  getCommunityPosts(): CommunityPost[];
  createCommunityPost(data: InsertCommunityPost): CommunityPost;
  toggleLike(postId: number, userId: number): CommunityPost | undefined;
  getComments(postId: number): CommunityComment[];
  createComment(data: InsertCommunityComment): CommunityComment;

  getResources(): Resource[];
  createResource(data: InsertResource): Resource;
  deleteResource(id: number): void;
  getResourceFull(id: number): Resource | undefined;

  createHabitLog(data: InsertHabitLog): HabitLog;
  getHabitLogs(clientId: number): HabitLog[];
  getHabitLogByDate(clientId: number, date: string): HabitLog | undefined;
}

export class Storage implements IStorage {
  getUserById(id: number) { return db.users.find(u => u.id === id); }
  getUserByEmail(email: string) { return db.users.find(u => u.email === email); }
  createUser(data: InsertUser): User {
    const u: User = { id: uid(), avatarUrl: null, bio: null, goals: null, createdAt: Date.now(), role: "client", ...data };
    db.users.push(u); return u;
  }
  updateUser(id: number, data: Partial<InsertUser>) {
    const i = db.users.findIndex(u => u.id === id);
    if (i === -1) return undefined;
    db.users[i] = { ...db.users[i], ...data };
    return db.users[i];
  }
  getAllClients() { return db.users.filter(u => u.role === "client"); }

  getPrograms(coachId: number) { return db.programs.filter(p => p.coachId === coachId); }
  getProgramById(id: number) { return db.programs.find(p => p.id === id); }
  createProgram(data: InsertProgram): Program {
    const p: Program = { id: uid(), description: null, durationWeeks: 4, isTemplate: false, createdAt: Date.now(), ...data };
    db.programs.push(p); return p;
  }
  updateProgram(id: number, data: Partial<InsertProgram>) {
    const i = db.programs.findIndex(p => p.id === id);
    if (i === -1) return undefined;
    db.programs[i] = { ...db.programs[i], ...data };
    return db.programs[i];
  }
  deleteProgram(id: number) { db.programs = db.programs.filter(p => p.id !== id); }

  assignProgram(data: InsertClientProgram): ClientProgram {
    const cp: ClientProgram = { id: uid(), status: "active", assignedAt: Date.now(), ...data };
    db.clientPrograms.push(cp); return cp;
  }
  getClientPrograms(clientId: number) { return db.clientPrograms.filter(cp => cp.clientId === clientId); }
  getActiveClientProgram(clientId: number) {
    return db.clientPrograms.find(cp => cp.clientId === clientId && cp.status === "active");
  }
  updateClientProgram(id: number, data: Partial<InsertClientProgram>) {
    const i = db.clientPrograms.findIndex(cp => cp.id === id);
    if (i === -1) return undefined;
    db.clientPrograms[i] = { ...db.clientPrograms[i], ...data };
    return db.clientPrograms[i];
  }

  getWorkoutsByProgram(programId: number) { return db.workouts.filter(w => w.programId === programId); }
  getWorkoutById(id: number) { return db.workouts.find(w => w.id === id); }
  createWorkout(data: InsertWorkout): Workout {
    const w: Workout = {
      id: uid(), type: "traditional", notes: null, timeCap: null, roundCount: null,
      workInterval: null, restInterval: null, scoreType: null, blocks: null,
      weekNumber: 1, createdAt: Date.now(), ...data
    };
    db.workouts.push(w); return w;
  }
  updateWorkout(id: number, data: Partial<InsertWorkout>) {
    const i = db.workouts.findIndex(w => w.id === id);
    if (i === -1) return undefined;
    db.workouts[i] = { ...db.workouts[i], ...data };
    return db.workouts[i];
  }
  deleteWorkout(id: number) { db.workouts = db.workouts.filter(w => w.id !== id); }

  createWorkoutLog(data: InsertWorkoutLog): WorkoutLog {
    const wl: WorkoutLog = { id: uid(), completedAt: Date.now(), duration: null, score: null, notes: null, setLogs: null, rating: null, ...data };
    db.workoutLogs.push(wl); return wl;
  }
  getWorkoutLogs(clientId: number) {
    return db.workoutLogs.filter(wl => wl.clientId === clientId).sort((a, b) => b.completedAt - a.completedAt);
  }
  getWorkoutLogsByWorkout(workoutId: number) { return db.workoutLogs.filter(wl => wl.workoutId === workoutId); }

  sendMessage(data: InsertMessage): Message {
    const m: Message = { id: uid(), isRead: false, sentAt: Date.now(), ...data };
    db.messages.push(m); return m;
  }
  getConversation(userId1: number, userId2: number) {
    return db.messages
      .filter(m => (m.fromId === userId1 && m.toId === userId2) || (m.fromId === userId2 && m.toId === userId1))
      .sort((a, b) => a.sentAt - b.sentAt);
  }
  getInbox(userId: number) {
    return db.messages.filter(m => m.fromId === userId || m.toId === userId).sort((a, b) => b.sentAt - a.sentAt);
  }
  markRead(messageId: number) {
    const m = db.messages.find(m => m.id === messageId);
    if (m) m.isRead = true;
  }

  getCommunityPosts() { return [...db.communityPosts].sort((a, b) => b.createdAt - a.createdAt); }
  createCommunityPost(data: InsertCommunityPost): CommunityPost {
    const p: CommunityPost = { id: uid(), type: "post", title: null, imageUrl: null, likesJson: "[]", createdAt: Date.now(), ...data };
    db.communityPosts.push(p); return p;
  }
  toggleLike(postId: number, userId: number) {
    const p = db.communityPosts.find(p => p.id === postId);
    if (!p) return undefined;
    const likes: number[] = JSON.parse(p.likesJson || "[]");
    const idx = likes.indexOf(userId);
    if (idx === -1) likes.push(userId); else likes.splice(idx, 1);
    p.likesJson = JSON.stringify(likes);
    return p;
  }
  getComments(postId: number) { return db.communityComments.filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt); }
  createComment(data: InsertCommunityComment): CommunityComment {
    const c: CommunityComment = { id: uid(), createdAt: Date.now(), ...data };
    db.communityComments.push(c); return c;
  }

  getResources() { return [...db.resources].sort((a, b) => b.uploadedAt - a.uploadedAt); }
  createResource(data: InsertResource): Resource {
    const r: Resource = { id: uid(), description: null, category: "teaching", fileSize: null, uploadedAt: Date.now(), ...data };
    db.resources.push(r); return r;
  }
  deleteResource(id: number) { db.resources = db.resources.filter(r => r.id !== id); }
  getResourceFull(id: number) { return db.resources.find(r => r.id === id); }

  createHabitLog(data: InsertHabitLog): HabitLog {
    const h: HabitLog = { id: uid(), water: null, sleep: null, nutrition: null, stress: null, notes: null, loggedAt: Date.now(), ...data };
    db.habitLogs.push(h); return h;
  }
  getHabitLogs(clientId: number) {
    return db.habitLogs.filter(h => h.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date));
  }
  getHabitLogByDate(clientId: number, date: string) {
    return db.habitLogs.find(h => h.clientId === clientId && h.date === date);
  }
}

export const storage = new Storage();

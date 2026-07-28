/**
 * Workspace file store — Firestore-backed persistent storage.
 *
 * Replaces the in-memory store with Cloud Firestore so workspace files
 * survive page refreshes and are scoped per-user.
 *
 * Data model (collection: "workspace/{userId}/files"):
 *   - title: string
 *   - type: "research_report" | "investment_memo" | "briefing" | "company_analysis"
 *   - content: string
 *   - createdBy: "scout" | "briefing"
 *   - companyId?: string
 *   - companyName?: string
 *   - modelUsed?: string
 *   - sourceQuery?: string
 *   - createdAt: Timestamp (server timestamp)
 */

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WorkspaceFile {
  id: string;
  title: string;
  type: "research_report" | "investment_memo" | "briefing" | "company_analysis";
  content: string;
  createdAt: string; // ISO string on the client
  createdBy: "scout" | "briefing";
  companyId?: string;
  companyName?: string;
  modelUsed?: string;
  sourceQuery?: string;
}

export type FilesChangeListener = (files: WorkspaceFile[]) => void;

// ── Helpers ────────────────────────────────────────────

function fromFirestore(
  id: string,
  data: Record<string, unknown>,
): WorkspaceFile {
  const ts = data.createdAt as Timestamp | undefined;
  return {
    id,
    title: (data.title as string) || "",
    type:
      (data.type as WorkspaceFile["type"]) || "research_report",
    content: (data.content as string) || "",
    createdAt: ts ? ts.toDate().toISOString() : new Date().toISOString(),
    createdBy:
      (data.createdBy as WorkspaceFile["createdBy"]) || "scout",
    companyId: data.companyId as string | undefined,
    companyName: data.companyName as string | undefined,
    modelUsed: data.modelUsed as string | undefined,
    sourceQuery: data.sourceQuery as string | undefined,
  };
}

function userFilesPath(userId: string): string {
  return `users/${userId}/files`;
}

// ── Public API ───────────────────────────────────────────

export async function addFile(
  userId: string,
  file: Omit<WorkspaceFile, "id" | "createdAt">,
): Promise<WorkspaceFile | null> {
  try {
    const ref = await addDoc(
      collection(db, userFilesPath(userId)),
      {
        ...file,
        createdAt: serverTimestamp(),
      },
    );
    return {
      ...file,
      id: ref.id,
      createdAt: new Date().toISOString(),
    } as WorkspaceFile;
  } catch (err) {
    console.error("Failed to add workspace file:", err);
    return null;
  }
}

export async function deleteFile(userId: string, fileId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, userFilesPath(userId), fileId));
  } catch (err) {
    console.error("Failed to delete workspace file:", err);
  }
}

/**
 * Subscribe to real-time workspace file updates for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToFiles(
  userId: string,
  listener: FilesChangeListener,
): () => void {
  const q = query(
    collection(db, userFilesPath(userId)),
    orderBy("createdAt", "desc"),
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const files: WorkspaceFile[] = [];
      snapshot.forEach((doc) => {
        files.push(fromFirestore(doc.id, doc.data()));
      });
      listener(files);
    },
    (err) => {
      console.error("Workspace subscription error:", err);
      listener([]);
    },
  );

  return unsub;
}

// ── Seed helpers (used when migrating) ──────────────────

const SEED_KEY = "startupwiki:workspace:seeded";

export function hasBeenSeeded(): boolean {
  return localStorage.getItem(SEED_KEY) === "true";
}

export function markSeeded(): void {
  localStorage.setItem(SEED_KEY, "true");
}

export async function seedWorkspace(userId: string): Promise<void> {
  if (hasBeenSeeded()) return;

  await addFile(userId, {
    title: "AI Robotics Startup Landscape",
    type: "research_report",
    content:
      "## Top Companies\n\n- **RoboSynth**: General-purpose robotics foundation models. Series A, $32M raised.\n\n## Market Overview\n\nAI robotics sector experiencing unprecedented growth.",
    createdBy: "scout",
    sourceQuery: "Find promising AI robotics startups",
    modelUsed: "meta/llama-3.3-70b-instruct",
  });

  await addFile(userId, {
    title: "Synthex Bio — Investment Memo",
    type: "briefing",
    content:
      "## Executive Summary\n\nSynthex Bio combines generative AI with synthetic biology.\n\n## Recommendation\n\nStrong Buy.",
    createdBy: "briefing",
    companyId: "synthex-bio",
    companyName: "Synthex Bio",
    modelUsed: "meta/llama-3.3-70b-instruct",
  });

  markSeeded();
}

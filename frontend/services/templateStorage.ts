import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Task } from "../context/TasksContext";

export interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  icon: string;
  iconBg: string;
  subtasks: Array<{
    id: string;
    text: string;
    isAdding: boolean;
    isGenarated: boolean;
    isDone: boolean;
    durationMinutes?: number;
    notes?: string;
    order?: number;
    dependsOn?: string[];
  }>;
  createdAt: string; // ISO timestamp
}

/**
 * Save a task as a template.
 * Path: users/{uid}/templates/{templateId}
 */
export async function saveTemplate(
  userId: string,
  task: Task
): Promise<TaskTemplate | null> {
  try {
    const templateId = `tpl_${Date.now()}`;
    const template: TaskTemplate = {
      id: templateId,
      title: task.title,
      category: task.category,
      icon: task.icon,
      iconBg: task.iconBg,
      subtasks: (task.subtasks ?? []).map((st) => ({
        id: st.id,
        text: st.text,
        isAdding: false,
        isGenarated: st.isGenarated,
        isDone: false,
        durationMinutes: st.durationMinutes,
        notes: st.notes,
        order: st.order,
        dependsOn: st.dependsOn,
      })),
      createdAt: new Date().toISOString(),
    };

    await setDoc(
      doc(db, "users", userId, "templates", templateId),
      template
    );

    return template;
  } catch (e) {
    console.warn("saveTemplate failed:", e);
    return null;
  }
}

/**
 * Get all templates for a user, sorted by createdAt descending.
 * Path: users/{uid}/templates
 */
export async function getTemplates(userId: string): Promise<TaskTemplate[]> {
  try {
    const q = query(
      collection(db, "users", userId, "templates"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as TaskTemplate);
  } catch (e) {
    console.warn("getTemplates failed:", e);
    return [];
  }
}

/**
 * Delete a template.
 * Path: users/{uid}/templates/{templateId}
 */
export async function deleteTemplate(
  userId: string,
  templateId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", userId, "templates", templateId));
  } catch (e) {
    console.warn("deleteTemplate failed:", e);
  }
}
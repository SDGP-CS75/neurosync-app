import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  dueDate?: string | null;
  completed?: boolean;
  createdAt: string;
  updatedAt: string;
  pendingSync?: boolean;
}

const TASKS_STORAGE_KEY = 'offline_tasks';

const isOnline = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

const saveTasksLocally = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks locally:', error);
  }
};

const getLocalTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error getting local tasks:', error);
    return [];
  }
};

export const getTasks = async (): Promise<Task[]> => {
  const online = await isOnline();
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    return await getLocalTasks();
  }
  
  if (online) {
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const tasks: Task[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    await saveTasksLocally(tasks);
    return tasks;
  }
  
  return await getLocalTasks();
};

export const createTask = async (taskData: Partial<Task>): Promise<Task> => {
  const online = await isOnline();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const newTask: Task = {
    id: '',
    title: taskData.title || '',
    description: taskData.description || '',
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'medium',
    dueDate: taskData.dueDate || null,
    completed: taskData.completed || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (!user) {
    const localTasks = await getLocalTasks();
    newTask.id = 'local_' + Date.now();
    localTasks.push(newTask);
    await saveTasksLocally(localTasks);
    return newTask;
  }
  
  if (online) {
    const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), newTask);
    newTask.id = docRef.id;
    const localTasks = await getLocalTasks();
    localTasks.push(newTask);
    await saveTasksLocally(localTasks);
    return newTask;
  }
  
  newTask.id = 'offline_' + Date.now();
  newTask.pendingSync = true;
  const localTasks = await getLocalTasks();
  localTasks.push(newTask);
  await saveTasksLocally(localTasks);
  return newTask;
};

export const updateTask = async (taskId: string, taskData: Partial<Task>): Promise<Task> => {
  const online = await isOnline();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const updateData = { ...taskData, updatedAt: new Date().toISOString() };
  
  if (!user || taskId.startsWith('local_') || taskId.startsWith('offline_')) {
    const localTasks = await getLocalTasks();
    const index = localTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      localTasks[index] = { ...localTasks[index], ...updateData };
      await saveTasksLocally(localTasks);
    }
    return { id: taskId, ...updateData } as Task;
  }
  
  if (online) {
    await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), updateData);
    const localTasks = await getLocalTasks();
    const index = localTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      localTasks[index] = { ...localTasks[index], ...updateData };
      await saveTasksLocally(localTasks);
    }
    return { id: taskId, ...updateData } as Task;
  }
  
  const localTasks = await getLocalTasks();
  const idx = localTasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    localTasks[idx] = { ...localTasks[idx], ...updateData, pendingSync: true };
    await saveTasksLocally(localTasks);
  }
  return { id: taskId, ...updateData } as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const online = await isOnline();
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user || taskId.startsWith('local_') || taskId.startsWith('offline_')) {
    const localTasks = await getLocalTasks();
    await saveTasksLocally(localTasks.filter(t => t.id !== taskId));
    return;
  }
  
  if (online) {
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
  }
  
  const localTasks = await getLocalTasks();
  await saveTasksLocally(localTasks.filter(t => t.id !== taskId));
};

export const toggleTaskCompletion = async (taskId: string): Promise<Task> => {
  const localTasks = await getLocalTasks();
  const task = localTasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  return await updateTask(taskId, { completed: !task.completed });
};

export const syncOfflineTasks = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) return;
  
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;
  
  const localTasks = await getLocalTasks();
  const pendingTasks = localTasks.filter(t => t.pendingSync);
  
  for (const task of pendingTasks) {
    const { id, pendingSync, ...taskData } = task;
    await addDoc(collection(db, 'users', user.uid, 'tasks'), taskData);
  }
  
  const q = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const tasks: Task[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  await saveTasksLocally(tasks);
};

export const clearLocalTasks = async (): Promise<void> => {
  await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
};

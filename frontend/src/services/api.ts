import axios from 'axios';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetTime: string; // ISO string format
  tasks: GoalTask[];
  createdAt: string;
}

// TOGGLE THIS TO SWITCH BETWEEN MOCK DATA (CLIENT DEMO) AND REAL BACKEND API CALLS
const USE_MOCK = false;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Intercept requests to add the Authorization token if present
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- MOCK IN-MEMORY DB (Simulates Backend/Database) ---
let mockTodos: Todo[] = [];
let mockGoals: Goal[] = [];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- API METHODS ---

export const api = {
  // === AUTH API ===
  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 requires username
    formData.append('password', password);

    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },

  async register(email: string, password: string): Promise<User> {
    const response = await axios.post<User>(`${API_BASE_URL}/auth/register`, { email, password });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  async getMe(): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`);
    return response.data;
  },

  // === TODO API ===

  async getTodos(): Promise<Todo[]> {
    if (USE_MOCK) {
      await sleep(600);
      return [...mockTodos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const response = await axios.get<Todo[]>(`${API_BASE_URL}/todos`);
    return response.data;
  },

  async createTodo(title: string): Promise<Todo> {
    if (USE_MOCK) {
      await sleep(400);
      const newTodo: Todo = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        completed: false,
        createdAt: new Date().toISOString()
      };
      mockTodos.push(newTodo);
      return newTodo;
    }

    const response = await axios.post<Todo>(`${API_BASE_URL}/todos`, { title });
    return response.data;
  },

  async toggleTodo(id: string, completed: boolean): Promise<Todo> {
    if (USE_MOCK) {
      await sleep(300);
      const todo = mockTodos.find(t => t.id === id);
      if (!todo) throw new Error('Todo not found');
      todo.completed = completed;
      return { ...todo };
    }

    const response = await axios.patch<Todo>(`${API_BASE_URL}/todos/${id}/toggle`, { completed });
    return response.data;
  },

  async deleteTodo(id: string): Promise<void> {
    if (USE_MOCK) {
      await sleep(300);
      mockTodos = mockTodos.filter(t => t.id !== id);
      return;
    }

    await axios.delete(`${API_BASE_URL}/todos/${id}`);
  },

  // === GOALS API ===

  async getGoals(): Promise<Goal[]> {
    if (USE_MOCK) {
      await sleep(600);
      return [...mockGoals];
    }

    const response = await axios.get<Goal[]>(`${API_BASE_URL}/goals`);
    return response.data;
  },

  async createGoal(title: string, targetTime: string, tasks: string[]): Promise<Goal> {
    if (USE_MOCK) {
      await sleep(500);
      const newGoal: Goal = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        targetTime,
        createdAt: new Date().toISOString(),
        tasks: tasks.map((taskTitle) => ({
          id: Math.random().toString(36).substring(2, 9),
          title: taskTitle,
          completed: false,
        })),
      };
      mockGoals.push(newGoal);
      return newGoal;
    }

    const response = await axios.post<Goal>(`${API_BASE_URL}/goals`, { title, targetTime, tasks });
    return response.data;
  },

  async toggleGoalTask(goalId: string, taskId: string, completed: boolean): Promise<Goal> {
    if (USE_MOCK) {
      await sleep(300);
      const goal = mockGoals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      const task = goal.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      task.completed = completed;
      return { ...goal };
    }

    const response = await axios.patch<Goal>(`${API_BASE_URL}/goals/${goalId}/tasks/${taskId}/toggle`, { completed });
    return response.data;
  },

  async deleteGoal(id: string): Promise<void> {
    if (USE_MOCK) {
      await sleep(300);
      mockGoals = mockGoals.filter(g => g.id !== id);
      return;
    }

    await axios.delete(`${API_BASE_URL}/goals/${id}`);
  }
};

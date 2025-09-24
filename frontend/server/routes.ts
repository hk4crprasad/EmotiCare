import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// Mock user interface that matches frontend expectations
interface MockUser {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  phone_number?: string;
  role: string;
  password: string;
  created_at: string;
}

// Simple in-memory storage for mock data
class MockStorage {
  private users: Map<string, MockUser> = new Map();
  private sessions: Map<string, string> = new Map(); // token -> userId

  async createUser(userData: Omit<MockUser, 'id' | 'created_at'>): Promise<MockUser> {
    const id = randomUUID();
    const user: MockUser = {
      ...userData,
      id,
      created_at: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<MockUser | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserById(id: string): Promise<MockUser | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updates: Partial<MockUser>): Promise<MockUser | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  createSession(userId: string): string {
    const token = `mock_token_${randomUUID()}`;
    this.sessions.set(token, userId);
    return token;
  }

  getUserFromToken(token: string): string | undefined {
    return this.sessions.get(token);
  }

  removeSession(token: string): void {
    this.sessions.delete(token);
  }
}

const mockStorage = new MockStorage();

// Middleware to extract user from Bearer token
function extractUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = mockStorage.getUserFromToken(token);
    if (userId) {
      req.userId = userId;
    }
  }
  next();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post('/api/v1/auth/register', async (req, res) => {
    try {
      const { email, full_name, password, role = 'student', student_id } = req.body;
      
      // Check if user already exists
      const existingUser = await mockStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = await mockStorage.createUser({
        email,
        full_name,
        password, // In real app, this would be hashed
        role,
        student_id,
      });

      // Create session token
      const token = mockStorage.createSession(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          student_id: user.student_id,
          phone_number: user.phone_number,
          role: user.role,
        },
        access_token: token,
        token_type: 'bearer'
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by email (username is email in this case)
      const user = await mockStorage.getUserByEmail(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session token
      const token = mockStorage.createSession(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          student_id: user.student_id,
          phone_number: user.phone_number,
          role: user.role,
        },
        access_token: token,
        token_type: 'bearer'
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.use(extractUser);

  app.get('/api/v1/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await mockStorage.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        student_id: user.student_id,
        phone_number: user.phone_number,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.put('/api/v1/auth/me', requireAuth, async (req, res) => {
    try {
      const { full_name, phone_number } = req.body;
      const user = await mockStorage.updateUser(req.userId, {
        full_name,
        phone_number,
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        student_id: user.student_id,
        phone_number: user.phone_number,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.post('/api/v1/auth/change-password', requireAuth, async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const user = await mockStorage.getUserById(req.userId);
      
      if (!user || user.password !== current_password) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      await mockStorage.updateUser(req.userId, { password: new_password });
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  app.post('/api/v1/auth/logout', requireAuth, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        mockStorage.removeSession(token);
      }
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

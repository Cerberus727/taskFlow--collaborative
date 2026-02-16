import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/db.js';

describe('Board Module', () => {
  let token;
  let userId;
  let boardId;
  
  const testUser = {
    name: 'Board Test User',
    email: 'boardtest@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Register test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    token = registerResponse.body.token;
    userId = registerResponse.body.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.activity.deleteMany({
      where: { board: { members: { some: { userId } } } },
    });
    await prisma.task.deleteMany({
      where: { list: { board: { members: { some: { userId } } } } },
    });
    await prisma.list.deleteMany({
      where: { board: { members: { some: { userId } } } },
    });
    await prisma.boardMember.deleteMany({
      where: { userId },
    });
    await prisma.board.deleteMany({
      where: { members: { some: { userId } } },
    });
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/boards', () => {
    it('should create a new board', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Board',
          description: 'A test board',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Board');
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0].role).toBe('owner');

      boardId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/boards')
        .send({ title: 'Unauthorized Board' });

      expect(response.status).toBe(401);
    });

    it('should require a title', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/boards', () => {
    it('should return all boards for the user', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/boards');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/boards/:id', () => {
    it('should return a specific board with lists and tasks', async () => {
      const response = await request(app)
        .get(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(boardId);
      expect(response.body).toHaveProperty('lists');
      expect(response.body).toHaveProperty('members');
    });

    it('should return 404 for non-existent board', async () => {
      const response = await request(app)
        .get('/api/boards/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/boards/:id', () => {
    it('should update board details', async () => {
      const response = await request(app)
        .put(`/api/boards/${boardId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Board Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Board Title');
    });
  });

  describe('DELETE /api/boards/:id', () => {
    it('should delete a board', async () => {
      // Create a board to delete
      const createResponse = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Board to Delete' });

      const deleteId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/boards/${deleteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Board deleted successfully');

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/boards/${deleteId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(404);
    });
  });
});

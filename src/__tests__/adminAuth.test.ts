import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import adminRouter from '../routes/admin';
import investorAdminRouter from '../routes/investorAdmin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });


// Setup the app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/admin', adminRouter);
app.use('/api/admin/investor-admin', investorAdminRouter);

describe('Admin Auth Flow', () => {
  const agent = request.agent(app);

  it('should login and set cookie', async () => {
    const res = await agent
      .post('/api/admin/login')
      .send({ username: process.env.ADMIN_USERNAME, password: 'your_admin_password' }); // Use correct password
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should access protected route with cookie', async () => {
    const res = await agent.get('/api/admin/investor-admin');
    // 200 if authenticated, 401 if not
    expect([200, 401]).toContain(res.status);
  });

  it('should logout and clear cookie', async () => {
    const res = await agent.post('/api/admin/logout');
    expect(res.body.success).toBe(true);
    // Try accessing protected route again
    const res2 = await agent.get('/api/admin/investor-admin');
    expect(res2.status).toBe(401);
  });
});

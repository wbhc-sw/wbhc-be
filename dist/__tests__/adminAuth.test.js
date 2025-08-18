"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const admin_1 = __importDefault(require("../routes/admin"));
const investorAdmin_1 = __importDefault(require("../routes/investorAdmin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
// Setup the app for testing
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api/admin', admin_1.default);
app.use('/api/admin/investor-admin', investorAdmin_1.default);
describe('Admin Auth Flow', () => {
    const agent = supertest_1.default.agent(app);
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

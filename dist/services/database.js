"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Create a single Prisma client instance
exports.prisma = new client_1.PrismaClient();

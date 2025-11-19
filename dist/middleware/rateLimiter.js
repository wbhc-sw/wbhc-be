"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nonGetRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limiter that excludes GET requests
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    },
    skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
});
// Alternative: Rate limiter only for non-GET requests
exports.nonGetRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    },
    skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
});

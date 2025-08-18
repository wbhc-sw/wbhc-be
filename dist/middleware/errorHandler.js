"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        details: err.details || undefined,
    });
}

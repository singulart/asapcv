"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailRoutes = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.emailRoutes = router;
// POST /api/email/process (internal endpoint for SES webhook)
router.post('/process', async (req, res, next) => {
    try {
        // TODO: Implement email processing logic for SES webhook
        res.status(501).json({
            message: 'Email processing endpoint - implementation pending (Internal use)',
            endpoint: 'POST /api/email/process'
        });
    }
    catch (error) {
        next((0, errorHandler_1.createApiError)('Email processing failed', 500, 'EMAIL_PROCESS_ERROR'));
    }
});

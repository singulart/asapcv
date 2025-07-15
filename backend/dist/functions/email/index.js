"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailResponder = exports.emailHandler = void 0;
// Email processing Lambda functions
var email_handler_1 = require("./email-handler");
Object.defineProperty(exports, "emailHandler", { enumerable: true, get: function () { return email_handler_1.handler; } });
var email_responder_1 = require("./email-responder");
Object.defineProperty(exports, "emailResponder", { enumerable: true, get: function () { return email_responder_1.handler; } });

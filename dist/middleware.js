"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader;
    if (!token) {
        return res.status(401).send("Authorization failed. No access token found");
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "", (err, user) => {
        if (err) {
            return res.status(403).send("Could not verify token");
        }
        req.body.userId = user.id;
    });
    next();
};
exports.default = authenticateToken;

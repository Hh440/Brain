"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const middleware_1 = __importDefault(require("./middleware"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const prisma = new client_1.PrismaClient();
const port = 3000;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                message: "Username or password is not defined"
            });
        }
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: "Password must be 8-20 characters and include lowercase, uppercase, number, and special character.",
            });
        }
        const user = yield prisma.user.create({
            data: {
                email: email,
                username: username,
                password: password
            }
        });
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
        }, process.env.JWT_SECRET || "");
        return res.status(201).json({
            message: "User created Successfully",
            token
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Error while creating user"
        });
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({
                message: "Username or password is not defined"
            });
        }
        const user = yield prisma.user.findFirst({
            where: {
                email,
                password
            }
        });
        if (!user) {
            return res.status(404).json({
                message: "Email or Password is incorrect"
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "");
        return res.status(200).json({
            message: "User is Logged in successfuly",
            token
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Error while signin"
        });
    }
}));
app.post("/api/v1/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { link, tags, title, type } = req.body;
    const { userId } = req.body;
    try {
        const content = yield prisma.content.create({
            data: {
                link,
                title,
                type,
                userId,
                tags: {
                    connect: tags.map((tagId) => ({ id: tagId })),
                }
            }
        });
        return res.status(200).json({
            message: "Content is created successfully",
            content
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).json("Error while creating the content");
    }
}));
app.get("/api/v1/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = yield prisma.content.findMany({});
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Error while fetching contents"
        });
    }
}));
app.delete("/api/v1/content", (req, res) => {
});
app.post("/api/v1/brain/share", (req, res) => {
});
app.get("/api/v1/brain/:shareLink", (req, res) => {
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

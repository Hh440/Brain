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
const crypto_1 = __importDefault(require("crypto"));
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
                message: "email or password is not defined"
            });
        }
        // if (!PASSWORD_REGEX.test(password)) {
        //     return res.status(400).json({
        //     message: "Password must be 8-20 characters and include lowercase, uppercase, number, and special character.",
        //     });
        // }
        const user = yield prisma.user.create({
            data: {
                email: email,
                username: username,
                password: password
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET || "");
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
                message: "Incorrect Credentials"
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
        const tagIds = yield Promise.all(tags.map((tagName) => __awaiter(void 0, void 0, void 0, function* () {
            const existingtags = yield prisma.tags.findUnique({
                where: {
                    title: tagName
                }
            });
            if (existingtags) {
                return existingtags.id;
            }
            const newTag = yield prisma.tags.create({ data: { title: tagName } });
            return newTag.id;
        })));
        const content = yield prisma.content.create({
            data: {
                link,
                title,
                type,
                userId,
                tags: {
                    connect: tagIds.map((id) => ({ id })),
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
    const { userId } = req.body;
    try {
        const content = yield prisma.content.findMany({
            where: {
                userId
            },
            select: {
                id: true,
                title: true,
                link: true,
                type: true,
                tags: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        return res.json({
            // message:"Content Loaded Successfully",
            content
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Error while fetching contents"
        });
    }
}));
app.delete("/api/v1/content", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    try {
        const contentId = parseInt(id, 10);
        const content = yield prisma.content.delete({
            where: {
                id: contentId
            }
        });
        return res.status(200).json({
            message: "Deletion successfully"
        });
    }
    catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Error while deleting"
        });
    }
}));
app.get("/api/v1/tags", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tags = yield prisma.tags.findMany({
            select: {
                title: true,
            },
        });
        if (!tags || tags.length === 0) {
            return res.status(404).json({
                message: "No tags found",
                tags: [],
            });
        }
        return res.status(200).json({
            message: "All tags fetched successfully",
            tags,
        });
    }
    catch (error) {
        console.error("Error fetching tags:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.post("/api/v1/brain/share", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //  const {contentId,userId}=req.body
    const { share, userId } = req.body;
    try {
        if (share) {
            // const content= await prisma.content.findFirst({
            //     where:{
            //         userId
            //     }
            // })
            // if(!content){
            //     return res.status(401).json({
            //         message:"Content is not present with the associated user"
            //     })
            // }
            const existingLink = yield prisma.link.findFirst({
                where: {
                    userId: userId
                }
            });
            if (existingLink) {
                return res.status(200).json({
                    message: "You have already shared your content",
                    hash: existingLink.hash
                });
            }
            const shareLink = crypto_1.default.randomBytes(16).toString('hex');
            const share = yield prisma.link.create({
                data: {
                    hash: shareLink,
                    userId
                }
            });
            return res.status(200).json({
                message: "Successfuly generated share link",
                hash: share.hash
            });
        }
        else {
            const share = yield prisma.link.delete({
                where: {
                    userId
                }
            });
            return res.status(200).json({
                message: "Removed Link successfully"
            });
        }
    }
    catch (e) {
        console.log(e);
        return res.status(401).json({
            message: "Error while creating the share Link"
        });
    }
}));
app.get("/api/v1/brain/:shareLink", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shareLink = req.params.shareLink;
    try {
        const link = yield prisma.link.findUnique({
            where: {
                hash: shareLink
            },
        });
        if (!link) {
            return res.status(401).json({
                message: "Share Link is not valid"
            });
        }
        const content = yield prisma.content.findMany({
            where: {
                userId: link.userId
            }, select: {
                id: true,
                title: true,
                link: true,
                type: true,
                tags: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!content) {
            return res.status(401).json({
                message: "No Conetn is assocaited"
            });
        }
        const user = yield prisma.user.findFirst({
            where: {
                id: link.userId
            }
        });
        if (!user) {
            return res.status(401).json({
                message: "user not found"
            });
        }
        return res.status(200).json({
            username: user.username,
            content: content
        });
    }
    catch (e) {
        console.log(e);
        return res.status(401).json({
            message: "Error while accessing the share link"
        });
    }
}));
app.get("/api/v1/content/twitter", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const content = yield prisma.content.findMany({
            where: {
                userId,
                type: "twitter"
            }, select: {
                id: true,
                title: true,
                link: true,
                type: true,
                tags: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!content) {
            return res.json;
        }
        return res.status(200).json({
            message: "Succeddfuly fectched twitter post",
            content
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Errow while fectching"
        });
    }
}));
app.get("/api/v1/content/youtube", middleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const content = yield prisma.content.findMany({
            where: {
                userId,
                type: "youtube"
            }, select: {
                id: true,
                title: true,
                link: true,
                type: true,
                tags: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });
        if (!content) {
            return res.json;
        }
        return res.status(200).json({
            message: "Succeddfuly fectched youtube post",
            content
        });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Errow while fectching"
        });
    }
}));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

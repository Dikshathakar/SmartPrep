const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const connectDB = require("./config/db");
const { verifyUser } = require("./middleware/auth");

require("./scrapers/scheduler");

const InterviewQuestion = require("./models/InterviewQuestions");
const AdminInterviewBank = require("./models/AdminInterviewBank");
const SearchHistory = require("./models/SearchHistory");

dotenv.config();
const app = express();
connectDB();

const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);

// ✅ Core middleware
app.use(cookieParser());

const sessionConfig = {
    secret:
        process.env.SESSION_SECRET ||
        "4b849e531ce63ae2c351fb3a23641d1b6636a82b3faac7c7942d649679edb94705a2f3988d1f69fc277f09eb368e3518fa98503f02a9ecad12e20c424599cba4",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl:
            process.env.MONGODB_URI ||
            "mongodb://127.0.0.1:27017/SmartPrepManagerDB",
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
};
app.use(session(sessionConfig));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
// Core body parsing (KEEP THIS ABOVE all routes)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cors());



// ✅ CSRF Middleware (Skip for Excel Upload Routes)
// ✅ CSRF Middleware (Skip for Excel Upload Routes)
const csrfMiddleware = csrf();

app.use((req, res, next) => {
    const skip =
        req.method === "POST" &&
        (req.originalUrl === "/admin/upload-excel" ||
         req.originalUrl === "/admin/upload-students" ||
         req.originalUrl === "/admin/uploadInterviewExcel");

    if (skip) {
        // don’t attach csrf for these routes
        return next();
    }

    // apply csrf check
    csrfMiddleware(req, res, next);
});

app.use((req, res, next) => {
    try {
        if (req.csrfToken) {
            res.locals.csrfToken = req.csrfToken();
        } else {
            res.locals.csrfToken = "";
        }
    } catch (err) {
        res.locals.csrfToken = "";
    }
    res.locals.user = req.session?.user || null;
    next();
});


function noCache(req, res, next) {
    res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    next();
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use('/models', express.static(path.join(__dirname, 'public/models')));


// ✅ Import Routes
const indexRoutes = require("./routes/indexRoutes");
const studentRoutes = require("./routes/studentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const testRoutes = require("./routes/testRoutes");
const resultRoutes = require("./routes/resultRoutes");
const questionRoutes = require("./routes/questionRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminContactRoutes = require("./routes/adminContactRoutes");
const userRoutes = require("./routes/userRoutes");
const adminQuestionsRoutes = require("./routes/adminQuestions");

// ✅ Use Routes
app.use("/", indexRoutes);
app.use("/admin", noCache, adminRoutes);
app.use("/", studentRoutes);
app.use("/api/student", studentRoutes);
app.use("/auth", noCache, authRoutes);
app.use("/api/results", resultRoutes);
app.use("/test", testRoutes);
app.use("/questions", questionRoutes);
app.use("/user/chatbot", chatbotRoutes);
app.use("/contactus", contactRoutes);
app.use("/admin", adminContactRoutes);
app.use("/user", verifyUser, userRoutes);
app.use("/admin", adminQuestionsRoutes);
app.use("/logout", authRoutes);
app.use(methodOverride("_method"));


app.get("/instructions", (req, res) => res.render("instructions"));
app.get("/user", (req, res) => res.redirect("/user/test/list"));
app.get("/dashboard", (req, res) => res.redirect("/user/dashboard"));

const sharedSession = require("express-socket.io-session");
io.use(sharedSession(session(sessionConfig), { autoSave: true }));

// ✅ Load Companies for Chatbot Suggestions
let availableCompanies = [];
const loadCompanies = async () => {
    try {
        const result = await InterviewQuestion.distinct("company");
        availableCompanies = result.map((c) => c.toLowerCase());
        console.log("✅ Loaded companies:", availableCompanies.length);
    } catch (err) {
        console.error("❌ Failed to load company list:", err);
    }
};
loadCompanies();

// ✅ Socket.IO (Uses PRN instead of Email)
io.on("connection", (socket) => {
    const userSession = socket.handshake.session?.user;

    if (!userSession || !userSession._id) {
        console.log("❌ Unauthorized user tried to connect via socket.io");
        socket.disconnect();
        return;
    }

    const userId = userSession._id;
    const prn = userSession.prn; // ✅ Changed from email
    console.log(`✅ User connected via socket.io: ${prn}`);

    socket.on("user-message", async (msg) => {
        const lowerMsg = msg.toLowerCase();

        try {
            const saved = await SearchHistory.create({ userId, query: msg });
            socket.emit("update-history", {
                _id: saved._id,
                query: saved.query,
                createdAt: saved.createdAt
            });
        } catch (err) {
            console.error("❌ Error saving search history:", err);
        }

        // ✅ Chatbot logic remains same
        if (lowerMsg.includes("recent") && lowerMsg.includes("asked")) {
            try {
                const adminRecent = await AdminInterviewBank.find({
                    type: "recentlyAsked"
                })
                    .sort({ createdAt: -1 })
                    .limit(5);
                if (adminRecent.length > 0) {
                    const questions = adminRecent.map((q) => ({
                        question: `${q.company} [${q.category}] → ${q.question}`,
                        answer: q.answer
                            ? `<pre><code>${q.answer}</code></pre>`
                            : "No answer provided."
                    }));
                    socket.emit("bot-message", { items: questions });
                } else {
                    socket.emit("bot-message", {
                        text: "No admin-added recently asked questions found."
                    });
                }
            } catch (err) {
                console.error(err);
                socket.emit("bot-message", {
                    text: "⚠️ Error fetching admin recent questions."
                });
            }
        } else if (
            lowerMsg.includes("frequent") &&
            lowerMsg.includes("asked")
        ) {
            try {
                const adminFreq = await AdminInterviewBank.find({
                    type: "frequentlyAsked"
                })
                    .sort({ createdAt: -1 })
                    .limit(5);
                if (adminFreq.length > 0) {
                    const questions = adminFreq.map((q) => ({
                        question: `${q.company} [${q.category}] → ${q.question}`,
                        answer: q.answer
                            ? `<pre><code>${q.answer}</code></pre>`
                            : "No answer provided."
                    }));
                    socket.emit("bot-message", { items: questions });
                } else {
                    socket.emit("bot-message", {
                        text: "No admin-added frequently asked questions found."
                    });
                }
            } catch (err) {
                console.error(err);
                socket.emit("bot-message", {
                    text: "⚠️ Error fetching admin frequent questions."
                });
            }
        } else if (
            lowerMsg.includes("interview") &&
            lowerMsg.includes("questions")
        ) {
            const matchedCompany = availableCompanies.find((company) =>
                lowerMsg.includes(company.toLowerCase())
            );
            if (matchedCompany) {
                try {
                    const companyQuestions = await InterviewQuestion.find({
                        company: new RegExp(`^${matchedCompany}$`, "i")
                    })
                        .sort({ createdAt: -1 })
                        .limit(5);

                    if (companyQuestions.length > 0) {
                        const formatted = companyQuestions
                            .map(
                                (q) =>
                                    `🔹 <a href="${q.link}" target="_blank">${q.title}</a>`
                            )
                            .join("<br><br>");
                        socket.emit("bot-message", {
                            text: `📘 Interview questions for *${matchedCompany}*:<br>${formatted}<hr>`
                        });
                    } else {
                        socket.emit("bot-message", {
                            text: `No recent scraped questions found for *${matchedCompany}*.`
                        });
                    }
                } catch (err) {
                    console.error(err);
                    socket.emit("bot-message", {
                        text: `⚠️ Error fetching scraped questions for ${matchedCompany}.`
                    });
                }
            } else {
                socket.emit("bot-message", {
                    text: "❓ I couldn't recognize the company. Try: *Interview questions*, *Google interview questions*, etc."
                });
            }
        } else {
            socket.emit("bot-message", {
                text: "🤖 Try asking: *Show me recently asked questions* or *frequently asked questions* or *Google interview questions*."
            });
        }
    });

    // ✅ Delete History
    socket.on("delete-history", async (queryId) => {
        try {
            const historyItem = await SearchHistory.findOne({
                _id: queryId,
                userId
            });

            if (!historyItem) {
                console.warn(
                    `⚠️ History item not found or unauthorized for delete: ${queryId}`
                );
                return;
            }

            await SearchHistory.deleteOne({ _id: queryId });
            console.log(`✅ Deleted history item ${queryId} for user ${prn}`);
            socket.emit("history-deleted", queryId);
        } catch (err) {
            console.error("❌ Error deleting history item:", err);
            socket.emit("error", "Failed to delete history item.");
        }
    });
});




const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
    console.log(`✅ Server running on http://localhost:${PORT}`)
);

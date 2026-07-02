require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const port = process.env.PORT || 8000;

// Database Connection
const connectDB = require("./utils/db");

const statusMointor = require("express-status-monitor");

// Routes
const authRoute = require("./router/auth-router");

const profileRoutes = require("./router/profile-router");
const leadershipTeamRouter = require("./router/leadertshiipTeam-router");

const ckeditorRoutes = require("./router/ckeditor-router");
const testimonialRoutes = require("./router/testimonial-router");
const clienteleRoutes = require("./router/clientele-router");
const coreTeamRouter = require("./router/coreTeam-router");
const locationRouter = require("./router/location-router");
const locationMainRouter = require("./router/locationMain-router");


const mediaCoverageRouter = require("./router/mediaCoverage-router");

//frontend
const blogCategoryRoutes = require("./router/blogCategoryRoutes");

const blogRoutes = require("./router/blog-router");
const articlesRoutes = require("./router/article-router");

const frontRoutes = require("./router/front-router");
const listRoutes = require("./router/list-router");

console.log(process.env.WEBSITE_URL);


console.log( process.env.FRONTEND_URL)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.WEBSITE_URL,
];

const corsOptions = {
  origin: function (origin, callback) {

    // Postman / no origin requests allow
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },

  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/profile', express.static(path.join(__dirname, 'public/profile')));
app.use('/blog', express.static(path.join(__dirname, 'public/blog')));
const safeTrackActivity = (req, res, next) => {
  if (req.method === "OPTIONS") return next(); // Skip preflight
  trackActivity(req, res, next);
};
app.use("/api/auth", authRoute);

app.use("/api/blog-category", blogCategoryRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/front", frontRoutes);
app.use("/api/list", listRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/clientele", clienteleRoutes);

app.use("/api/testimonial", testimonialRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/location-main", locationMainRouter);

app.use("/api/location", locationRouter);
app.use(
  "/api/leadership-team",
  leadershipTeamRouter
);

app.use("/api/core-team", coreTeamRouter);


app.use("/api/media-coverage", mediaCoverageRouter);

app.use("/api/ckeditor", ckeditorRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.get("/health/details", async (req, res) => {
  try {
    res.status(200).json({
      status: "OK",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({
      status: "DOWN",
      error: err.message,
    });
  }
});




connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running at port ${port}`);
  });
});

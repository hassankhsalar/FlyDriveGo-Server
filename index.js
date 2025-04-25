const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const port = process.env.PORT || 5000;

// Import routes
const getRoutes = require("./routes/getRoutes");
const postRoutes = require("./routes/postRoutes");
const patchRoutes = require("./routes/patchRoutes");
const putRoutes = require("./routes/putRoutes");
const deleteRoutes = require("./routes/deleteRoutes");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://flydrivego.netlify.app",
      "https://your-vercel-backend.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// MongoDB Setup
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c9iiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database Collections
async function setupCollections() {
  try {
    const db = client.db("FlyDriveGo");
    return {
      jobsCollection: db.collection("jobs"),
      applicationsCollection: db.collection("jobApplications"),
      sellersCollection: db.collection("sellersCollection"),
      visaApplicationsCollection: db.collection("visaApplications"),
      allProductsCollection: db.collection("ProductsCollection"),
      cartCollection: db.collection("carts"),
      userCollection: db.collection("users"),
      tourPackCollection: db.collection("TourPackage"),
      trasportationCars: db.collection("TrasportationCars"),
      transportationBusOptions: db.collection("transportationBusOptions"),
      transportationBusTestimonials: db.collection(
        "TransportationBusTestimonials"
      ),
    };
  } catch (error) {
    console.error("Error setting up collections:", error);
    throw error;
  }
}

// Initialize Routes with Collections
async function initializeRoutes() {
  try {
    const collections = await setupCollections();
    // Mount routes
    app.use(getRoutes(collections));
    app.use(postRoutes(collections, upload, stripe));
    app.use(patchRoutes(collections));
    app.use(putRoutes(collections));
    app.use(deleteRoutes(collections));

    // Default route
    app.get("/", (req, res) => {
      res.send("tour is waiting");
    });

    // Start server
    app.listen(port, () => {
      console.log(`plane is waiting at ${port}`);
    });

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
}

// Run the application
initializeRoutes().catch(console.dir);

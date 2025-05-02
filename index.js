const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://flydrivego.netlify.app",
    "https://your-vercel-backend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c9iiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

// Import routes
const getRoutes = require("./routes/getRoutes");
const postRoutes = require("./routes/postRoutes");
const deleteRoutes = require("./routes/deleteRoutes");
const patchRoutes = require("./routes/patchRoutes");
const putRoutes = require("./routes/putRoutes");

async function run() {
  try {
    await client.connect();

    // Database collections
    const db = client.db("FlyDriveGo");
    const jobsCollection = db.collection("jobs");
    const applicationsCollection = db.collection("jobApplications");
    const sellersCollection = db.collection("sellersCollection");
    const visaApplicationsCollection = db.collection("visaApplications");
    const allProductsCollection = db.collection("ProductsCollection");
    const cartCollection = db.collection("carts");
    const userCollection = db.collection("users");
    const tourPackCollection = db.collection("TourPackage");
    const trasportationCars = db.collection("TrasportationCars");
    const transportationBusOptions = db.collection("transportationBusOptions");
    const transportationBusTestimonials = db.collection("TransportationBusTestimonials");
    const busesCollection = db.collection("buses");
    const busSeatsCollection = db.collection("busSeats");
    const busBookingsCollection = db.collection("busBookings");
    const carBookingsCollection = db.collection("carBookings");
    const purchasedProductCollection = db.collection("purchasedProducts");

    // Helper functions
    function generateBookingReference() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let reference = "BUS";
      for (let i = 0; i < 6; i++) {
        reference += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return reference;
    }

    function generateDefaultSeatLayout(bus, date) {
      const totalSeats = bus.totalSeats || 40;
      const rows = Math.ceil(totalSeats / 4);
      const seats = [];
      const premiumSeats = [];

      for (let i = 1; i <= 8; i++) premiumSeats.push(i);
      for (let i = totalSeats - 3; i <= totalSeats; i++) premiumSeats.push(i);

      const columns = ["A", "B", "C", "D"];
      for (let i = 1; i <= totalSeats; i++) {
        const rowNumber = Math.ceil(i / 4);
        const colPosition = (i - 1) % 4;
        const seatLetter = columns[colPosition];
        seats.push({
          seatNumber: i,
          seatLabel: `${rowNumber}${seatLetter}`,
          status: "available",
          type: premiumSeats.includes(i) ? "premium" : "standard",
          price: premiumSeats.includes(i) ? bus.price * 1.3 : bus.price,
          position: {
            row: rowNumber,
            column: colPosition + 1,
            side: colPosition < 2 ? "left" : "right",
          },
        });
      }

      return {
        busId: bus._id || bus.id,
        busName: bus.name,
        date,
        seats,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    function generateCarBookingReference() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let reference = "CAR";
      for (let i = 0; i < 6; i++) {
        reference += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return reference;
    }

    // Route Dependencies
    const routeDependencies = {
      jobsCollection,
      applicationsCollection,
      sellersCollection,
      visaApplicationsCollection,
      allProductsCollection,
      cartCollection,
      userCollection,
      tourPackCollection,
      trasportationCars,
      transportationBusOptions,
      transportationBusTestimonials,
      busesCollection,
      busSeatsCollection,
      busBookingsCollection,
      carBookingsCollection,
      purchasedProductCollection,
      cloudinary,
      upload,
      stripe,
      ObjectId,
      generateBookingReference,
      generateDefaultSeatLayout,
      generateCarBookingReference,
    };

    // Use Routes
    app.use(getRoutes(routeDependencies));
    app.use(postRoutes(routeDependencies));
    app.use(deleteRoutes(routeDependencies));
    app.use(patchRoutes(routeDependencies));
    app.use(putRoutes(routeDependencies));

    console.log("✅ Connected to MongoDB and routes initialized.");

  } catch (err) {
    console.error("❌ Error during server run:", err);
  }
}
run().catch(console.dir);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Tour is waiting");
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Plane is waiting at port ${port}`);
});

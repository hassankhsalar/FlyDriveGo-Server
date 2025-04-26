const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SK);
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const port = process.env.PORT || 5000;

// Import routes
const getRoutes = require("./routes/getRoutes");
const postRoutes = require("./routes/postRoutes");
const deleteRoutes = require("./routes/deleteRoutes");
const patchRoutes = require("./routes/patchRoutes");
const putRoutes = require("./routes/putRoutes");

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5000",
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
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c9iiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Collections
    const jobsCollection = client.db("FlyDriveGo").collection("jobs");
    const applicationsCollection = client
      .db("FlyDriveGo")
      .collection("jobApplications");
    const sellersCollection = client
      .db("FlyDriveGo")
      .collection("sellersCollection");
    const visaApplicationsCollection = client
      .db("FlyDriveGo")
      .collection("visaApplications");
    const allProductsCollection = client
      .db("FlyDriveGo")
      .collection("ProductsCollection");
    const cartCollection = client.db("FlyDriveGo").collection("carts");
    const userCollection = client.db("FlyDriveGo").collection("users");
    const tourPackCollection = client
      .db("FlyDriveGo")
      .collection("TourPackage");
    const trasportationCars = client
      .db("FlyDriveGo")
      .collection("TrasportationCars");
    const transportationBusOptions = client
      .db("FlyDriveGo")
      .collection("transportationBusOptions");
    const transportationBusTestimonials = client
      .db("FlyDriveGo")
      .collection("TransportationBusTestimonials");
    const busesCollection = client.db("FlyDriveGo").collection("buses");
    const busSeatsCollection = client.db("FlyDriveGo").collection("busSeats");
    const busBookingsCollection = client
      .db("FlyDriveGo")
      .collection("busBookings");
    const carBookingsCollection = client
      .db("FlyDriveGo")
      .collection("carBookings");

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
      for (let i = 1; i <= 8; i++) {
        premiumSeats.push(i);
      }
      for (let i = totalSeats - 3; i <= totalSeats; i++) {
        premiumSeats.push(i);
      }
      for (let i = 1; i <= totalSeats; i++) {
        const rowNumber = Math.ceil(i / 4);
        const colPosition = (i - 1) % 4;
        const columns = ["A", "B", "C", "D"];
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

    // Pass collections and helper functions to routes
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
      cloudinary,
      upload,
      stripe,
      ObjectId,
      generateBookingReference,
      generateDefaultSeatLayout,
      generateCarBookingReference,
    };

    // Use routes
    app.use(getRoutes(routeDependencies));
    app.use(postRoutes(routeDependencies));
    app.use(deleteRoutes(routeDependencies));
    app.use(patchRoutes(routeDependencies));
    app.use(putRoutes(routeDependencies));

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("tour is waiting");
});

app.listen(port, () => {
  console.log(`plane is waiting at ${port}`);
});

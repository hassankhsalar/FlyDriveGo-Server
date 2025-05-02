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

    // New collections for flight booking
    const flightsCollection = db.collection("flights");
    const flightSeatsCollection = db.collection("flightSeats");
    const flightBookingsCollection = db.collection("flightBookings");
    const flightTestimonialsCollection = db.collection("flightTestimonials");
    const airlinesCollection = db.collection("airlines");
    const flightFAQsCollection = db.collection("flightFAQs");

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

    // Flight helper functions
    function generateFlightBookingReference() {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let reference = "AIR";
      for (let i = 0; i < 6; i++) {
        reference += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return reference;
    }

    function generateDefaultFlightSeatLayout(flight, date) {
      const totalSeats = flight.totalSeats || 120;

      // Different sections in the aircraft
      const firstClassSeats = Math.floor(totalSeats * 0.1); // 10% first class
      const businessClassSeats = Math.floor(totalSeats * 0.2); // 20% business class
      const economyClassSeats = totalSeats - firstClassSeats - businessClassSeats; // 70% economy

      const seats = [];
      let seatNumber = 1;

      // First class section (2-2 configuration)
      const firstClassRows = Math.ceil(firstClassSeats / 4);
      for (let row = 1; row <= firstClassRows; row++) {
        for (let col = 0; col < 4; col++) {
          const columns = ["A", "B", "E", "F"];
          const seatLetter = columns[col];
          seats.push({
            seatNumber: seatNumber++,
            seatLabel: `${row}${seatLetter}`,
            status: "available",
            type: "first",
            price: flight.price * 2.5, // First class premium
            position: {
              row: row,
              column: col + 1,
              side: col < 2 ? "left" : "right",
              section: "first"
            },
          });
        }
      }

      // Business class section (2-3-2 configuration)
      const businessClassRows = Math.ceil(businessClassSeats / 7);
      for (let row = firstClassRows + 1; row <= firstClassRows + businessClassRows; row++) {
        for (let col = 0; col < 7; col++) {
          const columns = ["A", "B", "C", "D", "E", "F", "G"];
          const seatLetter = columns[col];
          seats.push({
            seatNumber: seatNumber++,
            seatLabel: `${row}${seatLetter}`,
            status: "available",
            type: "business",
            price: flight.price * 1.5, // Business class premium
            position: {
              row: row,
              column: col + 1,
              side: col < 3 ? "left" : col > 3 ? "right" : "middle",
              section: "business"
            },
          });
        }
      }

      // Economy class section (3-3-3 configuration)
      const economyClassRows = Math.ceil(economyClassSeats / 9);
      for (let row = firstClassRows + businessClassRows + 1; row <= firstClassRows + businessClassRows + economyClassRows; row++) {
        for (let col = 0; col < 9; col++) {
          const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
          const seatLetter = columns[col];

          // Determine if this is a premium economy seat (first few rows of economy)
          const isPremiumEconomy = row <= firstClassRows + businessClassRows + 2;

          seats.push({
            seatNumber: seatNumber++,
            seatLabel: `${row}${seatLetter}`,
            status: "available",
            type: isPremiumEconomy ? "premium-economy" : "economy",
            price: isPremiumEconomy ? flight.price * 1.2 : flight.price,
            position: {
              row: row,
              column: col + 1,
              side: col < 3 ? "left" : col > 5 ? "right" : "middle",
              section: isPremiumEconomy ? "premium-economy" : "economy"
            },
          });
        }
      }

      return {
        flightId: flight._id || flight.id,
        flightName: flight.name,
        date,
        seats,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
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
      flightsCollection,
      flightSeatsCollection,
      flightBookingsCollection,
      flightTestimonialsCollection,
      airlinesCollection,
      flightFAQsCollection,
      cloudinary,
      upload,
      stripe,
      ObjectId,
      generateBookingReference,
      generateDefaultSeatLayout,
      generateCarBookingReference,
      generateFlightBookingReference,
      generateDefaultFlightSeatLayout,
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
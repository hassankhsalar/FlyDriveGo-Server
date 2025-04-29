const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SK);
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const port = process.env.PORT || 5000;

//middleware

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://flydrivego.netlify.app',
    'https://your-vercel-backend.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}))

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

    // ===== User Api ======///////

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ message: "Email is Needed" });
      }
      const filter = { email };
      const result = await userCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/allUsers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // userRole api
    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });

      if (user) {
        res.json({ userType: user.userType });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    });

    // Moderator: make seller
    app.patch("/users/moderator/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          userType: "seller",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // user delete
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // Tour Package Related api//
    app.get("/tourPackage", async (req, res) => {
      const result = await tourPackCollection.find({}).toArray();
      res.send(result);
    });
    
    app.post("/tourPackage", async (req, res) => {
      const data = req.body;
      const result = await tourPackCollection.insertOne(data);
      res.send(result);
    });

    app.patch("/tourPackage/:id", async (req, res) => {
      const { title } = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          title: title,
        },
      };
      const result = await tourPackCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete("/tourPackage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tourPackCollection.deleteOne(query);
      res.send(result);
    });

    //===========--------- SEllER APIS ------------===============

    // Get All Api for Product
    app.get("/products", async (req, res) => {
      const { search, tags, publisher } = req.query;
      const filters = {};
      if (search) {
        filters.title = { $regex: search, $options: "i" };
      }

      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : tags.split(",");
        filters.tags = { $in: tagsArray };
      }
      const result = await allProductsCollection.find(filters).toArray();
      res.send(result);
    });

    // Add product apis
    app.post("/addProducts", async (req, res) => {
      const productsData = req.body;
      console.log("Received product data:", productsData);
      const result = await allProductsCollection.insertOne(productsData);
      res.status(201).send(result);
    });

    // for products detail
    app.get('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const product = await allProductsCollection.findOne({ _id: new ObjectId(id) });
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product); // ✅ Send the product data correctly
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // Cart  API
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });


    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // Get Product By Email
    app.get("/sellerProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { sellerEmail: email };
      const result = await allProductsCollection.find(query).toArray();
      res.send(result);
    });

    // Update Products
    app.put("/updateProduct/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await allProductsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // Delete Product
    app.delete("/deleteProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allProductsCollection.deleteOne(query);
      res.send(result);
    });

    //=======Transportation API=======//
    //=======Transportation API=======//
    //=======Transportation API=======//
    // all transportation collection

    const trasportationCars = client.db("FlyDriveGo").collection("TrasportationCars");
    const transportationBusOptions = client.db("FlyDriveGo").collection("transportationBusOptions");



    // get all transportation cars
    app.get("/transportation-cars", async (req, res) => {
      const query = {};
      const result = await trasportationCars.find(query).toArray();
      res.send(result);
    });

    // TransportationBusTestimonials collection
    const transportationBusTestimonials = client
      .db("FlyDriveGo")
      .collection("TransportationBusTestimonials");
    const busesCollection = client.db("FlyDriveGo").collection("buses");
    const busSeatsCollection = client.db("FlyDriveGo").collection("busSeats");
    const busBookingsCollection = client.db("FlyDriveGo").collection("busBookings");

    // Get all buses with filter options
    app.get("/buses", async (req, res) => {
      try {
        const { date, from, to, category, sort } = req.query;
        const filter = {};

        // Apply filters if provided
        if (from) filter.departureLocation = { $regex: from, $options: 'i' };
        if (to) filter.arrivalLocation = { $regex: to, $options: 'i' };
        if (date) filter.availableDates = { $elemMatch: { $eq: date } };
        if (category && category !== 'all') filter.category = category;

        // Sort options
        let sortOption = {};
        if (sort === "price-low") {
          sortOption = { price: 1 };
        } else if (sort === "price-high") {
          sortOption = { price: -1 };
        } else if (sort === "duration") {
          sortOption = { durationMinutes: 1 };
        } else if (sort === "departure") {
          sortOption = { departureTime: 1 };
        }

        const buses = await busesCollection.find(filter).sort(sortOption).toArray();
        res.status(200).json(buses);
      } catch (error) {
        console.error("Error fetching buses:", error);
        res.status(500).json({ error: "Failed to fetch buses" });
      }
    });

    // Get bus by ID
    app.get("/buses/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let bus;

        // Try to find by ObjectId first, then by numeric id
        if (ObjectId.isValid(id)) {
          bus = await busesCollection.findOne({ _id: new ObjectId(id) });
        }

        // If not found by ObjectId, try with numeric id
        if (!bus) {
          bus = await busesCollection.findOne({ id: parseInt(id) });
        }

        if (!bus) {
          return res.status(404).json({ error: "Bus not found" });
        }

        res.status(200).json(bus);
      } catch (error) {
        console.error("Error fetching bus details:", error);
        res.status(500).json({ error: "Failed to fetch bus details" });
      }
    });

    // Get seat layout for a specific bus on a specific date
    app.get("/buses/:id/seats", async (req, res) => {
      try {
        const busId = req.params.id;
        const { date } = req.query;

        if (!date) {
          return res.status(400).json({ error: "Date parameter is required" });
        }

        // Find the bus first
        let bus;
        if (ObjectId.isValid(busId)) {
          bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
        }

        if (!bus) {
          bus = await busesCollection.findOne({ id: parseInt(busId) });
        }

        if (!bus) {
          return res.status(404).json({ error: "Bus not found" });
        }

        // Check for existing seat layout for this date
        let query = {};
        if (ObjectId.isValid(busId)) {
          query.busId = new ObjectId(busId);
        } else {
          query.busId = parseInt(busId);
        }
        query.date = date;

        const seatLayout = await busSeatsCollection.findOne(query);

        if (seatLayout) {
          return res.status(200).json(seatLayout);
        }

        // If no seat layout exists for this date, create a new one
        const newSeatLayout = generateDefaultSeatLayout(bus, date);

        // Don't save it yet - just return the generated layout
        // It will be saved when seats are actually booked
        res.status(200).json(newSeatLayout);

      } catch (error) {
        console.error("Error fetching seat layout:", error);
        res.status(500).json({ error: "Failed to fetch seat layout" });
      }
    });

    // Reserve seats temporarily (for 10 minutes)
    app.post("/buses/reserve-seats", async (req, res) => {
      try {
        const { busId, date, seatNumbers, sessionId } = req.body;

        if (!busId || !date || !seatNumbers || !Array.isArray(seatNumbers) || !sessionId) {
          return res.status(400).json({ error: "Invalid request parameters" });
        }

        // Find the bus to verify it exists
        let bus;
        if (ObjectId.isValid(busId)) {
          bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
        } else {
          bus = await busesCollection.findOne({ id: parseInt(busId) });
        }

        if (!bus) {
          return res.status(404).json({ error: "Bus not found" });
        }

        // Find existing seat layout or create new one
        let query = {};
        if (ObjectId.isValid(busId)) {
          query.busId = new ObjectId(busId);
        } else {
          query.busId = parseInt(busId);
        }
        query.date = date;

        let seatLayout = await busSeatsCollection.findOne(query);

        if (!seatLayout) {
          // Create new seat layout
          seatLayout = generateDefaultSeatLayout(bus, date);
        }

        // Check if seats are already booked or reserved by someone else
        const unavailableSeats = [];
        for (const seatNumber of seatNumbers) {
          const seat = seatLayout.seats.find(s => s.seatNumber === parseInt(seatNumber));
          if (!seat) {
            unavailableSeats.push(seatNumber);
            continue;
          }

          if (seat.status === 'booked') {
            unavailableSeats.push(seatNumber);
          } else if (seat.status === 'reserved' && seat.reservation?.sessionId !== sessionId) {
            // Check if reservation is expired
            const expiryTime = new Date(seat.reservation.expiryTime);
            if (expiryTime > new Date()) {
              // Reservation still valid
              unavailableSeats.push(seatNumber);
            }
          }
        }

        if (unavailableSeats.length > 0) {
          return res.status(400).json({
            error: "Some seats are no longer available",
            unavailableSeats
          });
        }

        // Mark selected seats as reserved
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10 minute reservation

        // Update seat statuses
        const updatedSeats = seatLayout.seats.map(seat => {
          if (seatNumbers.includes(seat.seatNumber.toString())) {
            return {
              ...seat,
              status: 'reserved',
              reservation: {
                sessionId,
                expiryTime
              }
            };
          }
          return seat;
        });

        // Insert or update seat layout in database
        if (seatLayout._id) {
          // Update existing document
          await busSeatsCollection.updateOne(
            { _id: new ObjectId(seatLayout._id) },
            { $set: { seats: updatedSeats, updatedAt: new Date() } }
          );
        } else {
          // Insert new document
          seatLayout.seats = updatedSeats;
          seatLayout.createdAt = new Date();
          seatLayout.updatedAt = new Date();
          await busSeatsCollection.insertOne(seatLayout);
        }

        res.status(200).json({
          success: true,
          message: "Seats reserved successfully",
          expiryTime
        });

      } catch (error) {
        console.error("Error reserving seats:", error);
        res.status(500).json({ error: "Failed to reserve seats" });
      }
    });

    // Create bus booking with passenger details
    app.post("/bus-bookings", async (req, res) => {
      try {
        const {
          busId,
          date,
          seatNumbers,
          sessionId,
          contactInfo,
          primaryPassenger,
          totalPrice
        } = req.body;

        if (!busId || !date || !seatNumbers || !contactInfo || !primaryPassenger || !totalPrice) {
          return res.status(400).json({ error: "Missing required booking information" });
        }

        // Verify bus exists
        let bus;
        if (ObjectId.isValid(busId)) {
          bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
        } else {
          bus = await busesCollection.findOne({ id: parseInt(busId) });
        }

        if (!bus) {
          return res.status(404).json({ error: "Bus not found" });
        }

        // Find seat layout
        let query = {};
        if (ObjectId.isValid(busId)) {
          query.busId = new ObjectId(busId);
        } else {
          query.busId = parseInt(busId);
        }
        query.date = date;

        const seatLayout = await busSeatsCollection.findOne(query);

        if (!seatLayout) {
          return res.status(400).json({ error: "No seat layout found for this bus and date" });
        }

        // Verify seats are available or reserved for this session
        const unavailableSeats = [];
        for (const seatNumber of seatNumbers) {
          const seat = seatLayout.seats.find(s => s.seatNumber === parseInt(seatNumber));
          if (!seat) {
            unavailableSeats.push(seatNumber);
            continue;
          }

          if (seat.status === 'booked') {
            unavailableSeats.push(seatNumber);
          } else if (seat.status === 'reserved' && seat.reservation?.sessionId !== sessionId) {
            // Check if reservation is expired
            const expiryTime = new Date(seat.reservation.expiryTime);
            if (expiryTime > new Date()) {
              // Reservation still valid
              unavailableSeats.push(seatNumber);
            }
          }
        }

        if (unavailableSeats.length > 0) {
          return res.status(400).json({
            error: "Some seats are no longer available",
            unavailableSeats
          });
        }

        // Generate booking reference number
        const bookingReference = generateBookingReference();

        // Create booking record
        const bookingData = {
          bookingReference,
          busId: ObjectId.isValid(busId) ? new ObjectId(busId) : parseInt(busId),
          busDetails: {
            name: bus.name,
            route: bus.route,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
          },
          date,
          seatNumbers: seatNumbers.map(s => parseInt(s)),
          contactInfo,
          primaryPassenger,
          totalPrice,
          status: 'confirmed',
          paymentStatus: 'pending',
          createdAt: new Date(),
        };

        const result = await busBookingsCollection.insertOne(bookingData);

        // Update seats to booked status
        const updatedSeats = seatLayout.seats.map(seat => {
          if (seatNumbers.includes(seat.seatNumber.toString())) {
            return {
              ...seat,
              status: 'booked',
              bookingId: result.insertedId,
              reservation: null
            };
          }
          return seat;
        });

        await busSeatsCollection.updateOne(
          { _id: seatLayout._id },
          { $set: { seats: updatedSeats, updatedAt: new Date() } }
        );

        res.status(201).json({
          success: true,
          bookingId: result.insertedId,
          bookingReference,
          message: "Booking created successfully"
        });

      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ error: "Failed to create booking" });
      }
    });

    // Get booking details
    app.get("/bus-bookings/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { reference, email } = req.query;

        let booking;

        if (id !== 'find') {
          // Find by ID
          if (ObjectId.isValid(id)) {
            booking = await busBookingsCollection.findOne({ _id: new ObjectId(id) });
          }
        } else if (reference && email) {
          // Find by reference and email
          booking = await busBookingsCollection.findOne({
            bookingReference: reference,
            'contactInfo.email': email
          });
        } else {
          return res.status(400).json({ error: "Invalid search parameters" });
        }

        if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
        }

        res.status(200).json(booking);
      } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ error: "Failed to fetch booking details" });
      }
    });

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
      // carBookingsCollection,
      cloudinary,
      upload,
      stripe,
      ObjectId,
      generateBookingReference,
      generateDefaultSeatLayout,
      generateCarBookingReference,
    };

    // Stripe Payment
    app.post("/create-payment-intent", async(req, res)=>{
      const {price}= req.body;
      const amount = parseInt(price*100);
      

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })



    ///API Code Above////

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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

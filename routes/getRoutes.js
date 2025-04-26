const express = require("express");

module.exports = function ({
  jobsCollection,
  applicationsCollection,
  sellersCollection,
  visaApplicationsCollection,
  allProductsCollection,
  cartCollection,
  userCollection,
  trasportationCars,
  transportationBusOptions,
  transportationBusTestimonials,
  busesCollection,
  busSeatsCollection,
  busBookingsCollection,
  carBookingsCollection,
  ObjectId,
}) {
  const express = require("express");
  const router = express.Router();

  // GET ALL JOBS
  router.get("/jobs", async (req, res) => {
    try {
      const cursor = jobsCollection.find({});
      const jobs = await cursor.toArray();
      res.send(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // GET SINGLE JOB BY ID
  router.get("/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await jobsCollection.findOne({ id });

      if (!job) {
        return res.status(404).send("Job not found");
      }

      res.send(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // GET ALL APPLICATIONS
  router.get("/job-applications", async (req, res) => {
    try {
      const cursor = applicationsCollection.find({});
      const applications = await cursor.toArray();
      res.send(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // GET APPLICATIONS BY JOB ID
  router.get("/job-applications/job/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const applications = await applicationsCollection
        .find({ jobId })
        .toArray();
      res.send(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // GET all visa applications
  router.get("/visa-applications", async (req, res) => {
    try {
      const { email } = req.query;
      let query = {};
      if (email) {
        query = { userEmail: email };
      }
      const applications = await visaApplicationsCollection
        .find(query)
        .toArray();
      res.status(200).json(applications);
    } catch (error) {
      console.error("Error fetching visa applications:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET a single visa application by ID
  router.get("/visa-applications/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const application = await visaApplicationsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(200).json(application);
    } catch (error) {
      console.error("Error fetching visa application:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // GET users
  router.get("/users", async (req, res) => {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is Needed" });
    }
    const filter = { email };
    const result = await userCollection.find(filter).toArray();
    res.send(result);
  });

  router.get("/allUsers", async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
  });

  // userRole api
  router.get("/users/role/:email", async (req, res) => {
    const email = req.params.email;
    const user = await userCollection.findOne({ email });

    if (user) {
      res.json({ userType: user.userType });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Get All Api for Product
  router.get("/products", async (req, res) => {
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

  // Cart API
  router.get("/carts", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  // Get Product By Email
  router.get("/sellerProduct/:email", async (req, res) => {
    const email = req.params.email;
    const query = { sellerEmail: email };
    const result = await allProductsCollection.find(query).toArray();
    res.send(result);
  });

  // get all transportation cars
  router.get("/transportation-cars", async (req, res) => {
    const query = {};
    const result = await trasportationCars.find(query).toArray();
    res.send(result);
  });

  // Get all bus testimonials
  router.get("/transportation-bus-testimonials", async (req, res) => {
    try {
      const query = {};
      const result = await transportationBusTestimonials.find(query).toArray();
      res.json(result);
    } catch (error) {
      console.error("Error fetching bus testimonials:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Get all bus options
  router.get("/transportation-bus-options", async (req, res) => {
    try {
      const query = {};
      const result = await transportationBusOptions.find(query).toArray();
      res.json(result);
    } catch (error) {
      console.error("Error fetching bus options:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Get all buses with filter options
  router.get("/buses", async (req, res) => {
    try {
      const { date, from, to, category, sort } = req.query;
      const filter = {};

      if (from) filter.departureLocation = { $regex: from, $options: "i" };
      if (to) filter.arrivalLocation = { $regex: to, $options: "i" };
      if (date) filter.availableDates = { $elemMatch: { $eq: date } };
      if (category && category !== "all") filter.category = category;

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

      const buses = await busesCollection
        .find(filter)
        .sort(sortOption)
        .toArray();
      res.status(200).json(buses);
    } catch (error) {
      console.error("Error fetching buses:", error);
      res.status(500).json({ error: "Failed to fetch buses" });
    }
  });

  // Get bus by ID
  router.get("/buses/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let bus;

      if (ObjectId.isValid(id)) {
        bus = await busesCollection.findOne({ _id: new ObjectId(id) });
      }

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
  router.get("/buses/:id/seats", async (req, res) => {
    try {
      const busId = req.params.id;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: "Date parameter is required" });
      }

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

      const newSeatLayout = generateDefaultSeatLayout(bus, date);

      res.status(200).json(newSeatLayout);
    } catch (error) {
      console.error("Error fetching seat layout:", error);
      res.status(500).json({ error: "Failed to fetch seat layout" });
    }
  });

  // Get booking details
  router.get("/bus-bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { reference, email } = req.query;

      let booking;

      if (id !== "find") {
        if (ObjectId.isValid(id)) {
          booking = await busBookingsCollection.findOne({
            _id: new ObjectId(id),
          });
        }
      } else if (reference) {
        booking = await busBookingsCollection.findOne({
          bookingReference: reference,
        });

        if (!booking && email) {
          booking = await busBookingsCollection.findOne({
            bookingReference: reference,
            "contactInfo.email": email,
          });
        }
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

  // Get car booking details
  router.get("/car-bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { reference, email } = req.query;

      let booking;

      if (id !== "find") {
        if (ObjectId.isValid(id)) {
          booking = await carBookingsCollection.findOne({
            _id: new ObjectId(id),
          });
        }
      } else if (reference) {
        booking = await carBookingsCollection.findOne({
          bookingReference: reference,
        });

        if (!booking && email) {
          booking = await carBookingsCollection.findOne({
            bookingReference: reference,
            "contactInfo.email": email,
          });
        }
      } else {
        return res.status(400).json({ error: "Invalid search parameters" });
      }

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.status(200).json(booking);
    } catch (error) {
      console.error("Error fetching car booking:", error);
      res.status(500).json({ error: "Failed to fetch booking details" });
    }
  });

  router.get("/becomeseller", async (req, res) => {
    const result = await sellersCollection.find().toArray();
    res.send(result);
  });

  return router;
};

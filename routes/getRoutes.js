const express = require("express");

module.exports = (collections) => {
  const router = express.Router();
  const {
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
  } = collections;

  // GET ALL JOBS
  router.get("/jobs", async (req, res) => {
    try {
      const jobs = await jobsCollection.find({}).toArray();
      res.status(200).json(jobs);
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
      const applications = await applicationsCollection.find({}).toArray();
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

  // GET ALL VISA APPLICATIONS
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

  // GET A SINGLE VISA APPLICATION BY ID
  router.get("/visa-applications/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { ObjectId } = require("mongodb");
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

  // GET ALL PRODUCTS
  router.get("/products", async (req, res) => {
    const { search, tags } = req.query;
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

  // GET CARTS
  router.get("/carts", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  // GET USERS
  router.get("/users", async (req, res) => {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is Needed" });
    }
    const filter = { email };
    const result = await userCollection.find(filter).toArray();
    res.send(result);
  });

  // GET ALL USERS
  router.get("/allUsers", async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
  });

  // GET USER ROLE
  router.get("/users/role/:email", async (req, res) => {
    const email = req.params.email;
    const user = await userCollection.findOne({ email });
    if (user) {
      res.json({ userType: user.userType });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
  app.get("/users/:email", async (req, res) => {
    const email = req.params.email
    const query = {email:email };
    const result = await userCollection.find(query).toArray();
    res.send(result)
  });
  

  // GET SELLER PRODUCTS
  router.get("/sellerProduct/:email", async (req, res) => {
    const email = req.params.email;
    const query = { sellerEmail: email };
    const result = await allProductsCollection.find(query).toArray();
    res.send(result);
  });

  // GET ALL TRANSPORTATION CARS
  router.get("/transportation-cars", async (req, res) => {
    const query = {};
    const result = await trasportationCars.find(query).toArray();
    res.send(result);
  });

  // GET ALL BUS TESTIMONIALS
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

  // GET ALL BUS OPTIONS
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

  // GET ALL SELLERS
  router.get("/becomeseller", async (req, res) => {
    const result = await sellersCollection.find().toArray();
    res.send(result);
  });

  return router;
};

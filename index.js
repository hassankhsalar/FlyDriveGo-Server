const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
/////////////////////////////

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Collections
    const jobsCollection = client.db("FlyDriveGo").collection("jobs");
    const applicationsCollection = client
      .db("FlyDriveGo")
      .collection("jobApplications");
    const sellersCollection = client
      .db("FlyDriveGo")
      .collection("sellersCollection");

    ///API code Goes here//////

    //===JOBS RELATED APIS===//
    // GET ALL JOBS
    app.get("/jobs", async (req, res) => {
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
    app.get("/jobs/:id", async (req, res) => {
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

    // ADD NEW JOB
    app.post("/jobs", async (req, res) => {
      try {
        const job = req.body;

        // Get the highest existing ID to create new sequential ID
        const maxIdJob = await jobsCollection
          .find()
          .sort({ id: -1 })
          .limit(1)
          .toArray();
        const newId = maxIdJob.length > 0 ? maxIdJob[0].id + 1 : 1;

        job.id = newId;
        const result = await jobsCollection.insertOne(job);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error posting job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // UPDATE JOB
    app.patch("/jobs/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        const result = await jobsCollection.updateOne(
          { id },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send("Job not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // DELETE JOB
    app.delete("/jobs/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = await jobsCollection.deleteOne({ id });

        if (result.deletedCount === 0) {
          return res.status(404).send("Job not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    //===JOB APPLICATIONS APIS===//
    // GET ALL APPLICATIONS
    app.get("/job-applications", async (req, res) => {
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
    app.get("/job-applications/job/:jobId", async (req, res) => {
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

    // ADD NEW APPLICATION
    app.post("/job-applications", async (req, res) => {
      try {
        const application = req.body;
        const result = await applicationsCollection.insertOne(application);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error submitting job application:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // UPDATE APPLICATION STATUS
    app.patch("/job-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send("Application not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    //=== VISA RELATED APIS ===//
    //=== VISA RELATED APIS ===//
    //=== VISA RELATED APIS ===//

    // Upload a document to Cloudinary
    app.post("/api/upload", upload.single("file"), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        // Convert buffer to base64 data URL
        const fileBuffer = req.file.buffer;
        const fileType = req.file.mimetype;
        const encodedFile = `data:${fileType};base64,${fileBuffer.toString(
          "base64"
        )}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(encodedFile, {
          resource_type: "auto",
          folder: "visa_documents",
          public_id: `visa_doc_${Date.now()}`,
          overwrite: true,
        });
        res.status(200).json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          original_filename: req.file.originalname,
        });
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        res.status(500).json({
          success: false,
          message: "Failed to upload file",
          error: error.message,
        });
      }
    });

    // Upload multiple documents to Cloudinary
    app.post("/api/uploads", upload.array("files", 10), async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "No files uploaded" });
        }
        // Process each file for upload to Cloudinary
        const uploadPromises = req.files.map(async (file) => {
          // Convert buffer to base64 data URL
          const fileBuffer = file.buffer;
          const fileType = file.mimetype;
          const encodedFile = `data:${fileType};base64,${fileBuffer.toString(
            "base64"
          )}`;

          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(encodedFile, {
            resource_type: "auto",
            folder: "visa_documents",
            public_id: `visa_doc_${Date.now()}_${Math.floor(
              Math.random() * 1000
            )}`,
            overwrite: true,
          });
          return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            original_filename: file.originalname,
          };
        });
        // Wait for all uploads to complete
        const uploadResults = await Promise.all(uploadPromises);
        res.status(200).json({
          success: true,
          files: uploadResults,
        });
      } catch (error) {
        console.error("Error uploading multiple files:", error);
        res.status(500).json({
          success: false,
          message: "Failed to upload files",
          error: error.message,
        });
      }
    });

    // == VISA APPLICATION ENDPOINTS == //
    // == VISA APPLICATION ENDPOINTS == //
    // == VISA APPLICATION ENDPOINTS == //

    // visa applications collection
    const visaApplicationsCollection = client
      .db("FlyDriveGo")
      .collection("visaApplications");

    // GET all visa applications
    app.get("/visa-applications", async (req, res) => {
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
    app.get("/visa-applications/:id", async (req, res) => {
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

    // POST a new visa application
    app.post("/visa-applications", async (req, res) => {
      try {
        const application = req.body;
        if (!application.documents) {
          application.documents = [];
        }
        application.createdAt = new Date();
        application.updatedAt = new Date();
        application.status = application.status || "pending";
        console.log("Creating new visa application:", {
          fullName: application.fullName,
          email: application.userEmail,
          destination: application.countryName,
          documents: application.documents.length,
        });
        const result = await visaApplicationsCollection.insertOne(application);
        res.status(201).json({
          success: true,
          _id: result.insertedId,
          referenceNumber: application.referenceNumber,
        });
      } catch (error) {
        console.error("Error creating visa application:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create visa application",
          error: error.message,
        });
      }
    });

    // UPDATE visa application status
    app.patch("/visa-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status, adminNotes } = req.body;
        const updateData = {
          updatedAt: new Date(),
        };
        if (status) {
          updateData.status = status;
        }
        if (adminNotes) {
          updateData.adminNotes = adminNotes;
        }
        const result = await visaApplicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });
        }
        res.status(200).json({
          success: true,
          message: "Application updated successfully",
        });
      } catch (error) {
        console.error("Error updating visa application:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update visa application",
          error: error.message,
        });
      }
    });

    // POST a message to a visa application
    app.post("/visa-applications/:id/messages", async (req, res) => {
      try {
        const id = req.params.id;
        const { text, userId, userName } = req.body;
        if (!text) {
          return res.status(400).json({
            success: false,
            message: "Message text is required",
          });
        }
        const messageData = {
          text,
          userId,
          userName,
          createdAt: new Date(),
        };
        const result = await visaApplicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $push: { messages: messageData },
            $set: { updatedAt: new Date() },
          }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });
        }
        res.status(200).json({
          success: true,
          message: "Message sent successfully",
          messageData,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
          success: false,
          message: "Failed to send message",
          error: error.message,
        });
      }
    });

    // Mark application as complete
    app.patch("/visa-applications/:id/complete", async (req, res) => {
      try {
        const id = req.params.id;
        const { approved, rejectionReason } = req.body;
        const updateData = {
          status: approved ? "approved" : "rejected",
          updatedAt: new Date(),
          completedAt: new Date(),
        };
        if (!approved && rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }
        const result = await visaApplicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });
        }
        res.status(200).json({
          success: true,
          message: `Application marked as ${
            approved ? "approved" : "rejected"
          }`,
        });
      } catch (error) {
        console.error("Error completing visa application:", error);
        res.status(500).json({
          success: false,
          message: "Failed to complete visa application",
          error: error.message,
        });
      }
    });

    // PATCH: Request Additional Info for Visa Application
    app.patch("/visa-applications/:id/request-info", async (req, res) => {
      try {
        const id = req.params.id;
        const { additionalInfoRequest } = req.body;

        if (!additionalInfoRequest) {
          return res.status(400).json({
            success: false,
            message: "Additional information request details are required",
          });
        }

        const updateData = {
          status: "additional_info_needed",
          additionalInfoRequest,
          additionalInfoRequestDate: new Date(),
          updatedAt: new Date(),
        };

        const result = await visaApplicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Application not found",
          });
        }

        res.status(200).json({
          success: true,
          message: "Additional information requested",
        });
      } catch (error) {
        console.error("Error requesting additional information:", error);
        res.status(500).json({
          success: false,
          message: "Failed to request additional information",
          error: error.message,
        });
      }
    });

    // GET: Fetch all jobs
    app.get("/jobs", async (req, res) => {
      try {
        const jobs = await jobsCollection.find({}).toArray();
        res.status(200).json(jobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET SINGLE JOB BY ID
    app.get("/jobs/:id", async (req, res) => {
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

    // ADD NEW JOB
    app.post("/jobs", async (req, res) => {
      try {
        const job = req.body;

        // Get the highest existing ID to create new sequential ID
        const maxIdJob = await jobsCollection
          .find()
          .sort({ id: -1 })
          .limit(1)
          .toArray();
        const newId = maxIdJob.length > 0 ? maxIdJob[0].id + 1 : 1;

        job.id = newId;
        const result = await jobsCollection.insertOne(job);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error posting job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // UPDATE JOB
    app.patch("/jobs/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        const result = await jobsCollection.updateOne(
          { id },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send("Job not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // DELETE JOB
    app.delete("/jobs/:id", async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const result = await jobsCollection.deleteOne({ id });

        if (result.deletedCount === 0) {
          return res.status(404).send("Job not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    //===JOB APPLICATIONS APIS===//
    // GET ALL APPLICATIONS
    app.get("/job-applications", async (req, res) => {
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
    app.get("/job-applications/job/:jobId", async (req, res) => {
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

    // ADD NEW APPLICATION
    app.post("/job-applications", async (req, res) => {
      try {
        const application = req.body;
        const result = await applicationsCollection.insertOne(application);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error submitting job application:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // UPDATE APPLICATION STATUS
    app.patch("/job-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send("Application not found");
        }

        res.send(result);
      } catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    const allProductsCollection = client
      .db("FlyDriveGo")
      .collection("ProductsCollection");
    const cartCollection = client
      .db("FlyDriveGo")
      .collection("carts");
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

    // Moderator API for
    app.get("/users/moderator/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      let moderator = false;
      if (user) {
        moderator = user?.role === "moderator";
      }
      res.send({ moderator });
    });

    // Moderator: make seller
    app.patch("/users/moderator/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "seller",
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

    // Cart  API
    app.get('/carts', async(req,res) =>{
      const email = req.query.email;
      const query={email: email};
      const  result = await cartCollection.find(query).toArray();
      res.send(result); 
    });

    app.post('/carts', async(req,res)=>{
      const cartItem = req.body;
      const result  = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req,res) =>{
      const id = req.params.id;
      const  query={_id:  new  ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })

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

    ///Become a Seller API
    app.post("/becomeseller", async (req, res) => {
      const { email, storeName, tradeLicense, category, bannerUrl } = req.body;

      if (!email || !storeName || !tradeLicense || !category || !bannerUrl) {
        return res.status(400).json({ message: "All fields are required." });
      }

      try {
        const result = await sellersCollection.insertOne({
          email,
          storeName,
          tradeLicense,
          category,
          bannerUrl,
          createdAt: new Date(),
        });

        res.status(201).json({
          message: "Seller registered successfully!",
          id: result.insertedId,
        });
      } catch (error) {
        console.error("Error inserting seller:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    ///API Code Above////

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

////////////////////////////
app.get("/", (req, res) => {
  res.send("tour is waiting");
});

app.listen(port, () => {
  console.log(`plane is waiting at ${port}`);
});

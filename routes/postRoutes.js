const express = require("express");
const cloudinary = require("cloudinary").v2;

module.exports = (collections, upload, stripe) => {
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
  } = collections;

  // ADD NEW JOB
  router.post("/jobs", async (req, res) => {
    try {
      const job = req.body;
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

  // ADD NEW JOB APPLICATION
  router.post("/job-applications", async (req, res) => {
    try {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.status(201).send(result);
    } catch (error) {
      console.error("Error submitting job application:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // UPLOAD A DOCUMENT TO CLOUDINARY
  router.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileBuffer = req.file.buffer;
      const fileType = req.file.mimetype;
      const encodedFile = `data:${fileType};base64,${fileBuffer.toString(
        "base64"
      )}`;
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

  // UPLOAD MULTIPLE DOCUMENTS TO CLOUDINARY
  router.post("/api/uploads", upload.array("files", 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      const uploadPromises = req.files.map(async (file) => {
        const fileBuffer = file.buffer;
        const fileType = file.mimetype;
        const encodedFile = `data:${fileType};base64,${fileBuffer.toString(
          "base64"
        )}`;
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

  // POST A NEW VISA APPLICATION
  router.post("/visa-applications", async (req, res) => {
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

  // POST A MESSAGE TO A VISA APPLICATION
  router.post("/visa-applications/:id/messages", async (req, res) => {
    try {
      const id = req.params.id;
      const { text, userId, userName } = req.body;
      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Message text is required",
        });
      }
      const { ObjectId } = require("mongodb");
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

  // ADD USER
  router.post("/users", async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: "user already exists", insertedId: null });
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  });

  // ADD TOUR PACKAGE
  router.post("/tourPackage", async (req, res) => {
    const data = req.body;
    const result = await tourPackCollection.insertOne(data);
    res.send(result);
  });

  // ADD PRODUCT
  router.post("/addProducts", async (req, res) => {
    const productsData = req.body;
    console.log("Received product data:", productsData);
    const result = await allProductsCollection.insertOne(productsData);
    res.status(201).send(result);
  });

  // ADD TO CART
  router.post("/carts", async (req, res) => {
    const cartItem = req.body;
    const result = await cartCollection.insertOne(cartItem);
    res.send(result);
  });

  // BECOME A SELLER
  router.post("/becomeseller", async (req, res) => {
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

  // STRIPE PAYMENT
  router.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    const amount = parseInt(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  });

  return router;
};

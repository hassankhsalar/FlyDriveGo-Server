const cloudinary = require("cloudinary").v2;

module.exports = function ({
  jobsCollection,
  applicationsCollection,
  sellersCollection,
  visaApplicationsCollection,
  allProductsCollection,
  cartCollection,
  userCollection,
  tourPackCollection,
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
}) {
  const express = require("express");
  const router = express.Router();

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

  // ADD NEW APPLICATION
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

  // Upload a document to Cloudinary
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

  // Upload multiple documents to Cloudinary
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

  // POST a new visa application
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

  // POST a message to a visa application
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

  // Users
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

  // Tour Package
  router.post("/tourPackage", async (req, res) => {
    const data = req.body;
    const result = await tourPackCollection.insertOne(data);
    res.send(result);
  });

  // Add product
  router.post("/addProducts", async (req, res) => {
    const productsData = req.body;
    console.log("Received product data:", productsData);
    const result = await allProductsCollection.insertOne(productsData);
    res.status(201).send(result);
  });

  // Cart
  router.post("/carts", async (req, res) => {
    const cartItem = req.body;
    const result = await cartCollection.insertOne(cartItem);
    res.send(result);
  });

  // Become a Seller
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

  // Reserve seats temporarily
  router.post("/buses/reserve-seats", async (req, res) => {
    try {
      const { busId, date, seatNumbers, sessionId } = req.body;

      if (
        !busId ||
        !date ||
        !seatNumbers ||
        !Array.isArray(seatNumbers) ||
        !sessionId
      ) {
        return res.status(400).json({ error: "Invalid request parameters" });
      }

      let bus;
      if (ObjectId.isValid(busId)) {
        bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
      } else {
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

      let seatLayout = await busSeatsCollection.findOne(query);

      if (!seatLayout) {
        seatLayout = generateDefaultSeatLayout(bus, date);
      }

      const unavailableSeats = [];
      for (const seatNumber of seatNumbers) {
        const seat = seatLayout.seats.find(
          (s) => s.seatNumber === parseInt(seatNumber)
        );
        if (!seat) {
          unavailableSeats.push(seatNumber);
          continue;
        }

        if (seat.status === "booked") {
          unavailableSeats.push(seatNumber);
        } else if (
          seat.status === "reserved" &&
          seat.reservation?.sessionId !== sessionId
        ) {
          const expiryTime = new Date(seat.reservation.expiryTime);
          if (expiryTime > new Date()) {
            unavailableSeats.push(seatNumber);
          }
        }
      }

      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          error: "Some seats are no longer available",
          unavailableSeats,
        });
      }

      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10);

      const updatedSeats = seatLayout.seats.map((seat) => {
        if (seatNumbers.includes(seat.seatNumber.toString())) {
          return {
            ...seat,
            status: "reserved",
            reservation: {
              sessionId,
              expiryTime,
            },
          };
        }
        return seat;
      });

      if (seatLayout._id) {
        await busSeatsCollection.updateOne(
          { _id: new ObjectId(seatLayout._id) },
          { $set: { seats: updatedSeats, updatedAt: new Date() } }
        );
      } else {
        seatLayout.seats = updatedSeats;
        seatLayout.createdAt = new Date();
        seatLayout.updatedAt = new Date();
        await busSeatsCollection.insertOne(seatLayout);
      }

      res.status(200).json({
        success: true,
        message: "Seats reserved successfully",
        expiryTime,
      });
    } catch (error) {
      console.error("Error reserving seats:", error);
      res.status(500).json({ error: "Failed to reserve seats" });
    }
  });

  // Create bus booking
  router.post("/bus-bookings", async (req, res) => {
    try {
      const {
        busId,
        date,
        seatNumbers,
        sessionId,
        contactInfo,
        primaryPassenger,
        totalPrice,
      } = req.body;

      if (
        !busId ||
        !date ||
        !seatNumbers ||
        !contactInfo ||
        !primaryPassenger ||
        !totalPrice
      ) {
        return res
          .status(400)
          .json({ error: "Missing required booking information" });
      }

      let bus;
      if (ObjectId.isValid(busId)) {
        bus = await busesCollection.findOne({ _id: new ObjectId(busId) });
      } else {
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

      if (!seatLayout) {
        return res
          .status(400)
          .json({ error: "No seat layout found for this bus and date" });
      }

      const unavailableSeats = [];
      for (const seatNumber of seatNumbers) {
        const seat = seatLayout.seats.find(
          (s) => s.seatNumber === parseInt(seatNumber)
        );
        if (!seat) {
          unavailableSeats.push(seatNumber);
          continue;
        }

        if (seat.status === "booked") {
          unavailableSeats.push(seatNumber);
        } else if (
          seat.status === "reserved" &&
          seat.reservation?.sessionId !== sessionId
        ) {
          const expiryTime = new Date(seat.reservation.expiryTime);
          if (expiryTime > new Date()) {
            unavailableSeats.push(seatNumber);
          }
        }
      }

      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          error: "Some seats are no longer available",
          unavailableSeats,
        });
      }

      const bookingReference = generateBookingReference();

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
        seatNumbers: seatNumbers.map((s) => parseInt(s)),
        contactInfo,
        primaryPassenger,
        totalPrice,
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: new Date(),
      };

      const result = await busBookingsCollection.insertOne(bookingData);

      const updatedSeats = seatLayout.seats.map((seat) => {
        if (seatNumbers.includes(seat.seatNumber.toString())) {
          return {
            ...seat,
            status: "booked",
            bookingId: result.insertedId,
            reservation: null,
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
        message: "Booking created successfully",
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Clean up expired seat reservations
  router.post("/buses/cleanup-reservations", async (req, res) => {
    try {
      const now = new Date();

      const seatLayouts = await busSeatsCollection.find({}).toArray();
      let cleanupCount = 0;

      for (const layout of seatLayouts) {
        const updatedSeats = layout.seats.map((seat) => {
          if (
            seat.status === "reserved" &&
            new Date(seat.reservation.expiryTime) < now
          ) {
            cleanupCount++;
            return {
              ...seat,
              status: "available",
              reservation: null,
            };
          }
          return seat;
        });

        if (cleanupCount > 0) {
          await busSeatsCollection.updateOne(
            { _id: layout._id },
            { $set: { seats: updatedSeats, updatedAt: new Date() } }
          );
        }
      }

      res.status(200).json({
        success: true,
        message: `Cleaned up ${cleanupCount} expired seat reservations`,
      });
    } catch (error) {
      console.error("Error cleaning up reservations:", error);
      res.status(500).json({ error: "Failed to clean up reservations" });
    }
  });

  // Stripe Payment
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

  // Create car booking
  router.post("/car-bookings", async (req, res) => {
    try {
      const {
        carId,
        carName,
        startDate,
        endDate,
        totalDays,
        basePrice,
        contactInfo,
        driverInfo,
        additionalOptions,
        totalPrice,
        imageUrl,
      } = req.body;

      if (
        !carId ||
        !carName ||
        !startDate ||
        !endDate ||
        !contactInfo ||
        !driverInfo ||
        !totalPrice
      ) {
        return res
          .status(400)
          .json({ error: "Missing required booking information" });
      }

      const bookingReference = generateCarBookingReference();

      const bookingData = {
        bookingReference,
        carId: ObjectId.isValid(carId) ? new ObjectId(carId) : parseInt(carId),
        carName,
        startDate,
        endDate,
        totalDays,
        basePrice: basePrice || totalPrice,
        contactInfo,
        driverInfo,
        additionalOptions,
        totalPrice,
        imageUrl,
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: new Date(),
      };

      const result = await carBookingsCollection.insertOne(bookingData);

      res.status(201).json({
        success: true,
        bookingId: result.insertedId,
        bookingReference,
        message: "Booking created successfully",
      });
    } catch (error) {
      console.error("Error creating car booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  return router;
};

module.exports = function ({
  jobsCollection,
  applicationsCollection,
  visaApplicationsCollection,
  userCollection,
  tourPackCollection,
  allProductsCollection,
  busSeatsCollection,
  busBookingsCollection,
  carBookingsCollection,
  stripe,
  ObjectId,
}) {
  const express = require("express");
  const router = express.Router();

  // UPDATE JOB
  router.patch("/jobs/:id", async (req, res) => {
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

  // UPDATE APPLICATION STATUS
  router.patch("/job-applications/:id", async (req, res) => {
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

  // UPDATE visa application status
  router.patch("/visa-applications/:id", async (req, res) => {
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

  // Mark application as complete
  router.patch("/visa-applications/:id/complete", async (req, res) => {
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
        message: `Application marked as ${approved ? "approved" : "rejected"}`,
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

  // Request Additional Info for Visa Application
  router.patch("/visa-applications/:id/request-info", async (req, res) => {
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

  // Moderator: make seller
  router.patch("/users/moderator/:id", async (req, res) => {
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

  // Tour Package
  router.patch("/tourPackage/:id", async (req, res) => {
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

  // Update Products
  router.put("/updateProduct/:id", async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const result = await allProductsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send(result);
  });

  // Update bus booking payment status
  router.patch("/bus-bookings/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentId, paymentMethod, paymentTimestamp } =
        req.body;

      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid booking ID format" });
      }

      const result = await busBookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            paymentStatus,
            paymentId,
            paymentMethod,
            paymentTimestamp,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      const booking = await busBookingsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (booking) {
        let seatLayout = await busSeatsCollection.findOne({
          busId: booking.busId,
          date: booking.date,
        });

        if (seatLayout) {
          const updatedSeats = seatLayout.seats.map((seat) => {
            if (booking.seatNumbers.includes(seat.seatNumber)) {
              return {
                ...seat,
                status: "booked",
                reservation: null,
              };
            }
            return seat;
          });

          await busSeatsCollection.updateOne(
            { _id: seatLayout._id },
            { $set: { seats: updatedSeats, updatedAt: new Date() } }
          );
        }
      }

      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update payment status" });
    }
  });

  // Recovery endpoint for bus bookings
  router.patch("/bus-bookings/:id/payment-recovery", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentId, paymentMethod, paymentTimestamp } =
        req.body;

      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid booking ID format" });
      }

      if (paymentId && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
          if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
              success: false,
              message: "Payment has not been completed successfully",
            });
          }
        } catch (stripeError) {
          console.error("Stripe verification error:", stripeError);
        }
      }

      const result = await busBookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            paymentStatus,
            paymentId,
            paymentMethod,
            paymentTimestamp,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      const booking = await busBookingsCollection.findOne({
        _id: new ObjectId(id),
      });
      if (booking) {
        let seatLayout = await busSeatsCollection.findOne({
          busId: booking.busId,
          date: booking.date,
        });

        if (seatLayout) {
          const updatedSeats = seatLayout.seats.map((seat) => {
            if (booking.seatNumbers.includes(seat.seatNumber)) {
              return {
                ...seat,
                status: "booked",
                reservation: null,
              };
            }
            return seat;
          });

          await busSeatsCollection.updateOne(
            { _id: seatLayout._id },
            { $set: { seats: updatedSeats, updatedAt: new Date() } }
          );
        }
      }

      res.status(200).json({
        success: true,
        message: "Payment status recovered successfully",
      });
    } catch (error) {
      console.error("Error recovering payment status:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to recover payment status" });
    }
  });

  // Update car booking payment status
  router.patch("/car-bookings/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentId, paymentMethod, paymentTimestamp } =
        req.body;

      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid booking ID format" });
      }

      const result = await carBookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            paymentStatus,
            paymentId,
            paymentMethod,
            paymentTimestamp,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
      });
    } catch (error) {
      console.error("Error updating car booking payment status:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update payment status" });
    }
  });

  // Payment recovery endpoint for car bookings
  router.patch("/car-bookings/:id/payment-recovery", async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus, paymentId, paymentMethod, paymentTimestamp } =
        req.body;

      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid booking ID format" });
      }

      if (paymentId && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
          if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
              success: false,
              message: "Payment has not been completed successfully",
            });
          }
        } catch (stripeError) {
          console.error("Stripe verification error:", stripeError);
        }
      }

      const result = await carBookingsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            paymentStatus,
            paymentId,
            paymentMethod,
            paymentTimestamp,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }

      res.status(200).json({
        success: true,
        message: "Payment status recovered successfully",
      });
    } catch (error) {
      console.error("Error recovering car booking payment status:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to recover payment status" });
    }
  });

  return router;
};

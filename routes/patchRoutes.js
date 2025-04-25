const express = require("express");

module.exports = (collections) => {
  const router = express.Router();
  const {
    jobsCollection,
    applicationsCollection,
    visaApplicationsCollection,
    userCollection,
    tourPackCollection,
  } = collections;

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

  // UPDATE JOB APPLICATION STATUS
  router.patch("/job-applications/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      const { ObjectId } = require("mongodb");
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

  // UPDATE VISA APPLICATION STATUS
  router.patch("/visa-applications/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { status, adminNotes } = req.body;
      const { ObjectId } = require("mongodb");
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

  // MARK VISA APPLICATION AS COMPLETE
  router.patch("/visa-applications/:id/complete", async (req, res) => {
    try {
      const id = req.params.id;
      const { approved, rejectionReason } = req.body;
      const { ObjectId } = require("mongodb");
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

  // REQUEST ADDITIONAL INFO FOR VISA APPLICATION
  router.patch("/visa-applications/:id/request-info", async (req, res) => {
    try {
      const id = req.params.id;
      const { additionalInfoRequest } = req.body;
      const { ObjectId } = require("mongodb");
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

  // MAKE USER A SELLER
  router.patch("/users/moderator/:id", async (req, res) => {
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const filter = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        userType: "seller",
      },
    };
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });

  // UPDATE TOUR PACKAGE
  router.patch("/tourPackage/:id", async (req, res) => {
    const { title } = req.body;
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const filter = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        title: title,
      },
    };
    const result = await tourPackCollection.updateOne(filter, updatedDoc);
    res.send(result);
  });

  return router;
};

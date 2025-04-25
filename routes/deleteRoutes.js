const express = require("express");

module.exports = (collections) => {
  const router = express.Router();
  const {
    jobsCollection,
    cartCollection,
    userCollection,
    tourPackCollection,
    allProductsCollection,
  } = collections;

  // DELETE JOB
  router.delete("/jobs/:id", async (req, res) => {
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

  // DELETE CART ITEM
  router.delete("/carts/:id", async (req, res) => {
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  });

  // DELETE USER
  router.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.deleteOne(query);
    res.send(result);
  });

  // DELETE TOUR PACKAGE
  router.delete("/tourPackage/:id", async (req, res) => {
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const query = { _id: new ObjectId(id) };
    const result = await tourPackCollection.deleteOne(query);
    res.send(result);
  });

  // DELETE PRODUCT
  router.delete("/deleteProduct/:id", async (req, res) => {
    const id = req.params.id;
    const { ObjectId } = require("mongodb");
    const query = { _id: new ObjectId(id) };
    const result = await allProductsCollection.deleteOne(query);
    res.send(result);
  });

  return router;
};

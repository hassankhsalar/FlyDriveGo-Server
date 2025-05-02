module.exports = function ({
  jobsCollection,
  cartCollection,
  userCollection,
  tourPackCollection,
  allProductsCollection,
  ObjectId,
}) {
  const express = require("express");
  const router = express.Router();

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

  // user delete
  router.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.deleteOne(query);
    res.send(result);
  });

  // Tour Package
  router.delete("/tourPackage/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await tourPackCollection.deleteOne(query);
    res.send(result);
  });

  // Cart
  router.delete("/carts/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  });

  router.delete("/carts", async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send("Email is required");
      }
  
      const result = await cartCollection.deleteMany({ email });
      res.send({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  // Delete Product
  router.delete("/deleteProduct/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await allProductsCollection.deleteOne(query);
    res.send(result);
  });

  return router;
};

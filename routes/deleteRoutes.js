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

  router.delete("/clear-cart", async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    try {
      // Assuming you're storing the cart in a collection or session
      await cartCollection.deleteMany({ email });

      res.status(200).json({ success: true, message: "Cart cleared." });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Server error" });
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

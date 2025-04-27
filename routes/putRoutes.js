const express = require("express");

module.exports = (collections) => {
  const router = express.Router();
  const { allProductsCollection } = collections;

  // UPDATE PRODUCT
  router.put("/updateProduct/:id", async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const { ObjectId } = require("mongodb");
    const result = await allProductsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send(result);
  });

  return router;
};

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
/////////////////////////////

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

    ///API code Goes here//////

    const allProductsCollection = client
      .db("FlyDriveGo")
      .collection("ProductsCollection");
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

    // Add product apis
    app.post("/addProducts", async (req, res) => {
      const productsData = req.body;
      console.log("Received product data:", productsData);
      const result = await allProductsCollection.insertOne(productsData);
      res.status(201).send(result);
    });

    ///API Code Above////

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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

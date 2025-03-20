const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
/////////////////////////////


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c9iiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    ///API code Goes here//////


    const allProductsCollection = client.db('FlyDriveGo').collection('ProductsCollection');



    //===========--------- SEllER APIS ------------===============

    // Add product apis
    app.post('/addProducts', async (req, res) => {
      const productsData = req.body;
      console.log("Received product data:", productsData);
      const result = await allProductsCollection.insertOne(productsData);
      res.status(201).send(result);
    });

    // Get Product By Email
    app.get('/sellerProduct/:email', async (req, res) => {
      const email = req.params.email
      const query = {sellerEmail:email };
      const result = await allProductsCollection.find(query).toArray();
      res.send(result)
    });

    // Update Products 
    app.put("/updateProduct/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const result = await allProductsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
      res.send(result);
  });
  
  

    // Delete Product 
    app.delete('/deleteProduct/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await allProductsCollection.deleteOne(query);
      res.send(result)
  })

    
    




    ///API Code Above////

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


////////////////////////////
app.get('/', (req, res) => {
  res.send('tour is waiting')
})

app.listen(port, () => {
  console.log(`plane is waiting at ${port}`);
})
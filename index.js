const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
/////////////////////////////

const { MongoClient, ServerApiVersion, ObjectId, ObjectId } = require('mongodb');
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
    
    // Collections
    const jobsCollection = client.db("FlyDriveGo").collection("jobs");
    const applicationsCollection = client.db("FlyDriveGo").collection("jobApplications");
    
    ///API code Goes here//////

    //===JOBS RELATED APIS===//
    // GET ALL JOBS
    app.get('/jobs', async (req, res) => {
        try {
            const cursor = jobsCollection.find({});
            const jobs = await cursor.toArray();
            res.send(jobs);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // GET SINGLE JOB BY ID
    app.get('/jobs/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const job = await jobsCollection.findOne({ id });
            
            if (!job) {
                return res.status(404).send("Job not found");
            }
            
            res.send(job);
        } catch (error) {
            console.error("Error fetching job:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // ADD NEW JOB
    app.post('/jobs', async (req, res) => {
        try {
            const job = req.body;
            
            // Get the highest existing ID to create new sequential ID
            const maxIdJob = await jobsCollection.find().sort({ id: -1 }).limit(1).toArray();
            const newId = maxIdJob.length > 0 ? maxIdJob[0].id + 1 : 1;
            
            job.id = newId;
            const result = await jobsCollection.insertOne(job);
            res.status(201).send(result);
        } catch (error) {
            console.error("Error posting job:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // UPDATE JOB
    app.patch('/jobs/:id', async (req, res) => {
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
    
    // DELETE JOB
    app.delete('/jobs/:id', async (req, res) => {
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
    
    //===JOB APPLICATIONS APIS===//
    // GET ALL APPLICATIONS
    app.get('/job-applications', async (req, res) => {
        try {
            const cursor = applicationsCollection.find({});
            const applications = await cursor.toArray();
            res.send(applications);
        } catch (error) {
            console.error("Error fetching job applications:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // GET APPLICATIONS BY JOB ID
    app.get('/job-applications/job/:jobId', async (req, res) => {
        try {
            const jobId = parseInt(req.params.jobId);
            const applications = await applicationsCollection.find({ jobId }).toArray();
            res.send(applications);
        } catch (error) {
            console.error("Error fetching job applications:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // ADD NEW APPLICATION
    app.post('/job-applications', async (req, res) => {
        try {
            const application = req.body;
            const result = await applicationsCollection.insertOne(application);
            res.status(201).send(result);
        } catch (error) {
            console.error("Error submitting job application:", error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    // UPDATE APPLICATION STATUS
    app.patch('/job-applications/:id', async (req, res) => {
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
app.get('/', (req, res) => {
  res.send('tour is waiting')
})

app.listen(port, () => {
  console.log(`plane is waiting at ${port}`);
})

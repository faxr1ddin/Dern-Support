console.log("MongoDB URI:", process.env.MONGODB_URI);

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const url = process.env.MONGODB_URI;
const dbName = 'dernSupport';

const BASE_URL = "https://dern-support-official-7zzw.onrender.com";

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/MainPage/MainPage.html");
});

const client = new MongoClient(url, { useUnifiedTopology: true });

async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(dbName);

        const usersCollection = db.collection('users');
        const supportRequestsCollection = db.collection('supportRequests');

        // Register
        app.post("${BASE_URL}/auth/register", async (req, res) => {
            const newUser = req.body;
            const emailExists = await usersCollection.findOne({ email: newUser.email });

            if (emailExists) {
                return res.status(400).json({ success: false, message: "This email is already registered!" });
            }

            await usersCollection.insertOne(newUser);
            res.status(201).json({ success: true, message: "User registered successfully", user: newUser });
        });

        // Login
        app.post("${BASE_URL}/auth/login", async (req, res) => {
            const { email, password } = req.body;
            const user = await usersCollection.findOne({ email, password });

            if (user) {
                res.json({
                    success: true,
                    email: user.email,
                    type: user.type,
                    isAdmin: user.isAdmin || false
                });
            } else {
                res.status(401).json({ success: false, message: "Invalid credentials" });
            }
        });

        app.get("${BASE_URL}/api/user/:email", async (req, res) => {
            const user = await usersCollection.findOne({ email: req.params.email });

            if (user) {
                res.json(user);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        });

        app.post("${BASE_URL}/api/support-requests", async (req, res) => {
            const requestData = req.body;
            requestData.ticketId = `#DS-${Math.floor(1000 + Math.random() * 9000)}`;
            requestData.date = new Date().toISOString();
            requestData.status = "New";

            try {
                await supportRequestsCollection.insertOne(requestData);
                res.status(201).json(requestData);
            } catch (error) {
                console.error('Error inserting support request:', error);
                res.status(500).json({ success: false, message: "Failed to create support request" });
            }
        });

        app.get("${BASE_URL}/api/support-requests/:email", async (req, res) => {
            try {
                const userRequests = await supportRequestsCollection.find({ email: req.params.email }).toArray();
                res.json(userRequests);
            } catch (error) {
                console.error('Error fetching user requests:', error);
                res.status(500).json({ success: false, message: "Failed to fetch user requests" });
            }
        });

        app.get("${BASE_URL}/api/support-request/:ticketId", async (req, res) => {
            try {
                const request = await supportRequestsCollection.findOne({ ticketId: req.params.ticketId });
                if (request) {
                    res.json(request);
                } else {
                    res.status(404).json({ success: false, message: "Request not found" });
                }
            } catch (error) {
                console.error('Error fetching support request:', error);
                res.status(500).json({ success: false, message: "Failed to fetch support request" });
            }
        });

        // Get all users (for admin)
        app.get("${BASE_URL}/api/users", async (req, res) => {
            try {
                const users = await usersCollection.find({}).toArray();
                res.json(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ success: false, message: "Failed to fetch users" });
            }
        });

        app.get("${BASE_URL}/api/support-requests", async (req, res) => {
            try {
                const requests = await supportRequestsCollection.find({}).toArray();
                res.json(requests);
            } catch (error) {
                console.error('Error fetching all requests:', error);
                res.status(500).json({ success: false, message: "Failed to fetch requests" });
            }
        });

        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });

    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

startServer();

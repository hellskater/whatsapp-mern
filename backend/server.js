// Importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// App Config
const app = express();
const port = process.env.PORT || 9001;

const pusher = new Pusher({
  appId: "1271312",
  key: "f73c77671abd9e14899c",
  secret: "b6cff2854cc0413bf2be",
  cluster: "ap2",
  useTLS: true,
});

// Middlewares
app.use(express.json());
// DO NOT DO THIS IN PRODUCTION ENVIRONMENT
app.use(cors());

//  DB Config
const connection_url =
  "mongodb+srv://admin:oOV6WSQuH6BwHcOU@cluster0.ztvhm.mongodb.net/whatsappDB?retryWrites=true&w=majority";

mongoose.connect(connection_url, (err) => {
  if (err) throw err;
  console.log("Connected to MongoDB");
});

// Change stream
const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

// API routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// Listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));

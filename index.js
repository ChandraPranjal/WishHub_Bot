const bodyParser = require("body-parser");
const express = require("express");
const app = express();
require("dotenv").config({});
const { getWhatsappMsg, administrator_chatbot } = require("./services");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT;
// const token = process.env.token;

app.get("/hello", (req, res) => {
  res.status(200).json("Hello World");
});

const whatsapp_token = process.env.WHATSAPP_TOKEN;

app.get("/", (req, res) => {
  res.send("Hello from whatsappbot");
});

app.get("/webhook", (req, res) => {
  try {
    console.log("GET /webhook");
    const verify_token = process.env.VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode && token) {
      if (mode === "subscribe" && token === verify_token)
        console.log("Webhook Verified");
      res.status(200).send(challenge);
    } else res.sendStatus(400);
  } catch (error) {
    console.log("Error i /webhook GET", error);
  }
});

app.post("/webhook", (req, res) => {
  try {
    console.log("POST /webhook");
    const { entry } = req.body;
    const { changes } = entry[0];
    const { value } = changes[0];
    console.log("messages in req.body is ", value["messages"]);
    const message = value["messages"][0];
    const number = message["from"];
    const messageId = message["id"];
    const contacts = value["contacts"][0];
    const name = contacts["profile"]["name"];
    let id_of_msg_that_was_replied = null;
    if ("context" in value["messages"])
      id_of_msg_that_was_replied = value["messages"]?.["context"]["id"];
    const text = getWhatsappMsg(message);
    administrator_chatbot(value["messages"], text, number, messageId, name , id_of_msg_that_was_replied);
    res.status(200).json("Aur beta ji");
  } catch (error) {
    console.log("Error i /webhook post", error);
  }
});

app.listen(PORT || 5000, () => {
  console.log(`Server running on PORT : ${PORT} `);
});

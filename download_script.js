const axios = require("axios");
const fs = require("fs");
const URL = `https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1720904291651977&ext=1708946945&hash=ATt685uZsKKGi0YmMz35AHR1_8syoi7m-RZ0pXLxYzlNUA`;
const FROM = `document`;

const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const express = require("express");
const app = express();

const config = {
  method: "get",
  url: URL, //PASS THE URL HERE, WHICH YOU RECEIVED WITH THE HELP OF MEDIA ID
  headers: {
    Authorization: `Bearer EAAK80T02h1EBO9MHeRa3Vj46lcpaBasiSV1WGnm4ATxKxVLakkWAtdM9uggEya2Gvv93kTZCMZCot54baAZALvIDHCLPCwgDpiZBXfwu4ZBT2o2UkMxq7kLD3eAwZBJ5nkUIQeqbAOZBtvE3a6EV8RPml68icGJo3n3Y3PIUTCFL5mJfUe4BGm8ANQQMtxSZC5vLV53TsU8eipGUP8dt3Pj3TXhXZCAZDZD`,
  },
  responseType: "arraybuffer",
};

const data = [];

axios(config)
  .then(function (response) {
    const ext = response.headers["content-type"].split("/")[1];

    fs.writeFileSync(`${__dirname}/public/document.csv`, response.data);
    // Read CSV file
    fs.createReadStream(`${__dirname}/public/document.csv`)
      .pipe(csv())
      .on("data", (row) => {
        // Process each row
        // Here you can convert each row into JSON format
        const images = row.images.split(",").map((image) => image.trim()); // Split string by comma and trim spaces
        const jsonData = {
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          discountPercentage: parseInt(row.discountPercentage),
          stock: parseInt(row.stock),
          brand: row.brand,
          category: row.category,
          imageSrc: row.imageSrc,
          images: images,
          expiryDate: row.expiryDate,
        };
        data.push(jsonData);
      })
      .on("end", () => {
        console.log("CSV to JSON conversion sucess");
      });
  })
  .catch(function (error) {
    console.log(error);
  });

app.get("/", (req, res) => {
  console.log(__dirname);
  res.json(data);
});

app.listen(5000, () => {
  console.log("Booted");
});

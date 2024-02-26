const axios = require("axios");
const fs = require("fs");
const { stickers_ids } = require("./constants");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const getWhatsappMsg = (message) => {
  try {
    const { type } = message;
    if (!type) return "Unrecognized Msg";

    let msg = "";
    if (type === "text") msg = message["text"]["body"];
    else if (type === "document") msg = "";
    else if (type === "button") msg = message["button"]["text"];
    else if (
      type === "interactive" &&
      message["interactive"]["type"] === "list_reply"
    )
      msg = message["interactive"]["list_reply"]["title"];
    else if (
      type === "interactive" &&
      message["interactive"]["type"] === "button_reply"
    )
      msg = message["interactive"]["button_reply"]["title"];
    else msg = "Unrevognised";

    return msg;
  } catch (error) {
    console.log("Error in  getWhatsappMsg", error);
  }
};

const sendWhatsappMessage = async (body) => {
  try {
    const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const response = await fetch(process.env.WHATSAPP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const data = await response.json();
      return data;
    } else return "Request not Success";
  } catch (error) {
    console.log("Error in sendWhatsappMessage", error);
  }
};

const text_message = (number, text, memessageId) => {
  try {
    const data = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: number,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };
    return data;
  } catch (error) {
    console.log("Error in text_message", error);
  }
};

const buttonReply_Message = (number, options, body, footer, messageId) => {
  const buttons = options.map((option, idx) => {
    return {
      type: "reply",
      reply: {
        id: `_btn_${idx}`,
        title: option,
      },
    };
  });

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: body,
      },
      footer: {
        text: footer,
      },
      action: {
        buttons: buttons,
      },
    },
  };
  return data;
};

const list_reply_Message = (
  number,
  options,
  header,
  body,
  footer,
  messageId
) => {
  const rows = options.map((option, index) => {
    return {
      id: `_list_${index}_`,
      title: option,
      description: `desp ${index}`,
    };
  });

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "interactive",
    interactive: {
      type: "list",
      header: {
        type: "text",
        text: header,
      },
      body: {
        text: body,
      },
      footer: {
        text: footer,
      },
      action: {
        button: "See Options",
        sections: [
          {
            title: "Sections",
            rows: rows,
            // [{
            //   id: "<LIST_SECTION_1_ROW_2_ID>",
            //   title: "<SECTION_1_ROW_2_TITLE>",
            //   description: "<SECTION_1_ROW_2_DESC>",
            // }],
          },
        ],
      },
    },
  };
  return data;
};

const document_Message = (number, url, caption, filename, messageId) => {
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "document",
    document: {
      id: "<DOCUMENT_OBJECT_ID>",
      caption: caption,
      filename: filename,
    },
  };
  return data;
};

const sticker_message = (number, sticker_id, messageId) => {
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "sticker",
    sticker: {
      id: sticker_id,
    },
  };
  return data;
};

const sendReplyWithReactionMessage = (number, message_id, emoji) => {
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    type: "reaction",
    reaction: {
      message_id: message_id,
      emoji: emoji,
    },
  };
  return data;
};

const sendReplyWithText = (number, message_id, msg) => {
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: number,
    context: {
      message_id: message_id,
    },
    type: "text",
    text: {
      preview_url: false,
      body: msg,
    },
  };
  return data;
};

const markMessagesAsRead = (incoming_message_id) => {
  const data = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: incoming_message_id,
  };
  return data;
};

const doucment_to_json_handeler = async (mediaID) => {
  try {
    //fetch mediaURL

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${mediaID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        responseType: "arraybuffer",
      }
    );

    const data = await response.json();
    const mediaURL = data.url;
    const config = {
      method: "get",
      url: mediaURL, //PASS THE URL HERE, WHICH YOU RECEIVED WITH THE HELP OF MEDIA ID
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      responseType: "arraybuffer",
    };

    const productData = [];

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
            productData.push(jsonData);
          })
          .on("end", () => {
            console.log("CSV to JSON conversion sucess");
            console.log("productData", productData);
            return productData;
          });
      })
      .catch(function (error) {
        console.log(error);
      });
  } catch (error) {
    console.log("erro while conversion ", error);
  }
};

const administrator_chatbot = async (
  message_body,
  text,
  number,
  messageId,
  name,
  id_of_msg_that_was_replied
) => {
  try {
    console.log("text is", text);
    // const lowercase_text = text.toLowerCase();
    const data = text_message(number, text);
    // await sendWhatsappMessage(data);
    const list = [];
    const markMessagesAsReadData = markMessagesAsRead(messageId);
    list.push(markMessagesAsReadData);
    const type = message_body.type;
    if (text === "WishHub") {
      // await sendWhatsappMessage(text_message(number, "Yes WishHub"));
      const body = `Hello ${name}, would you like to add items to inventory?`;
      const footer = "Thank you, for placing your trust in us.";
      const options = ["Yes", "No"];
      const replyButtonData = buttonReply_Message(
        number,
        options,
        body,
        footer,
        "sed1",
        messageId
      );
      const replyReaction = sendReplyWithReactionMessage(
        number,
        messageId,
        "🧐"
      );

      // await sendWhatsappMessage(replyButtonData);
      // await sendWhatsappMessage(replyReaction);

      list.push(replyReaction);
      list.push(replyButtonData);
    } else if (text === "Services") {
      const body = "Services provided by us are";
      const footer = "Thanks for trusting us";
      const options = ["Update Inventory", "Chatbot", "Update Status"];
      const header = "hola";
      const listReplyData = list_reply_Message(
        number,
        options,
        header,
        body,
        footer,
        messageId
      );
      const stickerReplyData = sticker_message(
        number,
        stickers_ids.dog_suit,
        messageId
      );

      // const list = [];
      list.push(listReplyData);
      list.push(stickerReplyData);
    } else {
      if (type === "document" && id_of_msg_that_was_replied) {
        console.log("Atleast here");
        const docId = message_body.document.id;
        doucment_to_json_handeler(docId);
        console.log("product Data is ", productData);
      }
      const lowercase_text = text.toLowerCase();
      const data = text_message(number, lowercase_text);
      await sendWhatsappMessage(data);
    }
    for (let item of list) await sendWhatsappMessage(item);
    // for (let item in list) await sendWhatsappMessage(item);
  } catch (error) {
    console.log("Error in administrator_chatbot", error);
  }
};

module.exports = {
  getWhatsappMsg,
  sendWhatsappMessage,
  text_message,
  list_reply_Message,
  document_Message,
  sticker_message,
  sendReplyWithText,
  markMessagesAsRead,
  administrator_chatbot,
};

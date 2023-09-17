// https://www.mongodb.com/library/vector-search/semantic-search-mongodb-using-atlas-vector-search

exports = async function (changeEvent) {
  // Get the full document from the change event.
  const doc = changeEvent.fullDocument;

  // Define the OpenAI API url and key.
  const url = "https://api.openai.com/v1/embeddings";
  // Use the name you gave the value of your API key in the "Values" utility inside of App Services
  const openAiKey = context.values.get("OPEN_AI_KEY");
  try {
    console.log(`Processing document with id: ${doc._id}`);

    // Call OpenAI API to get the embeddings.
    const response = await context.http.post({
      url: url,
      headers: {
        Authorization: [`Bearer ${openAiKey}`],
        "Content-Type": ["application/json"],
      },
      body: JSON.stringify({
        // The field inside your document that contains the data to embed, here it is the "plot" field from the sample movie data.
        input: `${doc.question} ${doc.answer}`,
        model: "text-embedding-ada-002",
      }),
    });

    // Parse the JSON response
    const responseData = EJSON.parse(response.body.text());

    // Check the response status.
    if (response.statusCode !== 200) {
      console.log(
        `Failed to receive embedding. Status code: ${response.statusCode}`
      );
      return;
    }
    console.log("Successfully received embedding.");

    const embedding = responseData.data[0].embedding;

    // Use the name of your MongoDB Atlas Cluster
    const collection = context.services
      .get("Cluster0")
      .db("faq-app")
      .collection("faqs");

    // Update the document in MongoDB.
    const result = await collection.updateOne(
      { _id: doc._id },
      // The name of the new field you'd like to contain your embeddings.
      { $set: { faq_embedding: embedding } }
    );

    if (result.modifiedCount === 1) {
      console.log("Successfully updated the document.");
    } else {
      console.log("Failed to update the document.");
    }
  } catch (err) {
    console.error("🚀 ~ file: index.js:61 ~ err:", err);
  }
};

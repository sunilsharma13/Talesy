const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://Talesy_13:HelloTalesy@talesy.qrlgvg8.mongodb.net/test?retryWrites=true&w=majority&appName=Talesy";

async function testMongoDB() {
  try {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    await client.close();
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB", error);
  }
}

testMongoDB();

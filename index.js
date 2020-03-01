require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

let client = null
MongoClient.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then((c) => {
  client = c;
  const action = process.argv[2];
  if (!action) {
    throw new Error(`Action Required!`);
  }
  let actionFunc = null
  actionFunc = require('./src/actions/' + action);
  const db = client.db('cytoid');
  return actionFunc(db);
})
.catch((err) => {
  console.error(err)
})
.finally(() => {
  client.close();
})


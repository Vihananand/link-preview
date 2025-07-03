import { MongoClient } from 'mongodb';

let client;
let db;

async function connectToAuthDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db('auth');
  }
  return db;
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const database = await connectToAuthDb();
    const collection = database.collection('authenticateuser');
    let user;
    try {
      user = await collection.findOne({ username });
    } catch (err) {
      console.error('MongoDB findOne error:', err);
      return Response.json({ success: false, message: 'Database error', error: err.message }, { status: 500 });
    }
    console.log('Auth Debug:', { username, password, user });
    if (!user || user.password !== password) {
      console.log('Auth Failed: user or password mismatch', { inputPassword: password, dbPassword: user ? user.password : null });
      return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, message: 'Auth error', error: error.message }, { status: 500 });
  }
}

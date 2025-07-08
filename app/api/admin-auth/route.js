
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

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
    // Removed debug log for production
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, message: 'Auth error', error: error.message }, { status: 500 });
  }
}

// Change password endpoint (PUT)
export async function PUT(request) {
  try {
    const { username, newPassword } = await request.json();
    const database = await connectToAuthDb();
    const collection = database.collection('authenticateuser');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await collection.updateOne(
      { username },
      { $set: { password: hashedPassword } }
    );
    if (result.matchedCount === 0) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    return Response.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    return Response.json({ success: false, message: 'Password update error', error: error.message }, { status: 500 });
  }
}

import { MongoClient, ObjectId } from 'mongodb';

let client;
let db;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db('test');
  }
  return db;
}

export async function GET(request) {
  try {
    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    const problems = await collection.find({}).toArray();

    const transformedProblems = problems.map(problem => ({
      _id: problem._id.toString(),
      serial: problem.serial,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      questionLink: problem.questionLink,
      solutionLink: problem.solutionLink
    }));

    return Response.json({
      success: true,
      problems: transformedProblems,
      total: transformedProblems.length
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to fetch problems from database',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    let serialToCheck = body.serial;

    if (!isNaN(Number(serialToCheck))) {
      serialToCheck = Number(serialToCheck);
    }
    const exists = await collection.findOne({ $or: [
      { serial: serialToCheck },
      { serial: serialToCheck.toString() },
      { serial: Number(serialToCheck) }
    ] });
    if (exists) {
      return Response.json({
        success: false,
        message: 'Entry with this serial already exists.'
      }, { status: 409 });
    }

    const result = await collection.insertOne(body);

    return Response.json({
      success: true,
      message: 'Problem added successfully',
      id: result.insertedId
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to add problem to database',
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return Response.json({
        success: false,
        message: 'Problem not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Problem updated successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to update problem',
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({
        success: false,
        message: 'Problem ID is required'
      }, { status: 400 });
    }

    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({
        success: false,
        message: 'Problem not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'Problem deleted successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to delete problem',
      error: error.message
    }, { status: 500 });
  }
}
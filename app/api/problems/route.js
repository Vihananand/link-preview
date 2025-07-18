import { MongoClient, ObjectId } from 'mongodb';
import validator from 'validator';

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

function sanitizeProblemInput(input) {
  return {
    serial: validator.escape(String(input.serial)),
    title: validator.escape(String(input.title)),
    difficulty: validator.escape(String(input.difficulty)),
    topic: validator.escape(String(input.topic)),
    questionLink: validator.isURL(input.questionLink) ? validator.trim(input.questionLink) : '',
    solutionLink: validator.isURL(input.solutionLink) ? validator.trim(input.solutionLink) : ''
  };
}

function isValidProblemInput(input) {
  return (
    input.serial &&
    input.title &&
    input.difficulty &&
    input.topic &&
    input.questionLink &&
    input.solutionLink &&
    validator.isInt(String(input.serial)) &&
    validator.isLength(input.title, { min: 1, max: 200 }) &&
    validator.isLength(input.difficulty, { min: 1, max: 50 }) &&
    validator.isLength(input.topic, { min: 1, max: 100 }) &&
    validator.isURL(input.questionLink) &&
    validator.isURL(input.solutionLink)
  );
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
    // Log error internally but do not expose details to client
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to fetch problems from database',
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!isValidProblemInput(body)) {
      return Response.json({
        success: false,
        message: 'Invalid input data.'
      }, { status: 400 });
    }
    const sanitizedBody = sanitizeProblemInput(body);
    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    let serialToCheck = sanitizedBody.serial;
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

    const result = await collection.insertOne(sanitizedBody);

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
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    if (!body._id || !isValidProblemInput(body)) {
      return Response.json({
        success: false,
        message: 'Invalid input data.'
      }, { status: 400 });
    }
    const { _id, ...updateData } = body;
    const sanitizedUpdate = sanitizeProblemInput(updateData);
    const database = await connectToDatabase();
    const collection = database.collection('leetcodelinks');

    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: sanitizedUpdate }
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
      error: 'Internal server error'
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
    // Log error internally but do not expose details to client
    console.error('Database error:', error);
    return Response.json({
      success: false,
      message: 'Failed to delete problem',
      error: 'Internal server error'
    }, { status: 500 });
  }
}
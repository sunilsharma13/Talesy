// app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Writing from '@/models/writing'; // Assuming your Mongoose model for posts is named 'Writing'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Ensure this path is correct
import mongoose from 'mongoose';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    // params is an object, no need to await it
    const { id: postId } = params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Populate the 'author' field, selecting 'name', 'email', and 'image' (for avatar)
    const writing = await Writing.findById(postId).populate('author', 'name email image');

    if (!writing) {
      return NextResponse.json({ error: 'Writing not found' }, { status: 404 });
    }

    // Convert the Mongoose document to a plain JavaScript object
    // This is crucial for proper JSON serialization, especially with populated fields.
    const plainWriting = writing.toObject();

    return NextResponse.json(plainWriting);
  } catch (error) {
    console.error('Error fetching writing:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // params is an object, no need to await it
    const { id: postId } = params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const writingToDelete = await Writing.findById(postId);

    if (!writingToDelete) {
      return NextResponse.json(
        {
          error: 'Writing not found',
          details: "The writing may not exist.",
        },
        { status: 404 }
      );
    }

    // Ensure the user trying to delete is the author of the writing
    if (writingToDelete.author.toString() !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: "You are not the author of this writing.",
        },
        { status: 403 }
      );
    }

    const result = await Writing.findByIdAndDelete(postId);

    if (result) {
      return NextResponse.json({ success: true, message: 'Writing deleted successfully' });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to delete writing',
          details: 'The writing was found but could not be deleted.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting writing:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
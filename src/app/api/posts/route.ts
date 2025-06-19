import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect'; // Now use your Mongoose dbConnect
import Post from '@/models/post'; // Adjust path as per your project structure and ensure this model exists
import { authOptions } from '@/lib/auth'; // Adjust path as per your project structure

// GET all posts or a single post by ID (for editing/viewing)
export async function GET(req: Request) {
  try {
    await dbConnect();
        const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a single post
      const post = await Post.findById(id).populate('author', 'name email image'); // Populate author for display
      if (!post) {
        return NextResponse.json({ message: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json(post);
    } else {
      // Fetch all posts (consider pagination or filtering for larger apps)
      const posts = await Post.find({}).sort({ createdAt: -1 }).populate('author', 'name email image');
      return NextResponse.json(posts);
    }
  } catch (error: any) {
    console.error("Error in GET /api/posts:", error);
    return NextResponse.json({ message: "Failed to fetch posts", error: error.message }, { status: 500 });
  }
}

// POST a new post
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { title, content, imageUrl, status, tags } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
    }

    const newPost = await Post.create({
      title,
      content, // This will now be HTML
      imageUrl: imageUrl || '',
      status: status || 'draft',
      author: session.user.id, // Assuming session.user.id holds the MongoDB ObjectId of the user
      tags: tags || [], // Save the tags array
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: 'Post created successfully', _id: newPost._id, ...newPost.toObject() }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/posts:", error);
    return NextResponse.json({ message: "Failed to create post", error: error.message }, { status: 500 });
  }
}

// PUT (Update) an existing post
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Post ID is required for updating.' }, { status: 400 });
    }

    const { title, content, imageUrl, status, tags } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required.' }, { status: 400 });
    }

    const postToUpdate = await Post.findById(id);

    if (!postToUpdate) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // Authorization check: Ensure the current user is the author of the post
    if (postToUpdate.author.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: You are not the author of this post.' }, { status: 403 });
    }

    postToUpdate.title = title;
    postToUpdate.content = content; // Update with new HTML content
    postToUpdate.imageUrl = imageUrl || '';
    postToUpdate.status = status || 'draft';
    postToUpdate.tags = tags || []; // Update the tags array
    postToUpdate.updatedAt = new Date();

    await postToUpdate.save();

    return NextResponse.json({ message: 'Post updated successfully', ...postToUpdate.toObject() }, { status: 200 });
  } catch (error: any) {
    console.error("Error in PUT /api/posts:", error);
    return NextResponse.json({ message: "Failed to update post", error: error.message }, { status: 500 });
  }
}

// DELETE a post
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Post ID is required for deletion.' }, { status: 400 });
    }

    const postToDelete = await Post.findById(id);

    if (!postToDelete) {
      return NextResponse.json({ message: 'Post not found.' }, { status: 404 });
    }

    // Authorization check: Ensure the current user is the author of the post
    if (postToDelete.author.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: You are not the author of this post.' }, { status: 403 });
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error("Error in DELETE /api/posts:", error);
    return NextResponse.json({ message: "Failed to delete post", error: error.message }, { status: 500 });
  }
}
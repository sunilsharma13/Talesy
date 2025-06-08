"use client";

import Link from "next/link";

export default function StoryCard({ story }: { story: any }) {
  return (
    <Link href={`/write/${story.id}`}>
      <div className="border rounded-lg p-4 hover:shadow transition">
        <h2 className="text-xl font-semibold mb-2">{story.title}</h2>
        <p className="text-sm text-gray-400 mb-2 italic">
          {story.status === "draft" ? "📝 Draft" : "✅ Published"}
        </p>
        <p className="text-gray-600 mb-4">
          {story.content.substring(0, 100)}...
        </p>
        <p className="text-xs text-gray-400">
          {new Date(story.createdAt).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

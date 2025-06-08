"use client";
import React from "react";

interface Draft {
  _id: string;
  title: string;
  content: string;
}

interface DraftModalProps {
  drafts: Draft[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DraftModal({
  drafts,
  onClose,
  onEdit,
  onDelete,
}: DraftModalProps) {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full text-black">
        <h2 className="text-xl font-bold mb-4">Your Drafts</h2>
        <ul>
          {drafts.length === 0 ? (
            <p>No drafts available.</p>
          ) : (
            drafts.map((draft) => (
              <li key={draft._id} className="mb-4">
                <h3 className="font-semibold text-gray-800">{draft.title}</h3>
                <p className="text-gray-600">
                  {draft.content.slice(0, 100)}...
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => onEdit(draft._id)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(draft._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

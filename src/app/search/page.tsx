// app/search/page.tsx
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchClient />
    </Suspense>
  );
}

function SearchLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
      <div className="animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-6 bg-gray-800 rounded-xl p-5">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
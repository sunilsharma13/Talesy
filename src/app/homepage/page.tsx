// src/homepage/page.tsx
import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomeClient />
    </Suspense>
  );
}

function HomePageLoading() {
  // Loading state UI - Improved to match HomeClient's skeleton
  return (
    <div className="min-h-screen bg-gray-900 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          {/* Profile section skeleton */}
          <div className="rounded-xl p-6 w-full md:w-1/3 lg:w-1/4 bg-gray-800/50">
            <div className="h-48 w-full rounded-t-lg bg-gray-700/50 mb-4"></div> {/* Cover image */}
            <div className="flex justify-center -mt-20 mb-4">
              <div className="w-36 h-36 rounded-full bg-gray-600/50 border-4 border-white"></div> {/* Avatar */}
            </div>
            <div className="h-8 bg-gray-600/50 rounded w-3/4 mx-auto mb-3"></div> {/* Name */}
            <div className="h-4 bg-gray-600/50 rounded w-1/2 mx-auto mb-6"></div> {/* Email */}
            <div className="h-4 bg-gray-600/50 rounded w-11/12 mx-auto mb-2"></div> {/* Bio line 1 */}
            <div className="h-4 bg-gray-600/50 rounded w-10/12 mx-auto mb-6"></div> {/* Bio line 2 */}
            <div className="flex justify-center space-x-8 border-t border-b border-gray-700/50 py-4 px-2">
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div> {/* Stat 1 */}
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div> {/* Stat 2 */}
              <div className="h-8 w-1/4 bg-gray-600/50 rounded"></div> {/* Stat 3 */}
            </div>
            <div className="h-10 bg-gray-600/50 rounded-full w-2/3 mx-auto mt-6"></div> {/* Button */}
            <div className="mt-8 space-y-3">
              <div className="h-8 bg-gray-600/50 rounded"></div>
              <div className="h-8 bg-gray-600/50 rounded"></div>
              <div className="h-8 bg-gray-600/50 rounded"></div>
            </div>
          </div>

          {/* Stories section skeleton */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <div className="h-10 bg-gray-800/50 rounded w-1/3 mb-6"></div> {/* Section title */}
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-5 h-40"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
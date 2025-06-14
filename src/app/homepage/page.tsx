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
  // Loading state UI
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile section */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-700 rounded-xl p-6 h-96"></div>
          </div>
          
          {/* Stories section */}
          <div className="w-full md:w-2/3">
            <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-700 rounded-xl p-5 h-40"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
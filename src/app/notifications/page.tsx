// app/notifications/page.tsx (or pages/notifications.tsx)
import React from 'react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-extrabold mb-6 text-indigo-400">Your Notifications</h1>
      <p className="text-xl text-gray-300 max-w-2xl text-center">
        This is where all your personalized updates and alerts will appear. Stay tuned for new interactions!
      </p>
      <div className="mt-8 text-gray-500 text-lg">
        {/* You'll integrate actual notification fetching here later */}
        <p>No new notifications at the moment. Keep creating!</p>
      </div>
    </div>
  );
}
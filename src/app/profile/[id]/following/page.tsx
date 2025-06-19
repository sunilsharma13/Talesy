// app/profile/[id]/following/page.tsx
// This is a Server Component, so no "use client" here
import FollowingClient from './FollowingClient'; // Import the new client component

interface FollowingPageProps {
  params: {
    id: string;
  };
}

// This component is implicitly async because it's a Server Component receiving params
export default async function FollowingPage({ params }: FollowingPageProps) {
  // Access params directly here, it's not a Promise in a Server Component
  const profileUserId = params.id;

  // You can optionally fetch initial data here in the Server Component
  // and pass it to FollowingClient as a prop, for better performance (SSR).
  // For now, we'll let FollowingClient fetch everything.

  return (
    <FollowingClient profileUserId={profileUserId} />
  );
}
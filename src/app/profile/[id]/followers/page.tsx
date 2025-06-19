// app/profile/[id]/followers/page.tsx
// This is a Server Component, so no "use client" here
import FollowersClient from './FollowersClient'; // Import the new client component

interface FollowersPageProps {
  params: {
    id: string;
  };
}

// This component is implicitly async because it's a Server Component receiving params
export default async function FollowersPage({ params }: FollowersPageProps) {
  // Access params directly here, it's not a Promise in a Server Component
  const profileUserId = params.id;

  // You can optionally fetch initial data here in the Server Component
  // and pass it to FollowersClient as a prop, for better performance (SSR).
  // For now, we'll let FollowersClient fetch everything.

  return (
    <FollowersClient profileUserId={profileUserId} />
  );
}
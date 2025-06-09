import { Suspense } from 'react';
import UserPageClient from './UserPageClient';

// ✅ Don't define a custom type for `params`
export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserPageClient userId={params.id} />
    </Suspense>
  );
}

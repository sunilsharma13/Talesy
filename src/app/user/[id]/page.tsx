// app/user/[id]/page.tsx
import { Suspense } from 'react';
import UserPageClient from './UserPageClient';

// ✅ Follow exact typing required by typedRoutes
export default function UserPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserPageClient userId={params.id} />
    </Suspense>
  );
}

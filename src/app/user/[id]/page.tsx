// app/user/[id]/page.tsx
import { Suspense } from 'react';
import UserPageClient from './UserPageClient';

interface PageParams {
  id: string;
}

export default function UserPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserPageClient userId={params.id} />
    </Suspense>
  );
}
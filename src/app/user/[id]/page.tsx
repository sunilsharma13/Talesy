// app/user/[id]/page.tsx
import { Metadata } from 'next';
import UserPageClient from './UserPageClient';

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Optional: Add metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `User ${params.id}`,
    description: 'User profile page',
  };
}

export default function UserPage({ params }: Props) {
  return <UserPageClient userId={params.id} />;
}
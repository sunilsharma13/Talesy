import UserPageClient from './UserPageClient';

type Props = {
  params: { id: string };
};

export default function UserPage({ params }: Props) {
  return <UserPageClient userId={params.id} />;
}

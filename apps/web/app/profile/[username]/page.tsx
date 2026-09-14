import { ProfileBody } from "@/components/meta/ProfileBody";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileBody username={username} />;
}

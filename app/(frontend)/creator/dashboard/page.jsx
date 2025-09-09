"use client";
import { useUser } from "@clerk/nextjs";

export default function Profile() {
  const { user } = useUser();

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <p>User ID: {user.id}</p>
      <pre>{JSON.stringify(user.publicMetadata, null, 2)}</pre>
    </div>
  );
}

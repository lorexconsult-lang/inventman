import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/features/team/actions";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const client = await createClient();
  const { data } = await client.auth.getClaims();
  if (!token)
    return (
      <InviteMessage
        title="Invitation unavailable"
        text="This invitation link is invalid or incomplete."
      />
    );
  if (!data?.claims?.sub)
    return (
      <InviteMessage
        title="Sign in to accept"
        text="Use the invited email address. The invitation is still validated securely after authentication."
      >
        <Link
          className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 font-semibold text-white"
          href={`/auth/login?next=${encodeURIComponent(`/invite?token=${token}`)}`}
        >
          Sign in
        </Link>
      </InviteMessage>
    );
  return (
    <main className="mx-auto max-w-xl p-6 sm:py-16">
      <h1 className="text-3xl font-bold">Join organization</h1>
      <p className="mt-3 text-subtle">
        Confirm to activate the role and branch access selected by the inviter.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-warning-soft p-3 text-warning"
        >
          This invitation is invalid, expired, revoked, already used, or belongs
          to another account.
        </p>
      )}
      <form action={acceptInvitation} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          Accept invitation
        </button>
      </form>
    </main>
  );
}
function InviteMessage({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-xl p-6 text-center sm:py-16">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-subtle">{text}</p>
      {children}
    </main>
  );
}

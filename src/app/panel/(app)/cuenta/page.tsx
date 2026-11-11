import { requireUser } from "@/lib/auth";
import { PasswordForm } from "@/components/panel/password-form";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="pmain pmain--form">
      <header className="pmain__head"><div><h1 className="h2">Mi cuenta</h1><p className="muted small">{user.email}</p></div></header>
      <PasswordForm />
    </div>
  );
}

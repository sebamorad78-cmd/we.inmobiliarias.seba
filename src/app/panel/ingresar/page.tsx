import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/site-header";
import { LoginForm } from "@/components/panel/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentUser()) redirect("/panel");
  const { next } = await searchParams;
  return (
    <main className="login">
      <div className="login__card">
        <Logo />
        <h1 className="h2" style={{ marginTop: 28 }}>Panel del equipo</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Ingresá con tu email y contraseña.</p>
        <LoginForm next={next} />
      </div>
    </main>
  );
}

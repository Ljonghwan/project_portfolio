import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

export default function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main className="wrap">
        <div className={wide ? "signup-wrap" : "auth-wrap"}>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

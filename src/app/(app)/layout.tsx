import { signOut } from "../login/actions";
import { BottomNav } from "@/components/bottom-nav";

// Frame for every signed-in screen: a quiet header, the page, and a tab bar
// along the bottom where your thumb is.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <header className="mx-auto flex h-13 w-full max-w-xl items-center justify-between px-5">
        <span className="text-body-sm font-medium">Investing Companion</span>
        <form action={signOut}>
          <button type="submit" className="btn-ghost">
            Sign out
          </button>
        </form>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}

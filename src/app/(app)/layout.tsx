import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

// Frame for every signed-in screen: a quiet header, the page, and a tab bar
// along the bottom where your thumb is.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <header className="mx-auto flex h-13 w-full max-w-xl items-center justify-between px-5">
        <Link href="/" className="text-body-sm font-medium">
          Investing Companion
        </Link>
        {/* A word, not an icon: a cog drawn this small reads as a sun. */}
        <Link href="/settings" className="btn-ghost -mr-3 px-3 py-3">
          Settings
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}

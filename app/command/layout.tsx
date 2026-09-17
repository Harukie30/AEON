import type { Metadata } from "next";
import { CommandShell } from "@/components/command/command-shell";

export const metadata: Metadata = {
  title: "AEON // Command Deck",
};

export default function CommandLayout({
  children,
}: LayoutProps<"/command">) {
  return <CommandShell>{children}</CommandShell>;
}

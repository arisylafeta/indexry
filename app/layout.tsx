import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indexry",
  description: "A Next.js project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

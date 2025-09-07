import { Header } from "@/components/layout/header";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header spécifique au dashboard */}
      <Header />
      <div className="pt-20 flex h-[calc(100vh)]">{children}</div>
    </div>
  );
}

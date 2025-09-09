import { Header } from "@/components/layout/header";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<div className="min-h-screen flex flex-col">
  {/* Header */}
  <Header />

  {/* Zone contenu qui prend le reste de l’écran */}
  <div className="flex-1 max-h-[90vh] overflow-hidden">
    {children}
  </div>
</div>
  );
}

import { Sidebar } from "@/components/Sidebar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

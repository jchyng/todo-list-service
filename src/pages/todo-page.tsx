import { Header } from "@/components/Header";

export default function TodoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 flex items-center justify-center flex-1 h-[calc(100vh-64px)]">
        <h1 className="text-4xl font-bold text-foreground">Todo Page</h1>
      </main>
    </div>
  );
}

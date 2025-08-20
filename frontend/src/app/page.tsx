import ManualChat from "../components/ManualChat";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#3a3430]">
      <header className="p-3 px-6 flex justify-start">
        <h1 className="text-3xl font-light text-white/90">Coudini</h1>
      </header>
      <main className="flex-1 flex">
        <ManualChat />
      </main>
    </div>
  );
}

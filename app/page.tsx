import { Chat } from "@/components/Chat";
import { LightRays } from "@/components/ui/light-rays";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative">
      <LightRays />
      <main>
        <Chat />
      </main>
    </div>
  );
}

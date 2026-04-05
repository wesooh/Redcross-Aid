import { ChatLayout } from "@/components/pfa-chatbot/chat-layout";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export default async function PfaChatbotPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="h-full">
        <ChatLayout userId={user.id} />
    </div>
  );
}

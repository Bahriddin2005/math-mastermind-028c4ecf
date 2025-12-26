import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, faqContext, coursesContext, lessonsContext, userProgressContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Sen IQroMax - mental arifmetika platformasi uchun yordam yordamchisisisan. 
Foydalanuvchilarga saytdan foydalanish, mashq qilish, kurslar va boshqa savollariga javob ber.
Javoblaringni o'zbek tilida, qisqa va aniq qilib yoz. Iltimos, 2-3 gapdan oshmasin.
Agar bilmasang, foydalanuvchini /contact sahifasiga yo'naltir.

Platforma haqida ma'lumot:
- Bu mental arifmetika o'rganish platformasi
- Foydalanuvchilar matematika mashqlarini yechadi
- Video kurslar va darslar mavjud
- Leaderboard orqali boshqalar bilan raqobatlashish mumkin
- Kunlik maqsad belgilash mumkin
- Achievements (yutuqlar) tizimi bor

FAQ ma'lumotlar:
${faqContext || 'Mavjud emas'}

Mavjud kurslar:
${coursesContext || 'Hozircha kurslar yo\'q'}

Mavjud darslar:
${lessonsContext || 'Hozircha darslar yo\'q'}

Foydalanuvchi progressi:
${userProgressContext || 'Ma\'lumot yo\'q'}

Foydalanuvchi kurslar yoki darslar haqida so'rasa, yuqoridagi ma'lumotlardan foydalanib javob ber.
Agar kurs yoki dars nomi so'ralsa, /courses sahifasiga yo'naltir.
Foydalanuvchi o'z statistikasi, balli, yechgan masalalari, seriyasi haqida so'rasa - yuqoridagi progressdan javob ber.

Har doim do'stona va yordam beruvchi bo'l!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Juda ko'p so'rov yuborildi. Biroz kuting va qaytadan urinib ko'ring." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI xizmati vaqtincha mavjud emas." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI xatoligi yuz berdi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Kechirasiz, javob bera olmadim.";

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Help chat error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "Noma'lum xatolik" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

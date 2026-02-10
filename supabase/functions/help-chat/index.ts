import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication: require a valid user ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, faqContext, coursesContext, lessonsContext, userProgressContext, imageBase64, pdfBase64, pdfFileName } = await req.json();

    // --- Input validation ---
    if (!message && !imageBase64 && !pdfBase64) {
      return new Response(JSON.stringify({ error: "Xabar yoki fayl talab qilinadi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message && typeof message === "string" && message.length > 10000) {
      return new Response(JSON.stringify({ error: "Xabar juda uzun (max 10000 belgi)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate base64 sizes (max 5MB each)
    const MAX_BASE64_SIZE = 5 * 1024 * 1024 * 1.37; // ~5MB in base64
    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ error: "Rasm hajmi juda katta (max 5MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ error: "PDF hajmi juda katta (max 5MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are IQroMax - a multilingual AI assistant for a mental arithmetic learning platform.

LANGUAGE DETECTION & RESPONSE RULES:
- Detect the language of user's message automatically
- If user writes in English → respond in English
- If user writes in Russian → respond in Russian (Русский)
- If user writes in Uzbek or any other language → respond in Uzbek
- Always respond in the SAME language the user used
- Keep responses short (2-3 sentences max) unless solving a math problem or analyzing a document

MATH PROBLEM SOLVING:
- If user asks to solve a math problem, ALWAYS solve it step by step
- Show the solution process clearly
- Format: Problem → Steps → Answer
- For mental arithmetic problems, explain the technique used
- Support all basic operations: +, -, ×, ÷, powers, roots, percentages
- If an image is provided, analyze it for math problems and solve them

IMAGE ANALYSIS:
- If an image is provided, analyze its content
- For math problems in images, extract and solve them
- For other images, describe what you see and relate it to math if possible

PDF DOCUMENT ANALYSIS:
- If a PDF is provided, analyze its content thoroughly
- Extract key information, summaries, or answer questions about the document
- If the PDF contains math problems, solve them
- Provide structured summaries for educational content

PLATFORM INFO:
- Mental arithmetic learning platform
- Users practice math problems
- Video courses and lessons available
- Leaderboard for competition
- Daily goals and achievements system
- Contact page at /contact for support

FAQ DATA:
${faqContext || 'Not available'}

AVAILABLE COURSES:
${coursesContext || 'No courses yet'}

AVAILABLE LESSONS:
${lessonsContext || 'No lessons yet'}

USER PROGRESS:
${userProgressContext || 'No data'}

INSTRUCTIONS:
- If asked about courses/lessons, use the data above and direct to /courses
- If asked about user stats/score/streak, use the progress data above
- If you don't know something, direct to /contact page
- Be friendly and helpful!
- For Russian: используй простой и понятный язык
- For English: use simple and clear language
- For Uzbek: sodda va tushunarli til ishlating`;

    // Build messages array
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Handle multimodal content
    if (imageBase64 || pdfBase64) {
      const contentParts: any[] = [
        { type: "text", text: message || (pdfBase64 ? `Bu PDF hujjatni (${pdfFileName || 'document.pdf'}) tahlil qiling va asosiy ma'lumotlarni chiqaring.` : "Bu rasmni tahlil qiling va agar matematika masalasi bo'lsa, yeching.") }
      ];

      if (imageBase64) {
        contentParts.push({ 
          type: "image_url", 
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` } 
        });
      }

      if (pdfBase64) {
        contentParts.push({ 
          type: "file",
          file: {
            filename: pdfFileName || "document.pdf",
            file_data: `data:application/pdf;base64,${pdfBase64}`
          }
        });
      }

      messages.push({
        role: "user",
        content: contentParts
      });
    } else {
      messages.push({ role: "user", content: message });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 2000,
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
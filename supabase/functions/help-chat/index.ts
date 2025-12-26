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
    const { message, faqContext, coursesContext, lessonsContext, userProgressContext, imageBase64, pdfBase64, pdfFileName } = await req.json();
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
        // For PDF, we include it as a file for the model to process
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

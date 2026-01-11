
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3001;

// The API key must be in the backend's environment variable
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/analyze', async (req, res) => {
  const { text, lang } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Matn yuborilmadi" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Siz professional huquqshunos va xavfsizlik bo'yicha ekspertsiz. 
          Quyidagi hujjat matnini tahlil qilib, foydalanuvchi uchun xavfli bo'lishi mumkin bo'lgan bandlarni, 
          noaniq majburiyatlarni va yashirin shartlarni toping.
          
          Hujjat matni: 
          ${text.substring(0, 38000)}

          Tahlilni ${lang === 'uz' ? 'O\'zbek' : lang === 'ru' ? 'Rus' : 'Ingliz'} tilida taqdim eting.
          Javobni FAQAT JSON formatida qaytaring.`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasRisks: { type: Type.BOOLEAN },
            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clause: { type: Type.STRING, description: "Xavfli deb topilgan band matni" },
                  level: { type: Type.STRING, enum: ["high", "medium", "low"] },
                  explanation: { type: Type.STRING, description: "Nima uchun xavfli ekanligi haqida tushuntirish" }
                },
                required: ["clause", "level", "explanation"]
              }
            },
            summary: { type: Type.STRING, description: "Hujjat bo'yicha umumiy qisqa xulosa" }
          },
          required: ["hasRisks", "risks", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: "Hujjatni tahlil qilishda ichki xatolik yuz berdi." });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend server Clauseg.ai ishga tushdi: port ${port}`);
});

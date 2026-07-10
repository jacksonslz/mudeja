import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON request body parsing with size limit for audio payloads
  app.use(express.json({ limit: "25mb" }));

  // API endpoints must go FIRST
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "Parâmetro 'audio' (base64) ausente." });
      }
      if (!mimeType) {
        return res.status(400).json({ error: "Parâmetro 'mimeType' ausente." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "A variável de ambiente GEMINI_API_KEY não foi configurada. Acesse Configurações > Segredos para adicioná-la." 
        });
      }

      // Initialize the official Gemini SDK
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const audioPart = {
        inlineData: {
          mimeType: mimeType,
          data: audio,
        },
      };

      const promptPart = {
        text: "Transcreva com máxima precisão o áudio em português que contém observações de vistoria de móveis. Forneça apenas a transcrição limpa, direta e fiel do que foi dito, sem introduções, explicações, comentários adicionais ou aspas. Se o áudio estiver completamente em silêncio ou inaudível, responda exatamente com: (Sem observações faladas)",
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [audioPart, promptPart] },
      });

      const transcription = response.text || "";
      res.json({ text: transcription.trim() });
    } catch (error: any) {
      console.error("Erro na transcrição Gemini:", error);
      res.status(500).json({ 
        error: `Falha na transcrição por IA: ${error?.message || "Erro desconhecido."}` 
      });
    }
  });

  // Vite development middleware vs. Production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] rodando com sucesso em http://localhost:${PORT}`);
  });
}

startServer();

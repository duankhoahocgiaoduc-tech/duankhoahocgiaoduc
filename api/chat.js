export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Thiếu nội dung tin nhắn (message)" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chưa cấu hình biến môi trường GEMINI_API_KEY trên Vercel" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Nếu Google API trả về lỗi, bắt và log lại để dễ debug
    if (!response.ok || data.error) {
      console.error("Lỗi từ Google Gemini API:", data);
      return res.status(response.status || 500).json({
        error: data.error?.message || "Lỗi từ Google Gemini API",
        raw: data,
      });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({
        error: "Gemini không trả về dữ liệu hợp lệ",
        raw: data,
      });
    }

    const reply = data.candidates[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Lỗi Server nội bộ:", error);
    return res.status(500).json({ error: error.message });
  }
}

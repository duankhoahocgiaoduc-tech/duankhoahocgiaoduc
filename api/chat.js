export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history, type } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Thiếu nội dung tin nhắn (message)" });
    }

    // Phân luồng API Key theo biến type từ frontend
    let apiKey = process.env.GEMINI_API_KEY; // Key dự phòng

    if (type === 'giasu') {
      apiKey = process.env.GEMINI_KEY_GIASU;
    } else if (type === 'taode') {
      apiKey = process.env.GEMINI_KEY_TAODE;
    } else if (type === 'tuvan') {
      apiKey = process.env.GEMINI_KEY_TUVAN;
    }

    if (!apiKey) {
      return res.status(500).json({ error: `Chưa cấu hình API Key cho tính năng ${type || 'mặc định'} trên Vercel` });
    }

    // Xử lý lịch sử chat cho tính năng Tư vấn
    let contents = [];
    if (history && history.length > 0) {
      contents = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Lỗi API:", data);
      return res.status(response.status || 500).json({
        error: data.error?.message || "Lỗi từ Google Gemini API",
      });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "Gemini không trả về dữ liệu hợp lệ" });
    }

    const reply = data.candidates[0]?.content?.parts?.[0]?.text || "Không có phản hồi từ AI.";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Lỗi Server:", error);
    return res.status(500).json({ error: error.message });
  }
}

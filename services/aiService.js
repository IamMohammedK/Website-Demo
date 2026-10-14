const { GoogleGenerativeAI } = require('@google/generative-ai');

// يتم قراءة المفتاح تلقائياً من ملف .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function analyzeWithAI(urlData) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return "تنبيه: لم يتم ضبط مفتاح GEMINI_API_KEY في ملف .env بعد.";
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
أنت خبير أمن سيبراني ومحلل برمجيات خبيثة وتصيد إلكتروني.
قم بتحليل الرابط التالي وتقديم تقرير أمني مختصر ودقيق باللغة العربية:

- الرابط: ${urlData.url}
- النطاق: ${urlData.domain}
- النتيجة التقريبية الأولية: ${urlData.score}/100
- التحذيرات المرصودة: ${JSON.stringify(urlData.warnings)}

يرجى إعطاء تقييم موجز يحتوي على:
1. تحليل للهندسة الاجتماعية والاحتيال إن وجد.
2. ما إذا كان الرابط ينطوي على خطورة على بيانات المستخدم.
3. توصية أمان سريعة.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return "تعذر إكمال تحليل الذكاء الاصطناعي في الوقت الحالي. تحقق من إعداد مفتاح API.";
    }
}

module.exports = { analyzeWithAI };
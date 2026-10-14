const express = require('express');
const router = express.Router();
const { scanUrl } = require('../services/scanner');
const { analyzeWithAI } = require('../services/aiService');

// POST /api/scan - فحص سريع للرابط
router.post('/scan', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'يرجى تزويد الرابط المطلوب فحصه.' });
    }

    const result = scanUrl(url);
    if (!result.isValid) {
        return res.status(400).json({ error: result.error });
    }

    return res.json(result);
});

// POST /api/ai-analyze - تحليل متقدم عبر Gemini AI
router.post('/ai-analyze', async (req, res) => {
    const { urlData } = req.body;
    if (!urlData) {
        return res.status(400).json({ error: 'بيانات الفحص مفقودة.' });
    }

    const aiReport = await analyzeWithAI(urlData);
    return res.json({ report: aiReport });
});

module.exports = router;
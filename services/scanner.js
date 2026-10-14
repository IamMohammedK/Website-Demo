/**
 * محرك الفحص الذاتي (Heuristic & Rule-Based Detection Engine)
 */

// حساب مسافة Levenshtein لكشف انتحال الشخصية (Typosquatting)
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

function scanUrl(urlString) {
    let score = 100;
    const warnings = [];
    let parsed;

    try {
        let formattedUrl = urlString.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'http://' + formattedUrl;
        }
        parsed = new URL(formattedUrl);
    } catch (e) {
        return {
            isValid: false,
            error: "الرابط المخل غير صالحة صيغته التشكيلية."
        };
    }

    const domain = parsed.hostname.toLowerCase();
    const fullPath = parsed.pathname.toLowerCase() + parsed.search.toLowerCase();
    const protocol = parsed.protocol;

    // 1. فحص البروتوكول (SSL/TLS)
    if (protocol !== 'https:') {
        score -= 25;
        warnings.push({ level: 'danger', message: 'الموقع لا يستخدم تشفير آمن (HTTPS).' });
    }

    // 2. كشف الروابط المعنونة بـ IP مباشرة (IP vs Domain Name)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(domain)) {
        score -= 30;
        warnings.push({ level: 'danger', message: 'الرابط يستهدف عنوان IP مباشر، وهو سلوك شائع في هجمات الاختراق.' });
    }

    // 3. كشف انتحال العلامات التجارية (Typosquatting Detection)
    const famousDomains = ['paypal.com', 'google.com', 'apple.com', 'amazon.com', 'microsoft.com', 'github.com', 'facebook.com', 'bankofamerica.com', 'alrajhibank.com.sa'];
    for (const target of famousDomains) {
        const dist = levenshteinDistance(domain, target);
        if (dist > 0 && dist <= 2 && !domain.includes(target)) {
            score -= 40;
            warnings.push({ level: 'danger', message: `اشتباه عالي بأسلوب Typosquatting (محاولة انتحال النطاق الشهير: ${target}).` });
            break;
        }
    }

    // 4. كشف امتدادات الملفات التنفيذية الضارة
    const dangerousExts = ['.exe', '.scr', '.vbs', '.bat', '.apk', '.cmd', '.jar', '.ps1', '.sh', '.msi'];
    if (dangerousExts.some(ext => fullPath.endsWith(ext) || fullPath.includes(ext + '?'))) {
        score -= 40;
        warnings.push({ level: 'danger', message: 'الرابط يؤدي مباشرة إلى تحميل ملف تنفيذي قد يكون ضاراً.' });
    }

    // 5. كشف الكلمات المفتاحية لمصايد التصيد والاحتيال (Phishing Keywords)
    const phishingKeywords = ['login', 'verify', 'account', 'update', 'secure', 'banking', 'signin', 'confirm', 'wallet', 'free', 'bonus', 'prize'];
    const matchedKeywords = phishingKeywords.filter(kw => fullPath.includes(kw) || domain.includes(kw));
    if (matchedKeywords.length > 0 && !famousDomains.some(d => domain.endsWith(d))) {
        score -= 15 * Math.min(matchedKeywords.length, 2);
        warnings.push({ level: 'warning', message: `الرابط يحتوي على كلمات مفتاحية تُستخدم بكثرة في صفحات التصيد: (${matchedKeywords.join(', ')})` });
    }

    // 6. كشف النطاقات عالية الخطورة (Suspicious TLDs)
    const riskyTLDs = ['.top', '.xyz', '.zip', '.mov', '.work', '.click', '.gq', '.cf', '.tk', '.ml'];
    if (riskyTLDs.some(tld => domain.endsWith(tld))) {
        score -= 20;
        warnings.push({ level: 'warning', message: 'النطاق العلوي (TLD) ينتمي إلى فئات مجانية أو مرتفعة المخاطر.' });
    }

    // 7. النطاقات الطويلة بشكل مفرط
    if (domain.length > 35) {
        score -= 10;
        warnings.push({ level: 'warning', message: 'طول النطاق غير طبيعي ويستخدم نصاً مفرطاً للتضليل.' });
    }

    const finalScore = Math.max(0, score);
    let status = 'SAFE';
    if (finalScore < 50) status = 'DANGEROUS';
    else if (finalScore < 80) status = 'SUSPICIOUS';

    return {
        isValid: true,
        url: parsed.href,
        domain: domain,
        protocol: protocol.replace(':', ''),
        score: finalScore,
        status: status,
        warnings: warnings,
        scannedAt: new Date().toISOString()
    };
}

module.exports = { scanUrl };
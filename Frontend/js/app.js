let currentScanData = null;

document.getElementById('scanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('urlInput').value.trim();
    const scanBtn = document.getElementById('scanBtn');

    if (!urlInput) return;

    scanBtn.disabled = true;
    scanBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> جاري الفحص...`;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlInput })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'حدث خطأ أثناء فحص الرابط.');
            return;
        }

        currentScanData = data;
        renderResults(data);

    } catch (error) {
        console.error(error);
        alert('تعذر الاتصال بالسيرفر. تأكد من تشغيل Node.js Backend.');
    } finally {
        scanBtn.disabled = false;
        scanBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass me-1"></i> فحص الرابط`;
    }
});

function renderResults(data) {
    document.getElementById('resultsSection').classList.remove('d-none');
    
    // Score & Status
    const scoreDisplay = document.getElementById('scoreDisplay');
    const statusBadge = document.getElementById('statusBadge');
    
    scoreDisplay.innerText = `${data.score}/100`;
    
    if (data.status === 'SAFE') {
        scoreDisplay.className = 'display-2 fw-bold my-2 text-success';
        statusBadge.className = 'badge bg-success fs-6 py-2 px-3 mx-auto mt-2';
        statusBadge.innerText = 'رابط آمن';
    } else if (data.status === 'SUSPICIOUS') {
        scoreDisplay.className = 'display-2 fw-bold my-2 text-warning';
        statusBadge.className = 'badge bg-warning text-dark fs-6 py-2 px-3 mx-auto mt-2';
        statusBadge.innerText = 'رابط مشبوه';
    } else {
        scoreDisplay.className = 'display-2 fw-bold my-2 text-danger';
        statusBadge.className = 'badge bg-danger fs-6 py-2 px-3 mx-auto mt-2';
        statusBadge.innerText = 'رابط خطير جداً';
    }

    // Metadata
    document.getElementById('resUrl').innerText = data.url;
    document.getElementById('resDomain').innerText = data.domain;
    document.getElementById('resProtocol').innerText = data.protocol.toUpperCase();

    // Warnings
    const warningsContainer = document.getElementById('warningsContainer');
    warningsContainer.innerHTML = '';

    if (data.warnings.length === 0) {
        warningsContainer.innerHTML = `<div class="alert alert-success bg-transparent border-success text-success mb-0">لم يتم رصد أي أنماط مشبوهة أو مخاطر معروفة في هذا الرابط.</div>`;
    } else {
        data.warnings.forEach(w => {
            const alertClass = w.level === 'danger' ? 'alert-danger' : 'alert-warning';
            warningsContainer.innerHTML += `
                <div class="alert ${alertClass} bg-transparent mb-2">
                    <i class="fa-solid fa-triangle-exclamation me-2"></i>${w.message}
                </div>
            `;
        });
    }

    // Reset AI Container
    document.getElementById('aiReportContent').innerText = 'اضغط على "توليد تحليل ذكي" للحصول على تقرير متعمق من نموذج الذكاء الاصطناعي.';
}

// AI Analysis Button Handler
document.getElementById('aiBtn').addEventListener('click', async () => {
    if (!currentScanData) return;

    const aiBtn = document.getElementById('aiBtn');
    const aiReportContent = document.getElementById('aiReportContent');

    aiBtn.disabled = true;
    aiReportContent.innerHTML = `<div class="spinner-border spinner-border-sm text-purple me-2"></span> جاري تحليل الرابط عبر Gemini AI...`;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/ai-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urlData: currentScanData })
        });

        const data = await response.json();
        aiReportContent.innerHTML = `<div class="text-light style="white-space: pre-line;">${data.report}</div>`;

    } catch (error) {
        console.error(error);
        aiReportContent.innerText = 'حدث خطأ أثناء التواصل مع نموذج الذكاء الاصطناعي.';
    } finally {
        aiBtn.disabled = false;
    }
});
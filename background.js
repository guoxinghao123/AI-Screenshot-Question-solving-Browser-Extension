// background.js

// ================= 配置区 =================
const AI_API_URL = "https://api.deepseek.com/v1/chat/completions";
const AI_API_KEY = "sk-XXXXXXX"; // 这里填写你的deepseek密钥
const MODEL_NAME = "deepseek-v4-pro"; // 可以在模型官网配置不同的版本，这里使用V4-Pro为例
                                    // 例如deepseeek V4-Flash或者deepseek V4-Pro
                                    // 详情请看 https://deepseek.com/docs/models/

const OCR_SPACE_API_KEY = "---Your API Key---"; //换成你的 OCR.space 密钥
const OCR_LANGUAGE = "chs"; //识别中文
// ==========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // 1. 系统级截图
    if (request.action === "CAPTURE_SCREEN") {
        try {
            chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "jpeg", quality: 100 }, (dataUrl) => {
                // 必须捕获 lastError，否则会引起崩溃
                if (chrome.runtime.lastError) {
                    console.error("截图权限错误: ", chrome.runtime.lastError.message);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    return;
                }
                sendResponse({ success: true, dataUrl: dataUrl });
            });
        } catch (e) {
            sendResponse({ success: false, error: e.message });
        }
        return true; 
    }

    // 2. OCR 请求
    if (request.action === "DO_OCR") {
        const formData = new URLSearchParams();
        formData.append("base64Image", request.imageDataUrl);
        formData.append("apikey", OCR_SPACE_API_KEY);
        formData.append("language", OCR_LANGUAGE);
        formData.append("isOverlayRequired", "false");

        fetch("https://api.ocr.space/parse/image", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
        })
        .then(res => res.json())
        .then(data => sendResponse({ success: true, data: data }))
        .catch(err => sendResponse({ success: false, error: err.message }));
        
        return true;
    }

    // 3. AI 请求
    if (request.action === "DO_AI") {
        fetch(AI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {"role": "system", "content": "你是一个专业的搜题助手，请直接给出答案和详细解析。"},
                    {"role": "user", "content": request.question}
                ],
                temperature: 0.5
            })
        })
        .then(res => res.json())
        .then(data => sendResponse({ success: true, data: data }))
        .catch(err => sendResponse({ success: false, error: err.message }));

        return true;
    }
});
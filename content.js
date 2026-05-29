// content.js

// 1. 防御机制：防止被重复注入，防止注入到 iframe 子网页中
if (window !== window.top) {
    console.log("[AI截图搜题] 在 iframe 中，停止注入。");
} else if (window.__ai_injected) {
    console.log("[AI截图搜题] 已经注入过，防止重复运行。");
} else {
    window.__ai_injected = true;
    initAssistant();
}

function initAssistant() {
    document.getElementById('ai-assistant-btn')?.remove();
    document.getElementById('ai-assistant-panel')?.remove();
    document.getElementById('screenshot-overlay')?.remove();
    // 注入样式
    const style = document.createElement('style');
    style.innerHTML = `
        #ai-assistant-btn {
            position: fixed; bottom: 50px; right: 50px; width: 60px; height: 60px;
            background: linear-gradient(135deg, #00c6ff, #0072ff);
            border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            color: white; font-size: 24px; text-align: center; line-height: 60px;
            cursor: pointer; z-index: 2147483647; user-select: none; transition: transform 0.2s;
        }
        #ai-assistant-btn:hover { transform: scale(1.1); }
        
        /* 修改为圆角悬浮窗样式 */
        #ai-assistant-panel {
            position: fixed; top: 20px; right: 20px; width: 360px; height: 550px;
            background: #f9f9f9; box-shadow: 0 8px 30px rgba(0,0,0,0.2);
            z-index: 2147483646; display: none; flex-direction: column;
            font-family: sans-serif; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;
        }
        #ai-assistant-panel.open { display: flex; }
        
        /* 标题栏增加 move 光标 */
        .ai-panel-header {
            padding: 15px 20px; background: #fff; border-bottom: 1px solid #eee;
            display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #333;
            cursor: move; user-select: none;
        }
        .ai-close-btn { cursor: pointer; color: #888; font-size: 20px; transition: color 0.2s; }
        .ai-close-btn:hover { color: #ff4d4f; }
        
        .ai-chat-box { flex: 1; padding: 20px; overflow-y: auto; background: #fafafa; }
        .ai-message { margin-bottom: 15px; padding: 10px 15px; border-radius: 8px; max-width: 85%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
        .ai-user-msg { background: #e3f2fd; align-self: flex-end; margin-left: auto; color: #333; border-bottom-right-radius: 2px;}
        .ai-bot-msg { background: white; border: 1px solid #eee; color: #333; border-bottom-left-radius: 2px;}
        .ai-error-msg { background: #ffebee; border: 1px solid #ffcdd2; color: #c62828; }
        .ai-status-msg { font-size: 12px; color: #888; text-align: center; margin-bottom: 10px; }
        
        /* 新增：底部输入区域样式 */
        .ai-input-area {
            display: flex; padding: 12px; border-top: 1px solid #eee; background: #fff; align-items: center;
        }
        .ai-input-area textarea {
            flex: 1; height: 20px; min-height: 20px; max-height: 80px; border: 1px solid #ddd; border-radius: 6px;
            padding: 8px 10px; resize: none; outline: none; font-size: 13px; font-family: inherit; line-height: 20px;
        }
        .ai-input-area textarea:focus { border-color: #0072ff; }
        .ai-input-area button {
            margin-left: 10px; padding: 0 15px; height: 38px; background: #0072ff; color: white;
            border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s;
        }
        .ai-input-area button:hover { background: #005ce6; }

        #screenshot-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.2); z-index: 2147483647; cursor: crosshair; display: none;
        }
        #screenshot-box {
            position: absolute; border: 2px dashed #0072ff; background: rgba(0, 114, 255, 0.1); display: none; pointer-events: none;
        }
        .ai-preview-img { max-width: 100%; border-radius: 4px; margin-top: 5px; border: 1px solid #ddd; }
    `;
    document.head.appendChild(style);

    // 构建 UI
    const btn = document.createElement('div');
    btn.id = 'ai-assistant-btn';
    btn.innerHTML = '✂️';
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.id = 'ai-assistant-panel';
    panel.innerHTML = `
        <div class="ai-panel-header" id="ai-panel-header">
            <span>✨ AI截图搜题 -- by Moonlight1116</span>
            <span class="ai-close-btn" id="ai-close-btn">✖</span>
        </div>
        <div class="ai-chat-box" id="ai-chat-box">
            <div class="ai-message ai-bot-msg">你可以点击下方 ✂️ 按钮截图，也可以直接在底部对话框向我提问~</div>
        </div>
        <div class="ai-input-area">
            <textarea id="ai-chat-input" placeholder="输入你想问的问题，按回车发送..."></textarea>
            <button id="ai-send-btn">发送</button>
        </div>
    `;
    document.body.appendChild(panel);

    const overlay = document.createElement('div');
    overlay.id = 'screenshot-overlay';
    const selectionBox = document.createElement('div');
    selectionBox.id = 'screenshot-box';
    overlay.appendChild(selectionBox);
    document.body.appendChild(overlay);

    const chatBox = panel.querySelector('#ai-chat-box');
    const header = panel.querySelector('#ai-panel-header');
    
    // 面板开关逻辑
    btn.addEventListener('click', () => {
        panel.classList.add('open');
    });
    panel.querySelector('#ai-close-btn').addEventListener('click', () => {
        panel.classList.remove('open');
    });

    // ================= 窗口拖拽逻辑 =================
    let isDraggingPanel = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    header.addEventListener('mousedown', (e) => {
        isDraggingPanel = true;
        const rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingPanel) return;
        e.preventDefault(); // 防止拖拽时选中文字
        
        let newX = e.clientX - dragOffsetX;
        let newY = e.clientY - dragOffsetY;
        
        // 边界保护，防止窗口被拖出屏幕外拿不回来
        newX = Math.max(0, Math.min(newX, window.innerWidth - panel.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - panel.offsetHeight));
        
        panel.style.left = newX + 'px';
        panel.style.top = newY + 'px';
        panel.style.right = 'auto'; // 清除默认的 right 定位
    });

    window.addEventListener('mouseup', () => {
        isDraggingPanel = false;
    });

    // ================= 手动发送对话逻辑 =================
    const chatInput = panel.querySelector('#ai-chat-input');
    const sendBtn = panel.querySelector('#ai-send-btn');

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        chatInput.value = ''; // 清空输入框
        addMessage(text, 'user'); // 将用户文本加入气泡
        doAIRequest(text); // 发起AI请求
    }

    sendBtn.addEventListener('click', handleSend);
    
    // 监听回车键发送 (支持 Shift+Enter 换行)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认的回车换行
            handleSend();
        }
    });

    // ================= 消息展示逻辑 =================
    function addMessage(text, type, imgUrl = null) {
        const msg = document.createElement('div');
        msg.className = `ai-message ${type}-msg`;
        msg.innerText = text;
        if (imgUrl) {
            const img = document.createElement('img');
            img.src = imgUrl;
            img.className = 'ai-preview-img';
            msg.appendChild(img);
        }
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function updateStatus(text) {
        let status = document.getElementById('ai-status');
        if (!status) {
            status = document.createElement('div');
            status.id = 'ai-status';
            status.className = 'ai-status-msg';
            chatBox.appendChild(status);
        }
        status.innerText = text;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function removeStatus() {
        const status = document.getElementById('ai-status');
        if (status) status.remove();
    }

   // ================= 悬浮按钮拖拽 & 截图逻辑 =================
    let startX, startY, isDrawing = false;

    // 按钮拖拽状态变量
    let isDraggingBtn = false;
    let btnDragOffsetX = 0;
    let btnDragOffsetY = 0;
    let hasDraggedBtn = false; // 用于区分是“拖拽”还是“点击”

    // 1. 鼠标按下，准备拖拽按钮
    btn.addEventListener('mousedown', (e) => {
        isDraggingBtn = true;
        hasDraggedBtn = false; // 重置拖拽标记
        
        // 获取按钮当前真实的坐标
        const rect = btn.getBoundingClientRect();
        btnDragOffsetX = e.clientX - rect.left;
        btnDragOffsetY = e.clientY - rect.top;
        
        // 将 CSS 的 bottom/right 定位强行转换为 left/top 定位，方便跟随鼠标
        btn.style.left = rect.left + 'px';
        btn.style.top = rect.top + 'px';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';
        
        e.preventDefault(); // 防止触发浏览器的默认拖拽行为
    });

    // 2. 鼠标移动，执行拖拽
    window.addEventListener('mousemove', (e) => {
        // ---- 这一段是新增的按钮拖拽逻辑 ----
        if (isDraggingBtn) {
            hasDraggedBtn = true; // 标记已经发生过位移
            
            let newX = e.clientX - btnDragOffsetX;
            let newY = e.clientY - btnDragOffsetY;
            
            // 边界保护，防止按钮被拖出屏幕外
            newX = Math.max(0, Math.min(newX, window.innerWidth - btn.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - btn.offsetHeight));
            
            btn.style.left = newX + 'px';
            btn.style.top = newY + 'px';
        }

        // ---- 下面是原有的框选截图逻辑 ----
        if (!isDrawing) return;
        selectionBox.style.left = Math.min(startX, e.clientX) + 'px';
        selectionBox.style.top = Math.min(startY, e.clientY) + 'px';
        selectionBox.style.width = Math.abs(e.clientX - startX) + 'px';
        selectionBox.style.height = Math.abs(e.clientY - startY) + 'px';
    });

    // 3. 鼠标松开
    window.addEventListener('mouseup', (e) => {
        // 如果正在拖拽按钮，则结束拖拽
        if (isDraggingBtn) {
            isDraggingBtn = false;
        }

        // ---- 原有的框选截图结束逻辑 ----
        if (!isDrawing) return;
        isDrawing = false;
        
        const rect = {
            x: Math.min(startX, e.clientX),
            y: Math.min(startY, e.clientY),
            width: Math.abs(e.clientX - startX),
            height: Math.abs(e.clientY - startY)
        };

        overlay.style.display = 'none';
        selectionBox.style.display = 'none';

        if (rect.width < 20 || rect.height < 20) {
            updateStatus("框选区域太小，已取消。");
            setTimeout(removeStatus, 2000);
            return;
        }

        setTimeout(() => {
            executeNativeScreenshot(rect);
        }, 150);
    });

    // 4. 修改按钮的 Click 事件：拦截拖拽导致的误触
    btn.addEventListener('click', (e) => {
        if (hasDraggedBtn) {
            // 如果刚刚进行了拖拽，就阻止这次点击事件，不触发截图
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        // 只有纯粹的点击，才会打开面板和截图遮罩
        panel.classList.add('open');
        overlay.style.display = 'block';
    });

    // 5. 原有的框选遮罩按下逻辑
    overlay.addEventListener('mousedown', (e) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
    });
    // ================= 原生截图与裁剪 =================
    function executeNativeScreenshot(rect) {
        updateStatus("正在调用系统截图...");
        
        try {
            chrome.runtime.sendMessage({ action: "CAPTURE_SCREEN" }, (response) => {
                if (chrome.runtime.lastError) {
                    addMessage("扩展通信失败，请刷新网页重试。\n错误：" + chrome.runtime.lastError.message, "ai-error");
                    removeStatus();
                    return;
                }

                if (!response || !response.success) {
                    addMessage("截图失败: " + (response ? response.error : "未知错误"), "ai-error");
                    removeStatus();
                    return;
                }

                const fullScreenDataUrl = response.dataUrl;
                
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                    const ctx = canvas.getContext('2d');
                    
                    const scale = window.devicePixelRatio || 1;
                    ctx.drawImage(
                        img,
                        rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale,
                        0, 0, rect.width, rect.height
                    );

                    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    addMessage("截图成功，准备识别：", "user", croppedDataUrl);
                    doOCRRequest(croppedDataUrl);
                };
                
                img.onerror = () => {
                    removeStatus();
                    addMessage("图片渲染失败！可能是该网站的 CSP 安全策略禁止了。", "ai-error");
                };
                
                img.src = fullScreenDataUrl;
            });
        } catch(e) {
            removeStatus();
            addMessage("发生致命错误：" + e.message, "ai-error");
        }
    }

    // ================= 请求 OCR =================
    function doOCRRequest(imageDataUrl) {
        updateStatus("正在上传至 OCR...");
        chrome.runtime.sendMessage({ action: "DO_OCR", imageDataUrl: imageDataUrl }, (response) => {
            removeStatus();
            if (chrome.runtime.lastError) {
                addMessage("OCR 通信失败: " + chrome.runtime.lastError.message, "ai-error");
                return;
            }
            if (!response || !response.success) {
                addMessage("OCR 接口请求失败：" + (response ? response.error : "未知网络错误"), "ai-error");
                return;
            }
            
            const res = response.data;
            if (res.IsErroredOnProcessing) {
                addMessage("OCR 报错：" + (res.ErrorMessage || "图片问题"), "ai-error");
                return;
            }
            
            if (res.ParsedResults && res.ParsedResults.length > 0) {
                const text = res.ParsedResults[0].ParsedText.trim();
                if (!text) {
                    addMessage("识别成功，但没提取到文字。图太模糊了吗？你可以在下方手动输入问题。", "ai-error");
                    return;
                }
                addMessage(`[识别出的文字]：\n${text}`, "ai-bot");
                doAIRequest(text);
            } else {
                addMessage("OCR 没找到文本，请尝试手动输入。", "ai-error");
            }
        });
    }

    // ================= 请求 AI =================
    function doAIRequest(text) {
        updateStatus("AI 正在思考中...");
        chrome.runtime.sendMessage({ action: "DO_AI", question: text }, (response) => {
            removeStatus();
            if (!response || !response.success) {
                addMessage("AI 请求失败：" + (response ? response.error : "未知"), "ai-error");
                return;
            }
            
            const resJson = response.data;
            if (resJson.choices && resJson.choices.length > 0) {
                addMessage(resJson.choices[0].message.content, "ai-bot");
            } else {
                addMessage("AI 接口返回异常，请检查配置。", "ai-error");
            }
        });
    }
}
# 欢迎使用AI截图搜题助手
###   AI-Screenshot-Question-solving-Browser-Extension


## -功能特点-

- **基于Chromium内核**: 支持运行在Chromium内核的浏览器上
- **配置灵活**: 支持自定义OCR模型和AI接口
- **响应式设计**: 完美适配各种设备
- **多网页支持**: 支持主流网课平台

## -使用方式-
1. 在本地创建文件夹
2. 下载所有代码到文件夹
3. 打开background.js文件，找到配置区
4. 找到`const AI_API_KEY = "sk-XXXXXXX"; `，将引号里的改为自己的API
5. 找到`const MODEL_NAME = "deepseek-v4-pro";`，在引号里可以切换不同模型，具体请在官网查阅
6. 找到`const OCR_SPACE_API_KEY = "---Your API Key---";`将引号里的改为自己的OCR API Key
7. 修改后保存文件，打开支持Chromium内核的浏览器，以Edge为例，设置中找到扩展，打开开发人员模式，找到 **加载解压缩的扩展** 选项，点击包含扩展文件的文件夹（也就是你一开始创建的文件夹）扩展加载成功后点击启用开关，此时再返回你需要搜题的网页，按下 **ctrl＋F5** 强制刷新，本扩展就可以使用了。


## -API服务-
- 自用OCR API（准确率尚可，有免费额度） ：https://ocr.space/
- 免费 OCR 与文本识别 API： https://www.rinuo.com/free/ocr
- deepseek开放平台：https://platform.deepseek.com/

## -To Find Me-
- 使用过程中若有问题，请联系我或提交Issues
- Issues： https://github.com/guoxinghao123/AI-Screenshot-Question-solving-Browser-Extension/issues
-  Email: 2932421492@qq.com

# 祝您使用愉快！！！
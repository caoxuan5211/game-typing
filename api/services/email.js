const nodemailer = require('nodemailer');

const emailPort = parseInt(process.env.EMAIL_PORT || '465', 10);
const authConfig = process.env.EMAIL_PASS
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
    : undefined;

// 创建邮件传输器
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: emailPort,
    secure: emailPort === 465,
    auth: authConfig
});

// 验证邮件配置
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email service error:', error.message);
    } else {
        console.log('✅ Email service ready');
    }
});

/**
 * 发送验证码邮件
 */
async function sendVerificationCode(email, code) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Code Typing Lab - 登录验证码',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                        padding: 40px 30px;
                        text-align: center;
                        color: white;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .code-box {
                        background: #F3F4F6;
                        border: 2px dashed #3B82F6;
                        border-radius: 8px;
                        padding: 30px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .code {
                        font-size: 36px;
                        font-weight: bold;
                        color: #3B82F6;
                        letter-spacing: 8px;
                        font-family: 'Courier New', monospace;
                    }
                    .tips {
                        color: #6B7280;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-top: 20px;
                    }
                    .footer {
                        background: #F9FAFB;
                        padding: 20px 30px;
                        text-align: center;
                        color: #9CA3AF;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Code Typing Lab</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #111827; margin-bottom: 20px;">登录验证码</h2>
                        <p style="color: #4B5563; line-height: 1.6;">
                            您正在登录 Code Typing Lab，请使用以下验证码完成登录：
                        </p>
                        <div class="code-box">
                            <div class="code">${code}</div>
                        </div>
                        <div class="tips">
                            <p>• 验证码有效期为 <strong>10分钟</strong></p>
                            <p>• 如果这不是您本人的操作，请忽略此邮件</p>
                            <p>• 请勿将验证码告知他人</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>此邮件由系统自动发送，请勿回复</p>
                        <p>© ${new Date().getFullYear()} Code Typing Lab. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email send error:', error);
        throw error;
    }
}

/**
 * 生成6位数字验证码
 */
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    sendVerificationCode,
    generateCode
};

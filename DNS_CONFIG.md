# DNS 配置指南 - mineguai.com

## 🎯 你的服务器信息
- 域名：mineguai.com
- IPv4：160.25.134.111
- IPv6：2602:fd6f:80::1bb

---

## 📝 需要添加的 DNS 记录

### 1. SPF 记录（必须添加）⭐

**防止邮件被识别为垃圾邮件**

```
类型：TXT
主机记录：@
记录值：v=spf1 ip4:160.25.134.111 ip6:2602:fd6f:80::1bb ~all
TTL：600
```

### 2. DMARC 记录（推荐）

**邮件验证策略**

```
类型：TXT
主机记录：_dmarc
记录值：v=DMARC1; p=none; rua=mailto:admin@mineguai.com
TTL：600
```

### 3. MX 记录（可选，如果需要接收邮件）

```
类型：MX
主机记录：@
记录值：mail.mineguai.com
优先级：10
TTL：600
```

### 4. A 记录（给 mail 子域名）

```
类型：A
主机记录：mail
记录值：160.25.134.111
TTL：600
```

---

## 🔧 如何添加（以阿里云为例）

1. 登录阿里云控制台
2. 进入「域名」→「mineguai.com」→「解析设置」
3. 点击「添加记录」
4. 按照上面的信息填写
5. 点击「确认」

**腾讯云、Cloudflare 等其他服务商类似操作。**

---

## ⏱️ 等待 DNS 生效

添加完成后，等待 5-10 分钟 DNS 记录生效。

**检查是否生效：**

```bash
# 检查 SPF 记录
dig TXT mineguai.com +short

# 或者使用 nslookup
nslookup -type=TXT mineguai.com
```

应该看到类似：
```
"v=spf1 ip4:160.25.134.111 ip6:2602:fd6f:80::1bb ~all"
```

---

## ✅ 下一步

DNS 配置完成后，继续配置 API：

1. 上传 API 代码到服务器
2. 配置环境变量（使用本地 Postfix）
3. 安装依赖并启动
4. 测试发送邮件

详见：DEPLOYMENT_AUTH.md

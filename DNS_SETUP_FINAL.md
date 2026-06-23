# 🎯 DNS 配置清单 - mineguai.com

## 服务器信息
- 发件服务器：send.mineguai.com
- 收件服务器：mail.mineguai.com (Cloudflare - 已配置)
- 服务器 IPv4：160.25.134.111
- 服务器 IPv6：2602:fd6f:80::1bb

---

## 📝 需要添加的 DNS 记录

### 1️⃣ SPF 记录 ⭐必须添加

**作用：** 告诉收件服务器，你的 IP 有权发送邮件

```
类型：TXT
主机记录：@
记录值：v=spf1 ip4:160.25.134.111 ip6:2602:fd6f:80::1bb include:_spf.mx.cloudflare.net ~all
TTL：600
```

> ⚠️ 注意：保留了 Cloudflare 的 `include:_spf.mx.cloudflare.net`，确保收件功能正常

---

### 2️⃣ A 记录（指向发件服务器）

**作用：** 让 send.mineguai.com 指向你的服务器

```
类型：A
主机记录：send
记录值：160.25.134.111
TTL：600
```

---

### 3️⃣ DMARC 记录（推荐）

**作用：** 邮件验证策略

```
类型：TXT
主机记录：_dmarc
记录值：v=DMARC1; p=none; rua=mailto:admin@mineguai.com
TTL：600
```

---

## 🔍 如何检查配置是否生效

### 检查 SPF
```bash
dig TXT mineguai.com +short
# 应该显示：
# "v=spf1 ip4:160.25.134.111 ip6:2602:fd6f:80::1bb include:_spf.mx.cloudflare.net ~all"
```

### 检查 A 记录
```bash
dig A send.mineguai.com +short
# 应该显示：
# 160.25.134.111
```

---

## 📋 配置步骤（阿里云示例）

### 添加/更新 SPF 记录

1. 登录阿里云控制台
2. 域名 → mineguai.com → 解析设置
3. **如果已有 SPF (TXT @) 记录**：
   - 点击「修改」
   - 更新记录值为：`v=spf1 ip4:160.25.134.111 ip6:2602:fd6f:80::1bb include:_spf.mx.cloudflare.net ~all`
4. **如果没有 SPF 记录**：
   - 点击「添加记录」
   - 类型：TXT
   - 主机记录：@
   - 记录值：上面的值
5. 点击「确认」

### 添加 A 记录（send 子域名）

1. 点击「添加记录」
2. 填写：
   - 记录类型：A
   - 主机记录：send
   - 记录值：160.25.134.111
   - TTL：600
3. 点击「确认」

### 添加 DMARC 记录

1. 点击「添加记录」
2. 填写：
   - 记录类型：TXT
   - 主机记录：_dmarc
   - 记录值：v=DMARC1; p=none; rua=mailto:admin@mineguai.com
   - TTL：600
3. 点击「确认」

---

## ⏱️ 等待生效

- 通常 5-10 分钟生效
- 最长可能需要 24 小时（很少见）

---

## ✅ 配置完成后

DNS 记录添加完成后：

1. ✅ 等待 5-10 分钟
2. ✅ 检查 DNS 是否生效
3. ✅ 继续配置后端 API
4. ✅ 测试发送邮件

---

## 📧 发件地址

配置完成后，系统将使用：
- **发件地址**：noreply@mineguai.com
- **发件服务器**：send.mineguai.com (160.25.134.111)
- **收件服务器**：mail.mineguai.com (Cloudflare) - 保持不变

---

**准备好了吗？** 添加完 DNS 记录后告诉我，我帮你验证！

# 🚀 Guest User Quick Reference Card

## 📋 One-Line Setup
```powershell
cd volunteer-registration/scripts; .\complete-setup.ps1
```

## ⚠️ Manual Step (Required!)
```
1. Login to Salesforce → Setup → Users → Users
2. Find "Guest" → Edit
3. UNCHECK both MFA checkboxes → Save
```

## 🧪 Test Commands

### Verify User Exists
```powershell
sf data query --query "SELECT Id, Username FROM User WHERE Username='Guest'"
```

### Test OAuth & API Access (Comprehensive)
```powershell
cd volunteer-registration/backend
$env:GUEST_USERNAME="Guest"; $env:GUEST_PASSWORD="password"
node test-guest-login.js
```

**This test verifies:**
- ✅ User exists in Salesforce
- ✅ OAuth authentication works (no 2FA)
- ✅ Access token obtained
- ✅ Custom REST APIs accessible
- ✅ Bearer token authentication works

See: `volunteer-registration/backend/TEST_OAUTH_API.md`

### Test Backend
```powershell
# Terminal 1
cd volunteer-registration/backend; npm start

# Terminal 2
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -Body '{"Email__c":"test@example.com","password":"pass"}'
```

## 🔐 Environment Variables

### .env File
```env
GUEST_USERNAME=Guest
GUEST_PASSWORD=password
SF_TOKEN=
```

### GitHub Actions
```
Variables: GUEST_USERNAME = Guest
Secrets:   GUEST_PASSWORD = [your_password]
```

## 🐛 Quick Troubleshooting

| Error | Fix |
|-------|-----|
| INVALID_LOGIN | Disable 2FA in Salesforce |
| API_DISABLED_FOR_ORG | Setup → Company Info → Enable API |
| User Not Found | Run setup script again |
| Timeout | Check SF_LOGIN_URL |

## 📁 Key Files

```
volunteer-registration/
├── scripts/
│   ├── complete-setup.ps1           ← RUN THIS
│   ├── setup-guest-user.apex        ← Creates user
│   ├── test-guest-login.js          ← Test auth
│   ├── README.md                    ← Full docs
│   └── QUICK_START_GUEST_USER.md    ← Quick guide
├── force-app/default/
│   └── profiles/
│       └── GuestAPIProfile.profile-meta.xml
└── backend/
    ├── services/salesforce.js       ← Uses guest creds
    └── test-guest-login.js          ← Test script

.env                                 ← Store credentials
```

## 🎯 Success Checklist

- [ ] Run `complete-setup.ps1`
- [ ] Manually disable 2FA in Salesforce
- [ ] Run `test-guest-login.js` → ✅ PASSED
- [ ] Update `.env` with credentials
- [ ] Start backend → `npm start`
- [ ] Test login endpoint → 200 OK
- [ ] Deploy to production

## 🔗 Quick Links

- Full Setup: `scripts/GUEST_USER_SETUP.md`
- Quick Start: `scripts/QUICK_START_GUEST_USER.md`
- SF Docs: [Salesforce OAuth](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_username_password_flow.htm)

---
**TIP**: Print this card and keep it handy!

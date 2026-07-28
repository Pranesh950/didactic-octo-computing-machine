# Railway Backend Setup

## 1. Set Environment Variables in Railway Dashboard

1. Go to **[Railway Dashboard](https://railway.app)**
2. Select your project
3. Click the **Variables** tab
4. Add these variables:

| Variable | Value |
|----------|-------|
| `LLM_API_KEY` | `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` |
| `LLM_PRIMARY_MODEL` | `meta/llama-3.1-70b-instruct` |
| `LLM_FALLBACK_MODEL` | `meta/llama-3.1-8b-instruct` |

## 2. Redeploy

After adding the variables, Railway will automatically redeploy. You can also manually trigger a deploy from the **Deployments** tab.

## 3. Verify

Once deployed, check the health endpoint at:
```
https://your-railway-url.railway.app/health
```

# AWS Bedrock Integration Guide

Use this checklist to connect your AWS Bedrock account to HomeBridgr.

## 1. Enable Bedrock
- Confirm your AWS account has access to Bedrock in the region you want to use (for example `us-west-2`).
- In the Bedrock console, request access to the foundation model you plan to call (Claude, Titan, etc.).

## 2. Create IAM Credentials
- Create an IAM user or role with programmatic access.
- Grant the permissions:
  - `bedrock:InvokeModel`
  - (Optional) `bedrock:InvokeModelWithResponseStream` if you intend to stream responses.
- Generate an access key pair (access key id + secret access key) and store it securely.

## 3. Populate `.env.local`

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
AWS_BEDROCK_REGION=us-west-2      # optional override
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

- Keep `.env.local` out of version control.
- If you assume a role and get session tokens, add `AWS_SESSION_TOKEN=...`.

## 4. Verify Locally
- Install dependencies: `npm install`
- Run tests: `npm test`
- Execute a caption check:
  ```
  npm run bedrock:analyze -- "We totally slay, no cap!"
  ```
  You should receive JSON containing `terms` with explanations.
- Optionally, hit the running dev server: `curl -X POST http://localhost:3000/api/analysis ...`

## 5. Troubleshooting
- **401/403 errors** -> verify IAM permissions and that the region and model match what you enabled.
- **Configuration error (HTTP 501)** -> confirm `BEDROCK_MODEL_ID` and region env vars are set.
- **Invalid JSON errors** -> tighten the prompt in `lib/analysis.ts` so the model cannot deviate from the required JSON schema.

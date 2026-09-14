# Nashhal AI — Self-Hosted Inference

هذا المسار يشغّل نموذج Nashhal AI على خادم يملكه المشروع بدل الاعتماد على OpenAI أو Anthropic أو أي API تجاري.

## البنية

```text
GitHub
  ├── الكود
  ├── بيانات Nashhal
  ├── RAG
  └── إعدادات النموذج
          ↓
   خادم GPU خاص بنا
          ↓
   FastAPI /v1/chat
          ↓
   Nashhal AI Web
```

## التشغيل

يتطلب Docker + NVIDIA Container Toolkit + GPU مناسب.

```bash
docker compose -f ai/deploy/self-hosted/docker-compose.yml up --build
```

بعد التشغيل:

- `GET /health` للتحقق من الحالة
- `POST /v1/chat` للمحادثة

النموذج الافتراضي هو `Qwen/Qwen3-8B`. يمكن تغييره عبر `MODEL_ID` أو الإشارة إلى مسار محلي عبر `MODEL_PATH`.

## مهم

GitHub يخزن الكود والبيانات والإعدادات، لكنه لا يشغّل النموذج. عملية inference تتم على الخادم الذي تملكه أنت. بهذه البنية لا يحتاج المشروع إلى API تجاري خارجي.

لا تضع مفاتيح API أو أسرارًا داخل المستودع.

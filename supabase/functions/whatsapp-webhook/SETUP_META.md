# Setup WhatsApp Bot — Guía paso a paso

## Resumen de lo que ya está hecho

✅ Tablas en Supabase: `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_bot_config`
✅ Edge function `whatsapp-webhook` (recibe mensajes de Meta)
✅ Edge function `whatsapp-test` (probar el bot sin Meta)
✅ Agent con Claude Haiku 4.5 + 6 herramientas (servicios, disponibilidad, reservas, cancelar, escalar)
✅ Panel admin: `/admin/whatsapp` (ver conversaciones, devolver al bot, responder manualmente)

---

## Variables de entorno necesarias

En `supabase/functions/.env` (local) y en Supabase secrets (producción):

```bash
ANTHROPIC_API_KEY=sk-ant-...
WHATSAPP_VERIFY_TOKEN=nailox-verify-2026   # tú lo eliges, lo introduces en Meta
WHATSAPP_PHONE_ID=...                       # de Meta (paso 4)
WHATSAPP_ACCESS_TOKEN=...                   # de Meta (paso 4)
```

---

## Paso 1 — Cuenta en Meta Business Suite

1. Ve a [business.facebook.com](https://business.facebook.com)
2. Inicia sesión con tu Facebook (o crea una cuenta)
3. Crea un **Business Manager** si no tienes:
   - Nombre del negocio: NAILOX
   - Tu nombre y email de empresa

---

## Paso 2 — Crear app en Meta for Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. **Mis Apps** → **Crear App** → tipo **Empresa**
3. Datos:
   - Nombre: `NAILOX Bot`
   - Email: el tuyo
   - Empresa: NAILOX
4. En el panel de la app: **Agregar producto** → **WhatsApp** → **Configurar**

---

## Paso 3 — Configurar número de prueba (gratis para empezar)

Meta te da un **número de prueba gratuito** durante el desarrollo:

1. En tu app → **WhatsApp** → **API Setup**
2. Verás un número de prueba (formato `+1...`) — esto sirve para probar sin verificar tu número real
3. Agrega tu propio WhatsApp como **destinatario de prueba** (recibe el código por SMS)
4. **Importante:** Anota:
   - `Phone number ID` → es tu `WHATSAPP_PHONE_ID`
   - `Temporary access token` → es tu `WHATSAPP_ACCESS_TOKEN` (válido 24h, luego renovar o generar permanente)

---

## Paso 4 — Configurar webhook

1. En tu app → **WhatsApp** → **Configuration**
2. **Webhook** → **Edit**
3. Datos:
   - **Callback URL**: `https://expbduyqklpnnkyoapvi.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify token**: el mismo de tu `.env` (ej: `nailox-verify-2026`)
4. **Verify and save** — Meta enviará un GET al webhook y debe responder correctamente
5. **Webhook fields** → marca al menos:
   - ✅ `messages` (mensajes entrantes)
   - ✅ `message_status` (lectura/entrega)

---

## Paso 5 — Probar localmente con ngrok (opcional)

Si quieres probar el webhook real antes de desplegar:

```bash
brew install ngrok
ngrok http 54321
```

Usa la URL `https://xxx.ngrok-free.app/functions/v1/whatsapp-webhook` en el webhook de Meta.

---

## Paso 6 — Desplegar a producción

Cuando todo funcione local:

```bash
# Configurar secrets en Supabase producción
export SUPABASE_ACCESS_TOKEN="your_supabase_access_token_here"
npx supabase secrets set \
  ANTHROPIC_API_KEY="sk-ant-..." \
  WHATSAPP_VERIFY_TOKEN="nailox-verify-2026" \
  WHATSAPP_PHONE_ID="..." \
  WHATSAPP_ACCESS_TOKEN="..."

# Desplegar las edge functions
npx supabase functions deploy whatsapp-webhook --project-ref expbduyqklpnnkyoapvi
npx supabase functions deploy whatsapp-test --project-ref expbduyqklpnnkyoapvi

# Aplicar la migración
psql "postgresql://postgres.expbduyqklpnnkyoapvi:s5NkJ3Rp%3FpsskJ-@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/20260502000000_whatsapp_bot.sql
```

---

## Paso 7 — Verificar tu número de WhatsApp Business (producción)

Para usar tu número real (no el de prueba):

1. **WhatsApp** → **Phone Numbers** → **Add Phone Number**
2. Introduce tu número de WhatsApp Business
3. Recibirás código por SMS o llamada — verifica
4. **Importante:** el número que uses NO puede tener WhatsApp instalado en otro dispositivo. Si ya tienes WhatsApp Business app, tendrás que migrar el número o usar uno nuevo.

⚠️ **Verificación de empresa**: Para mensajes ilimitados Meta requiere verificar tu empresa con documentos (CIF/registro mercantil). Sin verificar puedes mandar máximo 250 conversaciones/mes — suficiente para empezar (tu volumen es ~60/mes).

---

## Paso 8 — Generar Access Token permanente

Los tokens de prueba caducan en 24h. Para producción:

1. **Settings** → **Business Settings** → **System Users**
2. **Add System User** → tipo **Admin**
3. **Assign Assets** → tu app de WhatsApp + permisos `whatsapp_business_management` y `whatsapp_business_messaging`
4. **Generate New Token** → marca los mismos permisos → **Never expires**
5. Copia el token y úsalo como `WHATSAPP_ACCESS_TOKEN`

---

## Cómo funciona en producción

```
Cliente envía mensaje → WhatsApp Cloud API
  → POST https://...supabase.co/functions/v1/whatsapp-webhook
    → Edge function recibe y procesa
      → Claude (Haiku 4.5) genera respuesta
        → Si necesita datos: ejecuta tools (services, availability, etc.)
      → Edge function envía respuesta vía Cloud API
        → Cliente recibe mensaje
  → Toda la conversación queda en /admin/whatsapp
```

---

## Probar el bot en local sin WhatsApp

Mientras esperas la verificación de Meta, puedes probar todo el bot directamente:

```bash
curl -X POST "http://127.0.0.1:54321/functions/v1/whatsapp-test" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+34600000001", "message": "Hola, quiero una manicura el sábado"}'
```

Y verlo en `http://localhost:3000/admin/whatsapp`.

---

## Costos resumidos

| Concepto | Coste mensual estimado (60 reservas/mes) |
|---|---|
| WhatsApp service conversations | **0€** (gratis hasta 1000/mes) |
| Claude Haiku 4.5 | **~3€** |
| Supabase + Vercel | **0€** (ya en plan) |
| **TOTAL** | **~3€/mes** |

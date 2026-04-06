"""
LETESE● AIPOT-COMMUNICATOR — Outbound Communications Agent
Handles: WhatsApp (360dialog), SMS (MSG91), Email (SendGrid), AI Voice (Exotel + ElevenLabs)
Consumes: letese.communications.dispatch
Produces: letese.diary.updates (delivery receipts), letese.police.errors
"""
import asyncio
import logging
import time
from typing import Optional

import httpx
from app.aipots.base import BaseAIPOT
from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Template IDs (360dialog / WhatsApp Business) ────────────────────────────
WHATSAPP_TEMPLATE_IDS = {
    "reminder_15d":   "case_reminder_15d",
    "reminder_7d":    "case_reminder_7d",
    "reminder_48h":   "case_reminder_48h",
    "reminder_24h":   "case_reminder_24h",
    "order_alert":    "new_order_alert",
    "payment_reminder": "payment_reminder",
    "document_chase": "document_chase",
}


class AIPOTCommunicator(BaseAIPOT):
    """
    Routes outbound communications by channel.

    Channels supported:
      - whatsapp  → 360dialog WhatsApp Business API
      - sms       → MSG91 SMS Gateway
      - email     → SendGrid Mail API
      - ai_call   → Exotel (telephony) + ElevenLabs (TTS)

    Payload schema (from letese.communications.dispatch):
      case_id, tenant_id, message_type, channel,
      recipient_phone, recipient_email,
      template_params, schedule_id, priority
    """
    input_topic = "letese.communications.dispatch"

    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def process_message(self, payload: dict) -> None:
        """Route message to the appropriate channel handler."""
        channel = payload.get("channel", "whatsapp")
        case_id = payload.get("case_id")
        tenant_id = payload.get("tenant_id")
        message_type = payload.get("message_type", "reminder_15d")

        logger.info(
            f"[COMMUNICATOR] channel={channel} case={case_id} "
            f"type={message_type} tenant={tenant_id}"
        )

        result = {"case_id": case_id, "tenant_id": tenant_id, "channel": channel}

        try:
            if channel == "whatsapp":
                success, detail = await self._send_whatsapp_template(payload)
                result["status"] = "sent" if success else "failed"
                result["whatsapp_message_id"] = detail

            elif channel == "sms":
                success, detail = await self._send_sms(payload)
                result["status"] = "sent" if success else "failed"
                result["sms_message_id"] = detail

            elif channel == "email":
                success, detail = await self._send_email(payload)
                result["status"] = "sent" if success else "failed"
                result["email_message_id"] = detail

            elif channel == "ai_call":
                success, detail = await self._place_voice_call(payload)
                result["status"] = "placed" if success else "failed"
                result["call_sid"] = detail

            else:
                raise ValueError(f"Unknown channel: {channel}")

        except Exception as e:
            logger.warning(f"[COMMUNICATOR] {channel} send failed: {e}")
            result["status"] = "failed"
            result["error"] = str(e)
            await self._log_to_db(case_id, channel, result)
            raise

        # Always log to DB
        await self._log_to_db(case_id, channel, result)

        # Publish delivery receipt to diary.updates
        await self.producer.send("letese.diary.updates", {
            "case_id": case_id,
            "tenant_id": tenant_id,
            "event_type": "communication_delivery",
            "channel": channel,
            "message_type": message_type,
            "status": result["status"],
            "timestamp": time.time(),
            "schedule_id": payload.get("schedule_id"),
        })

        logger.info(
            f"[COMMUNICATOR] {channel} → {result['status']} case={case_id}"
        )

    # ── WhatsApp (360dialog) ─────────────────────────────────────────────────

    async def _send_whatsapp_template(self, payload: dict) -> tuple[bool, str]:
        """
        Send WhatsApp message via 360dialog WhatsApp Business API.
        Returns (success, message_id_or_error).
        """
        if not settings.WHATSAPP_API_KEY:
            logger.warning("[COMMUNICATOR] WHATSAPP_API_KEY not set — skipping WhatsApp")
            return False, "WHATSAPP_API_KEY not configured"

        api_key = settings.WHATSAPP_API_KEY
        template_name = WHATSAPP_TEMPLATE_IDS.get(
            payload.get("message_type", ""), "case_reminder_15d"
        )
        params = payload.get("template_params", {})

        # Build 360dialog payload
        wa_payload = {
            "template": {
                "name": template_name,
                "language": {"code": "en"},
            },
            "recipient": {
                "type": "phone",
                "phone": payload.get("recipient_phone", ""),
            },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": str(params.get(k, ""))}
                        for k in ["case_title", "next_date", "client_name", "advocate_name"]
                        if k in params
                    ],
                }
            ],
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    "https://waba.360dialog.com/v1/messages",
                    json=wa_payload,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                return True, data.get("messages", [{}])[0].get("id", "unknown")

        except httpx.HTTPStatusError as e:
            logger.error(f"[COMMUNICATOR] WhatsApp HTTP error: {e.response.text}")
            return False, f"HTTP {e.response.status_code}"
        except Exception as e:
            logger.error(f"[COMMUNICATOR] WhatsApp send error: {e}")
            return False, str(e)

    # ── SMS (MSG91) ──────────────────────────────────────────────────────────

    async def _send_sms(self, payload: dict) -> tuple[bool, str]:
        """
        Send SMS via MSG91 REST API.
        Returns (success, message_id_or_error).
        """
        if not settings.MSG91_AUTH_KEY:
            logger.warning("[COMMUNICATOR] MSG91_AUTH_KEY not set — skipping SMS")
            return False, "MSG91_AUTH_KEY not configured"

        auth_key = settings.MSG91_AUTH_KEY
        sender_id = params = payload.get("template_params", {}).get("sender_id", "LETESE")
        route = "1"          # promotional
        country = "91"
        recipients = [payload.get("recipient_phone", "")]

        message = self._build_sms_text(payload)
        if not message:
            return False, "Could not build SMS text"

        sms_payload = {
            "authkey": auth_key,
            "sender": sender_id,
            "route": route,
            "country": country,
            "mobiles": "".join(r for r in recipients if r),
            "message": message,
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.get(
                    "https://control.msg91.com/api/sendhttp.php",
                    params=sms_payload,
                )
                resp.raise_for_status()
                # MSG91 returns plain message ID or comma-separated IDs
                return True, resp.text.strip()

        except httpx.HTTPStatusError as e:
            logger.error(f"[COMMUNICATOR] MSG91 HTTP error: {e.response.status_code}")
            return False, f"HTTP {e.response.status_code}"
        except Exception as e:
            logger.error(f"[COMMUNICATOR] MSG91 send error: {e}")
            return False, str(e)

    def _build_sms_text(self, payload: dict) -> str:
        """Build plain-text SMS from message_type and template_params."""
        msg_type = payload.get("message_type", "")
        params = payload.get("template_params", {})

        templates = {
            "reminder_15d":    "Reminder: Hearing in your case '{case_title}' is in 15 days on {next_date}. — LETESE Legal",
            "reminder_7d":     "Reminder: Hearing in '{case_title}' is in 7 days on {next_date}. — LETESE Legal",
            "reminder_48h":    "URGENT: Your case '{case_title}' hearing is in 48 hours on {next_date}. — LETESE Legal",
            "reminder_24h":    "URGENT: Tomorrow hearing for '{case_title}' on {next_date}. Advocate: {advocate_name}. — LETESE Legal",
            "order_alert":     "New order in '{case_title}' on {order_date}: {order_text}. — LETESE Legal",
            "payment_reminder": "Payment reminder: {amount} due for case '{case_title}' by {due_date}. — LETESE Legal",
            "document_chase": "Action required: Submit '{document_name}' for case '{case_title}' by {deadline}. — LETESE Legal",
        }

        template = templates.get(msg_type, "Update on your case: {case_title}")
        try:
            return template.format(**params)
        except KeyError:
            return template.format(case_title=params.get("case_title", "your case"))

    # ── Email (SendGrid) ─────────────────────────────────────────────────────

    async def _send_email(self, payload: dict) -> tuple[bool, str]:
        """
        Send transactional email via SendGrid Mail Send API.
        Returns (success, message_id_or_error).
        """
        if not settings.WHATSAPP_API_KEY:   # SendGrid uses same env key slot or separate
            logger.warning("[COMMUNICATOR] SendGrid API key not set — skipping email")
            return False, "SENDGRID_API_KEY not configured"

        api_key = settings.WHATSAPP_API_KEY   # TODO: swap for SENDGRID_API_KEY in config
        params = payload.get("template_params", {})
        recipient_email = payload.get("recipient_email", "")

        if not recipient_email:
            return False, "recipient_email not provided"

        subject, body_html = self._build_email(payload)

        email_payload = {
            "personalizations": [
                {
                    "to": [{"email": recipient_email}],
                    "dynamic_template_data": params,
                }
            ],
            "from": {"email": "noreply@letese.in", "name": "LETESE Legal"},
            "subject": subject,
            "content": [{"type": "text/html", "value": body_html}],
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=email_payload,
                    headers=headers,
                )
                # SendGrid returns 202 on success with no body
                if resp.status_code in (200, 201, 202):
                    msg_id = resp.headers.get("X-Message-Id", "sent")
                    return True, msg_id
                return False, f"HTTP {resp.status_code}: {resp.text[:200]}"

        except httpx.HTTPStatusError as e:
            logger.error(f"[COMMUNICATOR] SendGrid HTTP error: {e.response.status_code}")
            return False, f"HTTP {e.response.status_code}"
        except Exception as e:
            logger.error(f"[COMMUNICATOR] SendGrid send error: {e}")
            return False, str(e)

    def _build_email(self, payload: dict) -> tuple[str, str]:
        """Build email subject and HTML body from message_type."""
        msg_type = payload.get("message_type", "")
        params = payload.get("template_params", {})

        subjects = {
            "reminder_15d":    "Case Hearing Reminder — {case_title}",
            "reminder_7d":    "Upcoming Hearing — {case_title}",
            "reminder_48h":   "URGENT: Hearing Tomorrow — {case_title}",
            "reminder_24h":   "TOMORROW: Hearing — {case_title}",
            "order_alert":     "New Order Issued — {case_title}",
            "payment_reminder": "Payment Due — {case_title}",
            "document_chase":  "Document Required — {case_title}",
        }

        html_bodies = {
            "reminder_15d": """
                <h2>Case Hearing Reminder</h2>
                <p>Dear {client_name},</p>
                <p>This is a reminder that the next hearing in your case <strong>{case_title}</strong> is scheduled in <strong>15 days</strong> on <strong>{next_date}</strong>.</p>
                <p>Please contact your advocate <strong>{advocate_name}</strong> to prepare.</p>
                <p>— LETESE Legal</p>
            """,
            "order_alert": """
                <h2>New Order Issued</h2>
                <p>Dear {client_name},</p>
                <p>A new order has been issued in your case <strong>{case_title}</strong> on {order_date}.</p>
                <blockquote>{order_text}</blockquote>
                <p>— LETESE Legal</p>
            """,
        }

        default_html = """
            <h2>Update from LETESE Legal</h2>
            <p>Dear {client_name},</p>
            <p>Update on case: <strong>{case_title}</strong></p>
            <p>— LETESE Legal</p>
        """

        subject = subjects.get(msg_type, "Update from LETESE Legal").format(**params)
        body = html_bodies.get(msg_type, default_html).format(**params)
        return subject, body

    # ── AI Voice Call (Exotel + ElevenLabs TTS) ──────────────────────────────

    async def _place_voice_call(self, payload: dict) -> tuple[bool, str]:
        """
        Place an AI voice call via Exotel + ElevenLabs TTS.

        Flow:
          1. Synthesise audio via ElevenLabs TTS
          2. Upload to Exotel / use Exotel's TTS capability
          3. Initiate call via Exotel API
        Returns (success, call_sid_or_error).
        """
        if not settings.EXOTEL_API_KEY:
            logger.warning("[COMMUNICATOR] EXOTEL_API_KEY not set — skipping voice call")
            return False, "EXOTEL_API_KEY not configured"

        exotel_key = settings.EXOTEL_API_KEY
        exotel_token = settings.EXOTEL_API_TOKEN
        elevenlabs_key = settings.ELEVENLABS_API_KEY
        to_number = payload.get("recipient_phone", "")
        params = payload.get("template_params", {})
        message_type = payload.get("message_type", "reminder_24h")

        if not to_number:
            return False, "recipient_phone not provided"

        # Build call text
        call_text = self._build_call_script(payload)
        if not call_text:
            return False, "Could not build call script"

        # Synthesise via ElevenLabs
        audio_url = await self._synthesise_speech(call_text, elevenlabs_key)
        if not audio_url:
            return False, "ElevenLabs TTS synthesis failed"

        # Place call via Exotel
        call_sid = await self._exotel_initiate_call(
            exotel_key, exotel_token, to_number, audio_url
        )
        return bool(call_sid), call_sid or "unknown"

    async def _synthesise_speech(
        self, text: str, api_key: str
    ) -> Optional[str]:
        """Convert text to speech URL via ElevenLabs API. Returns audio URL."""
        if not api_key:
            return None

        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
            },
        }

        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.elevenlabs.io/v1/text-to-speech/voice_id",
                    # Note: voice_id should be configurable per tenant
                    json=payload,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                # ElevenLabs returns audio stream; we use the share URL or base64
                return data.get("audio_url") or data.get("share_url")

        except Exception as e:
            logger.error(f"[COMMUNICATOR] ElevenLabs TTS error: {e}")
            return None

    async def _exotel_initiate_call(
        self, api_key: str, api_token: str, to: str, audio_url: str
    ) -> Optional[str]:
        """Initiate outbound call via Exotel API. Returns call SID."""
        from base64 import b64encode

        auth = b64encode(f"{api_key}:{api_token}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        }

        # Exotel API: POST /v1/ExotelApi/SecureCalls/PlaceCall
        exotel_payload = {
            "From": to,
            "To": to,      # For app-to-person, Exotel handles routing
            "CallerId": settings.EXOTEL_API_KEY,  # Twilio-like: use configured caller
            "Url": audio_url,   # Exotel fetches this URL for TTS playback
            "StatusCallback": f"https://api.letese.in/webhooks/exotel/status",
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    "https://api.exotel.com/v1/Accounts/letese/Calls/connect.json",
                    json=exotel_payload,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("Call", {}).get("Sid")

        except Exception as e:
            logger.error(f"[COMMUNICATOR] Exotel call error: {e}")
            return None

    def _build_call_script(self, payload: dict) -> str:
        """Build plain-text script for TTS from message_type."""
        msg_type = payload.get("message_type", "")
        params = payload.get("template_params", {})

        scripts = {
            "reminder_24h": (
                "Namaste. This is an automated call from LETESE Legal. "
                "A reminder that the hearing in your case, {case_title}, "
                "is scheduled for tomorrow, {next_date}. "
                "Please contact your advocate, {advocate_name}, to prepare. "
                "Thank you."
            ),
            "reminder_48h": (
                "Namaste. This is an automated call from LETESE Legal. "
                "Your case, {case_title}, has a hearing in 48 hours, on {next_date}. "
                "Please take necessary action. Thank you."
            ),
            "order_alert": (
                "Namaste. An important update from LETESE Legal. "
                "A new order has been issued in your case, {case_title}. "
                "Please check the LETESE app for details. "
                "Thank you."
            ),
        }

        script = scripts.get(
            msg_type,
            f"Namaste. Update from LETESE Legal regarding case {params.get('case_title', 'your case')}."
        )
        try:
            return script.format(**params)
        except KeyError:
            return script

    # ── Database Logging ─────────────────────────────────────────────────────

    async def _log_to_db(self, case_id: str, channel: str, result: dict) -> None:
        """
        Log communication attempt to the communication_log table.
        Uses asyncpg directly since this runs inside an AIPOT, not a FastAPI request.
        """
        import asyncpg
        from app.core.config import settings

        try:
            pool = await asyncpg.create_pool(
                settings.DATABASE_URL, min_size=1, max_size=4
            )
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO communication_log
                      (case_id, channel, status, message_id, error_detail, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    """,
                    case_id,
                    channel,
                    result.get("status"),
                    result.get("whatsapp_message_id")
                    or result.get("sms_message_id")
                    or result.get("email_message_id")
                    or result.get("call_sid"),
                    result.get("error"),
                )
            await pool.close()
        except Exception as e:
            logger.warning(f"[COMMUNICATOR] DB log failed: {e}")


# ── Standalone entry point ────────────────────────────────────────────────────
async def main():
    from app.core.config import settings

    agent = AIPOTCommunicator(
        agent_id="AIPOT-COMMUNICATOR",
        kafka_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        redis_url=settings.REDIS_URL,
    )
    await agent.start()


if __name__ == "__main__":
    asyncio.run(main())

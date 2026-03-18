from fastapi import HTTPException
from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from app.config import settings
from app.core.logger import logger
from app.services.phone_verification_service import normalize_mobile_number


def _get_twilio_client() -> Client:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.error("[TWILIO_VERIFY] Missing Twilio credentials")
        raise HTTPException(status_code=500, detail="Twilio is not configured")

    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def _get_verify_service_sid() -> str:
    service_sid = settings.TWILIO_VERIFY_SERVICE_SID
    if not service_sid:
        logger.error("[TWILIO_VERIFY] Missing Verify Service SID")
        raise HTTPException(status_code=500, detail="Twilio Verify service is not configured")
    return service_sid


async def send_sms_verification(mobile_number: str) -> dict:
    """
    Start a Twilio Verify SMS verification.
    Twilio expects E.164 phone format.
    """
    to_number = normalize_mobile_number(mobile_number)
    client = _get_twilio_client()
    service_sid = _get_verify_service_sid()

    try:
        verification = client.verify.v2.services(service_sid).verifications.create(
            to=to_number,
            channel="sms",
        )

        logger.info(
            f"[TWILIO_VERIFY] SMS verification started mobile={to_number} "
            f"sid={verification.sid} status={verification.status}"
        )

        return {
            "sid": verification.sid,
            "to": verification.to,
            "channel": verification.channel,
            "status": verification.status,
        }

    except TwilioRestException as e:
        logger.error(
            f"[TWILIO_VERIFY] Failed to send verification mobile={to_number} "
            f"code={getattr(e, 'code', None)} error={str(e)}"
        )
        raise HTTPException(status_code=502, detail="Failed to send SMS verification")


async def check_sms_verification(mobile_number: str, code: str) -> dict:
    """
    Check the OTP entered by the user against Twilio Verify.
    Approved means success.
    """
    to_number = normalize_mobile_number(mobile_number)
    client = _get_twilio_client()
    service_sid = _get_verify_service_sid()

    try:
        check = client.verify.v2.services(service_sid).verification_checks.create(
            to=to_number,
            code=code,
        )

        logger.info(
            f"[TWILIO_VERIFY] Verification check mobile={to_number} "
            f"sid={check.sid} status={check.status}"
        )

        return {
            "sid": check.sid,
            "to": check.to,
            "status": check.status,
            "valid": check.status == "approved",
        }

    except TwilioRestException as e:
        logger.error(
            f"[TWILIO_VERIFY] Failed to check verification mobile={to_number} "
            f"code={getattr(e, 'code', None)} error={str(e)}"
        )
        raise HTTPException(status_code=502, detail="Failed to verify OTP")


async def verify_sms_code_or_raise(mobile_number: str, code: str) -> None:
    result = await check_sms_verification(mobile_number, code)
    if not result["valid"]:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
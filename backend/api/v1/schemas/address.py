from pydantic import BaseModel, Field, field_validator
import re


class ShippingAddress(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=8, max_length=20)
    postal_code: str = Field(..., min_length=8, max_length=9)
    street: str = Field(..., min_length=2, max_length=200)
    number: str = Field(..., min_length=1, max_length=20)
    complement: str | None = Field(None, max_length=80)
    neighborhood: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=2)

    @field_validator("postal_code")
    @classmethod
    def normalize_postal_code(cls, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if len(digits) != 8:
            raise ValueError("CEP deve ter 8 digitos")
        return f"{digits[:5]}-{digits[5:]}"

    @field_validator("state")
    @classmethod
    def normalize_state(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if len(cleaned) != 2 or not cleaned.isalpha():
            raise ValueError("UF invalida")
        return cleaned

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        cleaned = re.sub(r"\s+", " ", value.strip())
        digits = re.sub(r"\D", "", cleaned)
        if len(digits) < 10:
            raise ValueError("Telefone invalido")
        return cleaned

    def formatted(self) -> str:
        parts = [
            f"{self.street}, {self.number}",
            self.complement,
            self.neighborhood,
            f"{self.city} - {self.state}",
            f"CEP {self.postal_code}",
            f"Tel: {self.phone}",
        ]
        return ", ".join(p for p in parts if p)


def user_has_complete_shipping_address(user) -> bool:
    if not user:
        return False
    postal_digits = re.sub(r"\D", "", user.postal_code or "")
    state = (user.state or "").strip().upper()
    phone_digits = re.sub(r"\D", "", user.phone or "")
    recipient = (user.full_name or user.username or "").strip()
    return bool(
        recipient
        and len(phone_digits) >= 10
        and len(postal_digits) == 8
        and (user.street or "").strip()
        and (user.number or "").strip()
        and (user.neighborhood or "").strip()
        and (user.city or "").strip()
        and len(state) == 2
        and state.isalpha()
    )


def shipping_address_from_user(user) -> ShippingAddress:
    return ShippingAddress(
        recipient_name=(user.full_name or user.username or "").strip(),
        phone=(user.phone or "").strip(),
        postal_code=user.postal_code or "",
        street=(user.street or "").strip(),
        number=(user.number or "").strip(),
        complement=(user.complement or "").strip() or None,
        neighborhood=(user.neighborhood or "").strip(),
        city=(user.city or "").strip(),
        state=(user.state or "").strip().upper(),
    )


def apply_shipping_to_order(order, addr: ShippingAddress) -> None:
    order.shipping_recipient_name = addr.recipient_name
    order.shipping_phone = addr.phone
    order.shipping_postal_code = addr.postal_code
    order.shipping_street = addr.street
    order.shipping_number = addr.number
    order.shipping_complement = addr.complement
    order.shipping_neighborhood = addr.neighborhood
    order.shipping_city = addr.city
    order.shipping_state = addr.state
    order.shipping_address_formatted = addr.formatted()

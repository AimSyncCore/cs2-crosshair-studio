"""CS2 crosshair share-code encoding/decoding and console export."""

from __future__ import annotations

from dataclasses import dataclass, fields
from typing import Any

DICTIONARY = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789"
SHARECODE_PATTERN = r"^CSGO(-?[\w]{5}){5}$"


class InvalidShareCode(ValueError):
    """Raised when a share code string is malformed."""


class InvalidCrosshairShareCode(InvalidShareCode):
    """Raised when a crosshair share code fails checksum validation."""


@dataclass
class Crosshair:
    length: float = 2.5
    red: int = 50
    green: int = 250
    blue: int = 50
    gap: float = 0.0
    alpha_enabled: bool = True
    alpha: int = 200
    outline_enabled: bool = False
    outline: float = 1.0
    color: int = 1
    thickness: float = 0.5
    center_dot_enabled: bool = False
    split_distance: int = 3
    follow_recoil: bool = True
    fixed_crosshair_gap: float = 3.0
    inner_split_alpha: float = 0.0
    outer_split_alpha: float = 1.0
    split_size_ratio: float = 1.0
    t_style_enabled: bool = False
    deployed_weapon_gap_enabled: bool = False
    style: int = 4

    @classmethod
    def default(cls) -> Crosshair:
        return cls()

    def to_dict(self) -> dict[str, Any]:
        return {field.name: getattr(self, field.name) for field in fields(self)}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Crosshair:
        known = {field.name for field in fields(cls)}
        return cls(**{key: value for key, value in data.items() if key in known})


def _uint8_to_int8(value: int) -> int:
    if value >= 128:
        return value - 256
    return value


def _bytes_to_hex(data: bytes) -> str:
    return data.hex()


def _hex_to_bytes(hex_string: str) -> bytes:
    return bytes.fromhex(hex_string)


def _share_code_to_bytes(share_code: str) -> bytes:
    import re

    if not re.match(SHARECODE_PATTERN, share_code):
        raise InvalidShareCode("Invalid share code format")

    payload = share_code.replace("CSGO", "").replace("-", "")
    chars = list(reversed(payload))
    total = 0
    base = len(DICTIONARY)
    for char in chars:
        try:
            digit = DICTIONARY.index(char)
        except ValueError as exc:
            raise InvalidShareCode("Invalid character in share code") from exc
        total = total * base + digit

    hex_string = format(total, "036x")
    return _hex_to_bytes(hex_string)


def _bytes_to_share_code(data: bytes) -> str:
    total = int.from_bytes(data, byteorder="big")
    base = len(DICTIONARY)
    chars: list[str] = []
    for _ in range(25):
        total, remainder = divmod(total, base)
        chars.append(DICTIONARY[remainder])
    joined = "".join(chars)
    return (
        f"CSGO-{joined[0:5]}-{joined[5:10]}-{joined[10:15]}-"
        f"{joined[15:20]}-{joined[20:25]}"
    )


def decode_share_code(share_code: str) -> Crosshair:
    data = _share_code_to_bytes(share_code)
    checksum = sum(data[1:]) % 256
    if data[0] != checksum:
        raise InvalidCrosshairShareCode("Crosshair checksum mismatch")

    return Crosshair(
        gap=_uint8_to_int8(data[2]) / 10,
        outline=data[3] / 2,
        red=data[4],
        green=data[5],
        blue=data[6],
        alpha=data[7],
        split_distance=data[8] & 7,
        follow_recoil=((data[8] >> 4) & 8) == 8,
        fixed_crosshair_gap=_uint8_to_int8(data[9]) / 10,
        color=data[10] & 7,
        outline_enabled=(data[10] & 8) == 8,
        inner_split_alpha=(data[10] >> 4) / 10,
        outer_split_alpha=(data[11] & 0xF) / 10,
        split_size_ratio=(data[11] >> 4) / 10,
        thickness=data[12] / 10,
        center_dot_enabled=((data[13] >> 4) & 1) == 1,
        deployed_weapon_gap_enabled=((data[13] >> 4) & 2) == 2,
        alpha_enabled=((data[13] >> 4) & 4) == 4,
        t_style_enabled=((data[13] >> 4) & 8) == 8,
        style=(data[13] & 0xF) >> 1,
        length=data[14] / 10,
    )


def encode_share_code(crosshair: Crosshair) -> str:
    data = bytearray(
        [
            0,
            1,
            int(crosshair.gap * 10) & 0xFF,
            int(crosshair.outline * 2),
            crosshair.red,
            crosshair.green,
            crosshair.blue,
            crosshair.alpha,
            (crosshair.split_distance & 7) | (int(crosshair.follow_recoil) << 7),
            int(crosshair.fixed_crosshair_gap * 10) & 0xFF,
            (crosshair.color & 7)
            | (int(crosshair.outline_enabled) << 3)
            | (int(crosshair.inner_split_alpha * 10) << 4),
            int(crosshair.outer_split_alpha * 10)
            | (int(crosshair.split_size_ratio * 10) << 4),
            int(crosshair.thickness * 10),
            (crosshair.style << 1)
            | (int(crosshair.center_dot_enabled) << 4)
            | (int(crosshair.deployed_weapon_gap_enabled) << 5)
            | (int(crosshair.alpha_enabled) << 6)
            | (int(crosshair.t_style_enabled) << 7),
            int(crosshair.length * 10),
            0,
            0,
            0,
        ]
    )
    data[0] = sum(data) & 0xFF
    return _bytes_to_share_code(bytes(data))


def to_console_commands(crosshair: Crosshair, one_line: bool = False) -> str:
    commands = [
        f'cl_crosshair_drawoutline "{int(crosshair.outline_enabled)}"',
        f'cl_crosshair_dynamic_maxdist_splitratio "{crosshair.split_size_ratio}"',
        f'cl_crosshair_dynamic_splitalpha_innermod "{crosshair.inner_split_alpha}"',
        f'cl_crosshair_dynamic_splitalpha_outermod "{crosshair.outer_split_alpha}"',
        f'cl_crosshair_dynamic_splitdist "{crosshair.split_distance}"',
        f'cl_crosshair_outlinethickness "{crosshair.outline}"',
        f'cl_crosshair_t "{int(crosshair.t_style_enabled)}"',
        f'cl_crosshairalpha "{crosshair.alpha}"',
        f'cl_crosshaircolor "{crosshair.color}"',
        f'cl_crosshaircolor_b "{crosshair.blue}"',
        f'cl_crosshaircolor_g "{crosshair.green}"',
        f'cl_crosshaircolor_r "{crosshair.red}"',
        f'cl_crosshairdot "{int(crosshair.center_dot_enabled)}"',
        f'cl_crosshairgap "{crosshair.gap}"',
        f'cl_crosshairgap_useweaponvalue "{int(crosshair.deployed_weapon_gap_enabled)}"',
        f'cl_crosshairsize "{crosshair.length}"',
        f'cl_crosshairstyle "{crosshair.style}"',
        f'cl_crosshairthickness "{crosshair.thickness}"',
        f'cl_crosshairusealpha "{int(crosshair.alpha_enabled)}"',
        f'cl_fixedcrosshairgap "{crosshair.fixed_crosshair_gap}"',
        f'cl_crosshair_recoil "{int(crosshair.follow_recoil)}"',
    ]
    separator = "; " if one_line else "\n"
    return separator.join(commands)


def apply_crosshair_code_command(share_code: str) -> str:
    return f"apply_crosshair_code {share_code}"

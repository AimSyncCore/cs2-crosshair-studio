"""Tests for CS2 crosshair share-code logic."""

import pytest

from src.crosshair import (
    Crosshair,
    InvalidShareCode,
    decode_share_code,
    encode_share_code,
    to_console_commands,
)


KNOWN_CODE = "CSGO-WsnnD-eHaMw-QNDf9-oxuDh-ydOUD"


def test_round_trip_known_share_code():
    decoded = decode_share_code(KNOWN_CODE)
    assert decoded.gap == pytest.approx(-2.2)
    assert decoded.length == pytest.approx(10.0)
    assert decoded.style == 2
    assert decoded.red == 50
    assert decoded.green == 250
    assert decoded.blue == 50
    assert decoded.alpha == 200
    assert decoded.thickness == pytest.approx(0.6)
    assert decoded.outline_enabled is True
    assert decoded.center_dot_enabled is False
    assert decoded.deployed_weapon_gap_enabled is True

    encoded = encode_share_code(decoded)
    assert encoded == KNOWN_CODE


def test_default_crosshair_encodes_valid_code():
    crosshair = Crosshair.default()
    code = encode_share_code(crosshair)
    assert code.startswith("CSGO-")
    round_trip = decode_share_code(code)
    assert round_trip.length == crosshair.length
    assert round_trip.gap == crosshair.gap
    assert round_trip.style == crosshair.style


def test_invalid_share_code_format_raises():
    with pytest.raises(InvalidShareCode):
        decode_share_code("not-a-share-code")


def test_console_commands_include_key_cvars():
    crosshair = Crosshair(length=3, gap=-2, style=4, center_dot_enabled=True)
    output = to_console_commands(crosshair)
    assert 'cl_crosshairsize "3"' in output
    assert 'cl_crosshairgap "-2"' in output
    assert 'cl_crosshairstyle "4"' in output
    assert 'cl_crosshairdot "1"' in output


def test_one_line_console_commands():
    crosshair = Crosshair.default()
    output = to_console_commands(crosshair, one_line=True)
    assert ";" in output
    assert "\n" not in output

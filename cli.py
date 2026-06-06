#!/usr/bin/env python3
"""CLI helper for CS2 crosshair share codes and console export."""

from __future__ import annotations

import argparse
import json
import sys

from src.crosshair import (
    Crosshair,
    apply_crosshair_code_command,
    decode_share_code,
    encode_share_code,
    to_console_commands,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="CS2 crosshair share-code utility")
    subparsers = parser.add_subparsers(dest="command", required=True)

    decode_parser = subparsers.add_parser("decode", help="Decode a share code")
    decode_parser.add_argument("share_code")

    encode_parser = subparsers.add_parser("encode", help="Encode settings from JSON")
    encode_parser.add_argument("settings_json")

    console_parser = subparsers.add_parser("console", help="Print console commands")
    console_parser.add_argument("share_code")
    console_parser.add_argument("--one-line", action="store_true")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "decode":
        crosshair = decode_share_code(args.share_code)
        print(json.dumps(crosshair.to_dict(), indent=2))
        return 0

    if args.command == "encode":
        data = json.loads(args.settings_json)
        crosshair = Crosshair.from_dict(data)
        share_code = encode_share_code(crosshair)
        print(share_code)
        print(apply_crosshair_code_command(share_code))
        return 0

    if args.command == "console":
        crosshair = decode_share_code(args.share_code)
        print(to_console_commands(crosshair, one_line=args.one_line))
        return 0

    parser.error("Unknown command")
    return 1


if __name__ == "__main__":
    sys.exit(main())

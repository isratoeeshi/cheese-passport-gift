"""Generate a color-matched, high-resolution QR code linking to the live Cheese Map.

Usage:
    python generate_qr.py <url> [output_path]

Colors match the birthday card palette:
    - Fill (dark modules): warm brown  #5C4033
    - Background: beige/cream         #F5F0E1

Requires: qrcode[pil]
"""

import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H

BROWN = "#5C4033"
BEIGE = "#F5F0E1"

DEFAULT_URL = "https://isratoeeshi.github.io/cheese-passport-gift/"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "map" / "qr-code.png"


def generate_qr(url: str, output_path: Path) -> Path:
    qr = qrcode.QRCode(
        version=None,  # auto-size to fit the data
        error_correction=ERROR_CORRECT_H,  # high error correction — survives print wear/folds
        box_size=20,  # large box_size for a crisp, high-resolution PNG
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color=BROWN, back_color=BEIGE)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    return output_path


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT

    saved_path = generate_qr(url, output_path)
    print(f"QR code for {url!r} saved to {saved_path}")

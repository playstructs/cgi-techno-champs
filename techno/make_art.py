"""Draws the Techno Champs badge, logo and icons (needs Pillow).

They are set in structs-webapp's own pixel typeface, with an equalizer for a
mark:

    python3 techno/make_art.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
FONT = HERE.parent / 'structs-webapp/src/public/fonts/sui/ExtremeHazard.ttf'
OUT = HERE / 'public/techno/img'
BACKGROUND = (13, 17, 23, 255)
WHITE = (255, 255, 255, 255)
BARS = [2, 4, 3, 6, 4, 5, 2]  # heights, in cells


def equalizer(draw, cx, bottom, cell, gap, heights=BARS):
    """Bars of square cells, centred on cx."""
    step = cell + gap
    width = len(heights) * step - gap
    for i, height in enumerate(heights):
        x = cx - width // 2 + i * step
        for row in range(height):
            y = bottom - cell - row * step
            draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill=WHITE)


def inked(word, font):
    image = Image.new('L', (len(word) * font.size * 2, font.size * 2))
    ImageDraw.Draw(image).text((0, 0), word, font=font, fill=255)
    return image.getbbox()


def wordmark(draw, cx, top, size, leading):
    font = ImageFont.truetype(str(FONT), size)
    for i, word in enumerate(('TECHNO', 'CHAMPS')):
        # The inked box: the font's own advance leaves room after the last letter.
        left, upper, right, _ = inked(word, font)
        draw.text((cx - (left + right) // 2, top + i * leading - upper), word, font=font, fill=WHITE)


# The sign-up badge: the top of webapp's 192px logo slot, twice the size; the
# motto goes under it.
badge = Image.new('RGBA', (384, 384), (0, 0, 0, 0))
draw = ImageDraw.Draw(badge)
equalizer(draw, 192, 158, 18, 6)
wordmark(draw, 192, 188, 48, 66)
badge.save(OUT / 'techno-champs-badge.png')

# The guild's logo, for guild.json.
logo = Image.new('RGBA', (512, 512), BACKGROUND)
draw = ImageDraw.Draw(logo)
equalizer(draw, 256, 266, 24, 8)
wordmark(draw, 256, 302, 56, 78)
logo.save(OUT / 'techno-champs-logo.png')


def icon(size, cell, gap, heights):
    image = Image.new('RGBA', (size, size), BACKGROUND)
    step = cell + gap
    equalizer(ImageDraw.Draw(image), size // 2, (size + max(heights) * step - gap) // 2, cell, gap, heights)
    return image


# The icons: the equalizer alone, since lettering does not read at 16-48px.
icon(180, 18, 6, [2, 4, 3, 6, 3]).save(OUT / 'apple-touch-icon.png')
small = icon(32, 4, 1, [2, 4, 3, 5, 2])
small.save(OUT / 'favicon-32x32.png')
icon(48, 6, 2, [2, 4, 3, 5, 2]).save(HERE / 'public/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])

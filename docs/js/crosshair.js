const DICTIONARY = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789";
const SHARECODE_PATTERN = /^CSGO(-?[\w]{5}){5}$/;

export class InvalidShareCode extends Error {
  constructor(message = "Invalid share code") {
    super(message);
    this.name = "InvalidShareCode";
  }
}

export class InvalidCrosshairShareCode extends InvalidShareCode {
  constructor(message = "Invalid crosshair share code") {
    super(message);
    this.name = "InvalidCrosshairShareCode";
  }
}

export function defaultCrosshair() {
  return {
    length: 2.5,
    red: 50,
    green: 250,
    blue: 50,
    gap: 0,
    alphaEnabled: true,
    alpha: 200,
    outlineEnabled: false,
    outline: 1,
    color: 1,
    thickness: 0.5,
    centerDotEnabled: false,
    splitDistance: 3,
    followRecoil: true,
    fixedCrosshairGap: 3,
    innerSplitAlpha: 0,
    outerSplitAlpha: 1,
    splitSizeRatio: 1,
    tStyleEnabled: false,
    deployedWeaponGapEnabled: false,
    style: 4,
  };
}

function bytesToHex(bytes) {
  return bytes.map((byte) => ("0" + (byte & 0xff).toString(16)).slice(-2)).join("");
}

function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i += 2) {
    bytes.push(parseInt(str.slice(i, i + 2), 16));
  }
  return bytes;
}

function uint8ToInt8(number) {
  return (number << 24) >> 24;
}

function sumArray(array) {
  return array.reduce((total, value) => total + value, 0);
}

function shareCodeToBytes(shareCode) {
  if (!SHARECODE_PATTERN.test(shareCode)) {
    throw new InvalidShareCode();
  }

  const payload = shareCode.replace(/CSGO|-/g, "");
  const chars = Array.from(payload).reverse();
  let total = 0n;
  for (const char of chars) {
    const index = DICTIONARY.indexOf(char);
    if (index === -1) {
      throw new InvalidShareCode();
    }
    total = total * BigInt(DICTIONARY.length) + BigInt(index);
  }

  const hex = total.toString(16).padStart(36, "0");
  return stringToBytes(hex);
}

function bytesToShareCode(bytes) {
  const hex = bytesToHex(bytes);
  let total = BigInt(`0x${hex}`);
  let chars = "";
  for (let i = 0; i < 25; i += 1) {
    const rem = total % BigInt(DICTIONARY.length);
    chars += DICTIONARY[Number(rem)];
    total = total / BigInt(DICTIONARY.length);
  }

  return `CSGO-${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10, 15)}-${chars.slice(
    15,
    20
  )}-${chars.slice(20, 25)}`;
}

export function decodeShareCode(shareCode) {
  const bytes = shareCodeToBytes(shareCode);
  const size = sumArray(bytes.slice(1)) % 256;
  if (bytes[0] !== size) {
    throw new InvalidCrosshairShareCode();
  }

  return {
    gap: uint8ToInt8(bytes[2]) / 10,
    outline: bytes[3] / 2,
    red: bytes[4],
    green: bytes[5],
    blue: bytes[6],
    alpha: bytes[7],
    splitDistance: bytes[8] & 7,
    followRecoil: ((bytes[8] >> 4) & 8) === 8,
    fixedCrosshairGap: uint8ToInt8(bytes[9]) / 10,
    color: bytes[10] & 7,
    outlineEnabled: (bytes[10] & 8) === 8,
    innerSplitAlpha: (bytes[10] >> 4) / 10,
    outerSplitAlpha: (bytes[11] & 0xf) / 10,
    splitSizeRatio: (bytes[11] >> 4) / 10,
    thickness: bytes[12] / 10,
    centerDotEnabled: ((bytes[13] >> 4) & 1) === 1,
    deployedWeaponGapEnabled: ((bytes[13] >> 4) & 2) === 2,
    alphaEnabled: ((bytes[13] >> 4) & 4) === 4,
    tStyleEnabled: ((bytes[13] >> 4) & 8) === 8,
    style: (bytes[13] & 0xf) >> 1,
    length: bytes[14] / 10,
  };
}

export function encodeShareCode(crosshair) {
  const bytes = [
    0,
    1,
    (crosshair.gap * 10) & 0xff,
    crosshair.outline * 2,
    crosshair.red,
    crosshair.green,
    crosshair.blue,
    crosshair.alpha,
    (crosshair.splitDistance & 7) | (Number(crosshair.followRecoil) << 7),
    (crosshair.fixedCrosshairGap * 10) & 0xff,
    (crosshair.color & 7) |
      (Number(crosshair.outlineEnabled) << 3) |
      (crosshair.innerSplitAlpha * 10 << 4),
    (crosshair.outerSplitAlpha * 10) | (crosshair.splitSizeRatio * 10 << 4),
    crosshair.thickness * 10,
    (crosshair.style << 1) |
      (Number(crosshair.centerDotEnabled) << 4) |
      (Number(crosshair.deployedWeaponGapEnabled) << 5) |
      (Number(crosshair.alphaEnabled) << 6) |
      (Number(crosshair.tStyleEnabled) << 7),
    crosshair.length * 10,
    0,
    0,
    0,
  ];

  bytes[0] = sumArray(bytes) & 0xff;
  return bytesToShareCode(bytes);
}

export function toConsoleCommands(crosshair, oneLine = false) {
  const commands = [
    `cl_crosshair_drawoutline "${Number(crosshair.outlineEnabled)}"`,
    `cl_crosshair_dynamic_maxdist_splitratio "${crosshair.splitSizeRatio}"`,
    `cl_crosshair_dynamic_splitalpha_innermod "${crosshair.innerSplitAlpha}"`,
    `cl_crosshair_dynamic_splitalpha_outermod "${crosshair.outerSplitAlpha}"`,
    `cl_crosshair_dynamic_splitdist "${crosshair.splitDistance}"`,
    `cl_crosshair_outlinethickness "${crosshair.outline}"`,
    `cl_crosshair_t "${Number(crosshair.tStyleEnabled)}"`,
    `cl_crosshairalpha "${crosshair.alpha}"`,
    `cl_crosshaircolor "${crosshair.color}"`,
    `cl_crosshaircolor_b "${crosshair.blue}"`,
    `cl_crosshaircolor_g "${crosshair.green}"`,
    `cl_crosshaircolor_r "${crosshair.red}"`,
    `cl_crosshairdot "${Number(crosshair.centerDotEnabled)}"`,
    `cl_crosshairgap "${crosshair.gap}"`,
    `cl_crosshairgap_useweaponvalue "${Number(crosshair.deployedWeaponGapEnabled)}"`,
    `cl_crosshairsize "${crosshair.length}"`,
    `cl_crosshairstyle "${crosshair.style}"`,
    `cl_crosshairthickness "${crosshair.thickness}"`,
    `cl_crosshairusealpha "${Number(crosshair.alphaEnabled)}"`,
    `cl_fixedcrosshairgap "${crosshair.fixedCrosshairGap}"`,
    `cl_crosshair_recoil "${Number(crosshair.followRecoil)}"`,
  ];

  return oneLine ? commands.join("; ") : commands.join("\n");
}

export function applyCrosshairCodeCommand(shareCode) {
  return `apply_crosshair_code ${shareCode}`;
}

export const MAP_BACKGROUNDS = [
  { id: "dust2", label: "Dust II", src: "assets/maps/dust2.jpg" },
  { id: "mirage", label: "Mirage", src: "assets/maps/mirage.jpg" },
  { id: "inferno", label: "Inferno", src: "assets/maps/inferno.jpg" },
  { id: "nuke", label: "Nuke", src: "assets/maps/nuke.jpg" },
];

function drawCoverImage(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawFallbackBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#24313d");
  gradient.addColorStop(1, "#121820");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function resolveCrosshairColor(crosshair) {
  const presets = {
    0: { r: 255, g: 0, b: 0 },
    1: { r: 0, g: 255, b: 0 },
    2: { r: 255, g: 255, b: 0 },
    3: { r: 0, g: 0, b: 255 },
    4: { r: crosshair.red, g: crosshair.green, b: crosshair.blue },
    5: { r: crosshair.red, g: crosshair.green, b: crosshair.blue },
  };

  return presets[crosshair.color] ?? presets[4];
}

function computeCrosshairMetrics(crosshair) {
  const length = Number(crosshair.length) || 0;
  const thickness = Number(crosshair.thickness) || 0.5;
  const gap = Number(crosshair.gap) || 0;

  const baseLength = Math.floor(length * 2);
  const crosshairLength = length > 2 ? baseLength + 1 : baseLength;
  const crosshairWidth = Math.max(1, Math.floor(thickness * 2));
  const crosshairGap = Math.ceil(gap + 4);
  const outlineThickness =
    crosshair.outlineEnabled && Number(crosshair.outline) > 0
      ? Math.max(1, Math.round(Number(crosshair.outline)))
      : 0;

  return { crosshairLength, crosshairWidth, crosshairGap, outlineThickness };
}

export function drawCrosshairAt(ctx, crosshair, cx, cy) {
  const style = Number(crosshair.style);
  if (style !== 2 && style !== 4) {
    return;
  }

  const color = resolveCrosshairColor(crosshair);
  const alpha = crosshair.alphaEnabled ? crosshair.alpha / 255 : 1;
  const { crosshairLength, crosshairWidth, crosshairGap, outlineThickness } =
    computeCrosshairMetrics(crosshair);
  const fillColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  const outlineColor = `rgba(0, 0, 0, ${alpha})`;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const pixelOffset = (crosshairWidth % 2) / 2;
  ctx.translate(cx + pixelOffset, cy + pixelOffset);

  const center = { x: 0, y: 0 };

  const drawRect = (x, y, width, height, styleFill) => {
    ctx.fillStyle = styleFill;
    ctx.fillRect(x, y, width, height);
  };

  const drawArms = (fillStyle, outlineSize = 0) => {
    const outline = outlineSize;

    drawRect(
      center.x + crosshairWidth / 2 + crosshairGap - outline,
      center.y - crosshairWidth / 2 - outline,
      crosshairLength + outline * 2,
      crosshairWidth + outline * 2,
      fillStyle
    );
    drawRect(
      center.x - (crosshairLength + crosshairWidth / 2 + crosshairGap) - outline,
      center.y - crosshairWidth / 2 - outline,
      crosshairLength + outline * 2,
      crosshairWidth + outline * 2,
      fillStyle
    );
    drawRect(
      center.x - crosshairWidth / 2 - outline,
      center.y + crosshairWidth / 2 + crosshairGap - outline,
      crosshairWidth + outline * 2,
      crosshairLength + outline * 2,
      fillStyle
    );

    if (!crosshair.tStyleEnabled) {
      drawRect(
        center.x - crosshairWidth / 2 - outline,
        center.y - (crosshairLength + crosshairWidth / 2 + crosshairGap) - outline,
        crosshairWidth + outline * 2,
        crosshairLength + outline * 2,
        fillStyle
      );
    }
  };

  if (outlineThickness > 0) {
    drawArms(outlineColor, outlineThickness);
  }

  drawArms(fillColor);

  if (crosshair.centerDotEnabled) {
    if (outlineThickness > 0) {
      drawRect(
        center.x - crosshairWidth / 2 - outlineThickness,
        center.y - crosshairWidth / 2 - outlineThickness,
        crosshairWidth + outlineThickness * 2,
        crosshairWidth + outlineThickness * 2,
        outlineColor
      );
    }
    drawRect(
      center.x - crosshairWidth / 2,
      center.y - crosshairWidth / 2,
      crosshairWidth,
      crosshairWidth,
      fillColor
    );
  }

  ctx.restore();
}

export function drawPreview(ctx, width, height, crosshair, options = {}) {
  const { backgroundImage = null, offsetX = 0, offsetY = 0 } = options;

  ctx.clearRect(0, 0, width, height);

  if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
    drawCoverImage(ctx, backgroundImage, width, height);
  } else {
    drawFallbackBackground(ctx, width, height);
  }

  drawCrosshairAt(ctx, crosshair, width / 2 + offsetX, height / 2 + offsetY);
}

export function drawCrosshair(ctx, width, height, crosshair) {
  drawPreview(ctx, width, height, crosshair);
}

export const PRESETS = [
  {
    id: "classic-static",
    label: "Classic Static",
    crosshair: {
      style: 4,
      length: 2.5,
      gap: -1,
      thickness: 0.5,
      color: 1,
      alpha: 255,
      outlineEnabled: true,
      outline: 1,
    },
  },
  {
    id: "small-dot",
    label: "Small + Dot",
    crosshair: {
      style: 4,
      length: 1,
      gap: -3,
      thickness: 0.5,
      centerDotEnabled: true,
      color: 5,
      red: 255,
      green: 255,
      blue: 255,
      alpha: 255,
      outlineEnabled: false,
    },
  },
  {
    id: "pro-minimal",
    label: "Pro Minimal",
    crosshair: {
      style: 4,
      length: 1.5,
      gap: -2,
      thickness: 0.5,
      color: 3,
      alpha: 255,
      outlineEnabled: true,
      outline: 1,
    },
  },
];

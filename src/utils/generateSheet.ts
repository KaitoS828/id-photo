/**
 * 証明写真台紙生成ユーティリティ
 * Ki-Re-i 風の切り取りガイド付き台紙を Canvas API で生成
 */

import { PHOTO_SIZE_PRESETS } from '@/types';

/** 台紙設定（L判サイズ: 89mm × 127mm、300dpi相当） */
const SHEET_CONFIG = {
  /** L判の幅 px (89mm @ 300dpi) */
  width: 1051,
  /** L判の高さ px (127mm @ 300dpi) */
  height: 1500,
  /** 背景色 */
  bgColor: '#FFFFFF',
  /** ガイド線の色 */
  guideColor: '#4A90D9',
  /** ガイド線の幅 */
  guideWidth: 1,
  /** ガイドダッシュパターン */
  guideDash: [6, 4] as number[],
  /** 余白（px） */
  padding: 40,
  /** 写真間のギャップ（px） */
  gap: 16,
  /** ラベルフォントサイズ */
  labelFontSize: 14,
  /** ラベル色 */
  labelColor: '#666666',
} as const;

/**
 * mm をピクセルに変換（300dpi 基準）
 */
function mmToPx(mm: number): number {
  return Math.round(mm * (300 / 25.4));
}

/**
 * 証明写真を台紙に配置した画像を生成
 *
 * @param imageDataUrl - 変換後の証明写真の Data URL
 * @param sizePresetId - サイズプリセットID
 * @returns 台紙画像の Data URL (PNG)
 */
export async function generatePhotoSheet(
  imageDataUrl: string,
  sizePresetId: string
): Promise<string> {
  const preset = PHOTO_SIZE_PRESETS.find((s) => s.id === sizePresetId);
  if (!preset) {
    throw new Error(`不明なサイズプリセット: ${sizePresetId}`);
  }

  // Canvas 作成
  const canvas = document.createElement('canvas');
  canvas.width = SHEET_CONFIG.width;
  canvas.height = SHEET_CONFIG.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D コンテキストを取得できません');
  }

  // 背景塗りつぶし
  ctx.fillStyle = SHEET_CONFIG.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 写真をロード
  const img = await loadImage(imageDataUrl);

  // 写真のピクセルサイズ
  const photoW = mmToPx(preset.width);
  const photoH = mmToPx(preset.height);

  // 利用可能領域
  const usableW = canvas.width - SHEET_CONFIG.padding * 2;
  const usableH = canvas.height - SHEET_CONFIG.padding * 2 - 60; // ラベル用の余裕

  // 何枚配置できるか計算
  const cols = Math.min(3, Math.floor((usableW + SHEET_CONFIG.gap) / (photoW + SHEET_CONFIG.gap)));
  const rows = Math.min(3, Math.floor((usableH + SHEET_CONFIG.gap) / (photoH + SHEET_CONFIG.gap)));

  // 実際の配置幅・高さ
  const totalPhotosW = cols * photoW + (cols - 1) * SHEET_CONFIG.gap;
  const totalPhotosH = rows * photoH + (rows - 1) * SHEET_CONFIG.gap;

  // 中央配置のオフセット
  const offsetX = Math.round((canvas.width - totalPhotosW) / 2);
  const offsetY = Math.round((canvas.height - totalPhotosH - 40) / 2);

  // 写真を配置
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * (photoW + SHEET_CONFIG.gap);
      const y = offsetY + row * (photoH + SHEET_CONFIG.gap);

      // 写真を描画
      ctx.drawImage(img, x, y, photoW, photoH);

      // 切り取りガイド線
      drawCutGuide(ctx, x, y, photoW, photoH);
    }
  }

  // サイズラベル
  ctx.fillStyle = SHEET_CONFIG.labelColor;
  ctx.font = `${SHEET_CONFIG.labelFontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `${preset.label}  ${preset.width}mm × ${preset.height}mm（${cols}×${rows}枚）`,
    canvas.width / 2,
    canvas.height - SHEET_CONFIG.padding + 10
  );

  ctx.fillStyle = '#999999';
  ctx.font = `${SHEET_CONFIG.labelFontSize - 2}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(
    '点線に沿って切り取ってください',
    canvas.width / 2,
    canvas.height - SHEET_CONFIG.padding + 30
  );

  return canvas.toDataURL('image/png');
}

/**
 * 切り取りガイド線を描画
 */
function drawCutGuide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const ext = 12; // ガイド線の延長

  ctx.save();
  ctx.strokeStyle = SHEET_CONFIG.guideColor;
  ctx.lineWidth = SHEET_CONFIG.guideWidth;
  ctx.setLineDash(SHEET_CONFIG.guideDash);

  // 四隅にL字型ガイド
  const corners = [
    // 左上
    { lines: [[x - ext, y, x + ext, y], [x, y - ext, x, y + ext]] },
    // 右上
    { lines: [[x + w - ext, y, x + w + ext, y], [x + w, y - ext, x + w, y + ext]] },
    // 左下
    { lines: [[x - ext, y + h, x + ext, y + h], [x, y + h - ext, x, y + h + ext]] },
    // 右下
    { lines: [[x + w - ext, y + h, x + w + ext, y + h], [x + w, y + h - ext, x + w, y + h + ext]] },
  ];

  for (const corner of corners) {
    for (const [x1, y1, x2, y2] of corner.lines) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 画像を非同期でロード
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

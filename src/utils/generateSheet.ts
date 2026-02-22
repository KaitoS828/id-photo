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
  /** グリッド線の色（Ki-Re-i 風の薄い青） */
  gridColor: 'rgba(100, 160, 220, 0.35)',
  /** グリッド線の間隔（px, 約5mm@300dpi） */
  gridStep: 59,
  /** 切り取りガイド線の色 */
  guideColor: '#4A90D9',
  /** ガイド線の幅 */
  guideWidth: 1.5,
  /** ガイドダッシュパターン */
  guideDash: [8, 5] as number[],
  /** 余白（px） */
  padding: 40,
  /** 写真間のギャップ（px） */
  gap: 16,
  /** サイズ注釈フォントサイズ */
  annotationFontSize: 20,
  /** 注釈の色 */
  annotationColor: '#4A90D9',
  /** ラベルフォントサイズ */
  labelFontSize: 18,
  /** ラベル色 */
  labelColor: '#666666',
  /** 矢印の長さ（注釈線からの延長） */
  arrowSize: 6,
} as const;

/**
 * mm をピクセルに変換（300dpi 基準）
 */
function mmToPx(mm: number): number {
  return Math.round(mm * (300 / 25.4));
}

/**
 * px を cm に変換（300dpi 基準）
 */
function pxToCm(px: number): string {
  const cm = px / (300 / 25.4) / 10;
  return cm.toFixed(1);
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
  sizePresetId: string,
  brightness: number = 100,
  contrast: number = 100,
  isPremium: boolean = false
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

  // Ki-Re-i風 背景グリッド描画
  drawBackgroundGrid(ctx, canvas.width, canvas.height);

  // 写真をロード
  const img = await loadImage(imageDataUrl);

  // 写真のピクセルサイズ
  const photoW = mmToPx(preset.width);
  const photoH = mmToPx(preset.height);

  // 利用可能領域
  const usableW = canvas.width - SHEET_CONFIG.padding * 2;
  const usableH = canvas.height - SHEET_CONFIG.padding * 2 - 80; // ラベル用の余裕

  // 何枚配置できるか計算
  const cols = Math.min(3, Math.floor((usableW + SHEET_CONFIG.gap) / (photoW + SHEET_CONFIG.gap)));
  const rows = Math.min(3, Math.floor((usableH + SHEET_CONFIG.gap) / (photoH + SHEET_CONFIG.gap)));

  // 実際の配置幅・高さ
  const totalPhotosW = cols * photoW + (cols - 1) * SHEET_CONFIG.gap;
  const totalPhotosH = rows * photoH + (rows - 1) * SHEET_CONFIG.gap;

  // 中央配置のオフセット
  const offsetX = Math.round((canvas.width - totalPhotosW) / 2);
  const offsetY = Math.round((canvas.height - totalPhotosH - 60) / 2);

  // 写真を配置
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * (photoW + SHEET_CONFIG.gap);
      const y = offsetY + row * (photoH + SHEET_CONFIG.gap);

      // 画像に色調補正を適用して描画
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, x, y, photoW, photoH);
      ctx.filter = 'none'; // reset

      // 切り取りガイド線（各写真の周囲）
      drawCutGuide(ctx, x, y, photoW, photoH);
    }
  }

  // サイズ寸法表示（左端の列と上端の行に矢印付き）
  // 横幅の寸法（最初の写真の上に表示）
  const firstX = offsetX;
  const firstY = offsetY;
  drawHorizontalDimension(ctx, firstX, firstX + photoW, firstY - 20, pxToCm(photoW));

  // 縦幅の寸法（最初の写真の左に表示）
  drawVerticalDimension(ctx, firstY, firstY + photoH, firstX - 20, pxToCm(photoH));

  // サイズラベル（下部）
  ctx.fillStyle = SHEET_CONFIG.labelColor;
  ctx.font = `${SHEET_CONFIG.labelFontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `${preset.label}  ${preset.width}mm × ${preset.height}mm（${cols}×${rows}枚）`,
    canvas.width / 2,
    canvas.height - SHEET_CONFIG.padding + 5
  );

  ctx.fillStyle = '#999999';
  ctx.font = `${SHEET_CONFIG.labelFontSize - 4}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(
    '点線に沿って切り取ってください — ID Photo Studio',
    canvas.width / 2,
    canvas.height - SHEET_CONFIG.padding + 30
  );

  // 無料版（非プレミアム）の場合は全面に透かしを描画
  if (!isPremium) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-35 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // text-red-500
    ctx.font = '900 120px "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 画面全体をカバーするように繰り返し描画
    ctx.fillText('PREVIEW SAMPLE', 0, -450);
    ctx.fillText('PREVIEW SAMPLE', 0, -150);
    ctx.fillText('PREVIEW SAMPLE', 0, 150);
    ctx.fillText('PREVIEW SAMPLE', 0, 450);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Ki-Re-i風 背景グリッドを描画
 */
function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.strokeStyle = SHEET_CONFIG.gridColor;
  ctx.lineWidth = 0.5;

  // 縦線
  for (let x = 0; x <= width; x += SHEET_CONFIG.gridStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 横線
  for (let y = 0; y <= height; y += SHEET_CONFIG.gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 切り取りガイド線を描画（写真の周囲全体を破線で囲む）
 */
function drawCutGuide(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const ext = 14; // ガイド線の外側への延長

  ctx.save();
  ctx.strokeStyle = SHEET_CONFIG.guideColor;
  ctx.lineWidth = SHEET_CONFIG.guideWidth;
  ctx.setLineDash(SHEET_CONFIG.guideDash);

  // 写真の周囲を破線で囲む（少し外側）
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);

  // 四隅にL字型の延長ガイド（実線）
  ctx.setLineDash([]);
  ctx.lineWidth = 1;

  const corners = [
    // 左上
    { lines: [[x - ext, y, x, y], [x, y - ext, x, y]] },
    // 右上
    { lines: [[x + w, y, x + w + ext, y], [x + w, y - ext, x + w, y]] },
    // 左下
    { lines: [[x - ext, y + h, x, y + h], [x, y + h, x, y + h + ext]] },
    // 右下
    { lines: [[x + w, y + h, x + w + ext, y + h], [x + w, y + h, x + w, y + h + ext]] },
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
 * 横方向のサイズ寸法表示（矢印付き）
 */
function drawHorizontalDimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  label: string
): void {
  ctx.save();
  ctx.strokeStyle = SHEET_CONFIG.annotationColor;
  ctx.fillStyle = SHEET_CONFIG.annotationColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.font = `${SHEET_CONFIG.annotationFontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // 水平線
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  // 左矢印
  drawArrowHead(ctx, x1, y, 'left');
  // 右矢印
  drawArrowHead(ctx, x2, y, 'right');

  // 垂直端線
  ctx.beginPath();
  ctx.moveTo(x1, y - 8);
  ctx.lineTo(x1, y + 8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y - 8);
  ctx.lineTo(x2, y + 8);
  ctx.stroke();

  // テキスト
  ctx.fillText(`${label}cm`, (x1 + x2) / 2, y - 6);

  ctx.restore();
}

/**
 * 縦方向のサイズ寸法表示（矢印付き）
 */
function drawVerticalDimension(
  ctx: CanvasRenderingContext2D,
  y1: number,
  y2: number,
  x: number,
  label: string
): void {
  ctx.save();
  ctx.strokeStyle = SHEET_CONFIG.annotationColor;
  ctx.fillStyle = SHEET_CONFIG.annotationColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  // 垂直線
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();

  // 上矢印
  drawArrowHead(ctx, x, y1, 'up');
  // 下矢印
  drawArrowHead(ctx, x, y2, 'down');

  // 水平端線
  ctx.beginPath();
  ctx.moveTo(x - 8, y1);
  ctx.lineTo(x + 8, y1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8, y2);
  ctx.lineTo(x + 8, y2);
  ctx.stroke();

  // テキスト（縦書き風に回転）
  ctx.font = `${SHEET_CONFIG.annotationFontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(x - 14, (y1 + y2) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${label}cm`, 0, 0);

  ctx.restore();
}

/**
 * 矢印の先端を描画
 */
function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'left' | 'right' | 'up' | 'down'
): void {
  const s = SHEET_CONFIG.arrowSize;
  ctx.beginPath();
  switch (direction) {
    case 'left':
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y - s / 2);
      ctx.lineTo(x + s, y + s / 2);
      break;
    case 'right':
      ctx.moveTo(x, y);
      ctx.lineTo(x - s, y - s / 2);
      ctx.lineTo(x - s, y + s / 2);
      break;
    case 'up':
      ctx.moveTo(x, y);
      ctx.lineTo(x - s / 2, y + s);
      ctx.lineTo(x + s / 2, y + s);
      break;
    case 'down':
      ctx.moveTo(x, y);
      ctx.lineTo(x - s / 2, y - s);
      ctx.lineTo(x + s / 2, y - s);
      break;
  }
  ctx.closePath();
  ctx.fill();
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

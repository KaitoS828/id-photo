export default function WatermarkOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="text-[var(--text-primary)] opacity-30 font-black tracking-widest uppercase transform -rotate-45 select-none"
        style={{ fontSize: '10vw', whiteSpace: 'nowrap' }}
      >
        WATERMARK WATERMARK WATERMARK WATERMARK
      </div>
      <div
        className="absolute text-[var(--text-primary)] opacity-30 font-black tracking-widest uppercase transform -rotate-45 select-none"
        style={{ fontSize: '10vw', whiteSpace: 'nowrap', top: '-50%' }}
      >
        WATERMARK WATERMARK WATERMARK WATERMARK
      </div>
      <div
        className="absolute text-[var(--text-primary)] opacity-30 font-black tracking-widest uppercase transform -rotate-45 select-none"
        style={{ fontSize: '10vw', whiteSpace: 'nowrap', top: '50%' }}
      >
        WATERMARK WATERMARK WATERMARK WATERMARK
      </div>
      <div
        className="absolute text-[var(--text-primary)] opacity-30 font-black tracking-widest uppercase transform -rotate-45 select-none"
        style={{ fontSize: '10vw', whiteSpace: 'nowrap', left: '-50%' }}
      >
        WATERMARK WATERMARK WATERMARK WATERMARK
      </div>
      <div
        className="absolute text-[var(--text-primary)] opacity-30 font-black tracking-widest uppercase transform -rotate-45 select-none"
        style={{ fontSize: '10vw', whiteSpace: 'nowrap', left: '50%' }}
      >
        WATERMARK WATERMARK WATERMARK WATERMARK
      </div>
    </div>
  )
}

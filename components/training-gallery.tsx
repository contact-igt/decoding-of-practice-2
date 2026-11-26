import Image from 'next/image';

export function TrainingGallery({ rows }: { rows: ReadonlyArray<ReadonlyArray<{ src: string; alt: string }>> }) {
  if (!rows.length) return null;

  return <section className="section training-gallery" aria-labelledby="training-gallery-title">
    <div className="shell training-gallery-heading">
      <p className="eyebrow"><span />The VLS classroom</p>
      <h2 id="training-gallery-title">Glimpses of <em>Training at VLS</em></h2>
    </div>
    <div className="training-gallery-rows">
      {rows.map((row) => <div className="training-gallery-track" key={row[0].src}>
        {[false, true].map((duplicate) => <div className="training-gallery-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
          {row.map(({ src, alt }) => <Image key={src} src={src} alt={duplicate ? '' : alt} width={640} height={480}
            sizes="(max-width: 575px) 70vw, (max-width: 991px) 50vw, 33vw" />)}
        </div>)}
      </div>)}
    </div>
  </section>;
}

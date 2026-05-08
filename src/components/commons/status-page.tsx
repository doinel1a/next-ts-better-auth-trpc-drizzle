'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

type TStatusPageContent = Readonly<{
  code: string;
  title: string;
  description: string;
  label: string;
  codeColorClass: string;
  codeColorTop: string;
  codeColorBottom: string;
  blinkColorClass: string;
  scanlineColorClass: string;
  actions: ReactNode;
  digest?: string;
}>;

export default function StatusPageContent({
  code,
  title,
  description,
  label,
  codeColorClass,
  codeColorTop,
  codeColorBottom,
  blinkColorClass,
  scanlineColorClass,
  actions,
  digest
}: TStatusPageContent) {
  return (
    <>
      <ScanlineOverlay colorClass={scanlineColorClass} />

      <p className='animate-nf-fade-up text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase [animation-delay:0.05s]'>
        {label}
      </p>

      <GlitchCode
        code={code}
        colorClass={codeColorClass}
        colorTop={codeColorTop}
        colorBottom={codeColorBottom}
      />

      <div className='animate-nf-fade-up flex flex-col gap-y-1.5 [animation-delay:0.4s]'>
        <p className='text-foreground text-xl font-bold'>
          {title}
          <span className={cn('animate-nf-blink ml-1.5', blinkColorClass)} aria-hidden='true'>
            _
          </span>
        </p>
        <p className='text-muted-foreground max-w-xs text-sm'>{description}</p>
        {digest !== undefined && (
          <p className='text-muted-foreground mt-1 font-mono text-[0.65rem] opacity-60'>
            digest: {digest}
          </p>
        )}
      </div>

      <div className='animate-nf-fade-up mt-2 flex gap-x-3 [animation-delay:0.6s]'>{actions}</div>
    </>
  );
}

const glitchBase = 'font-mono text-[8rem] leading-none font-black md:text-[11rem]';

type TGlitchCode = Readonly<{
  code: string;
  colorClass: string;
  colorTop: string;
  colorBottom: string;
}>;

function GlitchCode({ code, colorTop, colorBottom, colorClass }: TGlitchCode) {
  return (
    <div className='animate-nf-fade-up relative select-none [animation-delay:0.2s]'>
      <span
        className={cn(glitchBase, 'animate-nf-glitch-top absolute inset-0 opacity-75')}
        style={{ color: colorTop }}
        aria-hidden='true'
      >
        {code}
      </span>
      <span
        className={cn(glitchBase, 'animate-nf-glitch-bottom absolute inset-0 opacity-75')}
        style={{ color: colorBottom }}
        aria-hidden='true'
      >
        {code}
      </span>
      <h1 className={cn(glitchBase, 'animate-nf-flicker relative', colorClass)}>{code}</h1>
    </div>
  );
}

type TScanlineOverlay = Readonly<{
  colorClass: string;
}>;

function ScanlineOverlay({ colorClass }: TScanlineOverlay) {
  return (
    <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden' aria-hidden='true'>
      <div
        className={cn(
          'animate-nf-scanline absolute top-0 right-0 left-0 h-1 bg-linear-to-b from-transparent to-transparent',
          colorClass
        )}
      />
    </div>
  );
}

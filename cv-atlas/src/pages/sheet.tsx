import * as React from 'react'
import { Printer } from 'lucide-react'
import { TOPICS } from '@/content'
import { Tex } from '@/components/ui/tex'
import { Button } from '@/components/ui/button'
import { href } from '@/lib/router'
import { pad2 } from '@/lib/utils'

export function SheetPage() {
  React.useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const sections = TOPICS.filter((t) => t.sheet.length)

  return (
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-10">
        <div className="eyebrow mb-3">Formula sheet</div>
        <h1 className="font-display text-[34px] leading-[1.08] tracking-tight sm:text-[44px]">
          Everything, on one page.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-muted-foreground">
          The night-before pass. If a line here does not immediately bring back <em>why</em> it is
          true, that is your revision list — follow the topic link and re-read the section, not the
          formula.
        </p>
        <div className="mt-6 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer /> Print or save as PDF
          </Button>
        </div>
      </header>

      <div className="space-y-10">
        {sections.map((t) => (
          <section key={t.id} className="break-inside-avoid">
            <div className="mb-4 flex items-baseline gap-3 border-b border-hairline pb-2">
              <span className="eyebrow tabular-nums">{pad2(t.n)} /</span>
              <a
                href={href(`/t/${t.id}`)}
                className="font-display text-[21px] leading-tight underline-offset-4 hover:underline"
              >
                {t.title}
              </a>
            </div>
            <dl className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
              {t.sheet.map((row, i) => (
                <div key={i} className="break-inside-avoid">
                  <dt className="eyebrow mb-1">{row.name}</dt>
                  <dd>
                    <div className="overflow-x-auto">
                      <Tex>{row.tex}</Tex>
                    </div>
                    {row.note ? (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {row.note}
                      </p>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}

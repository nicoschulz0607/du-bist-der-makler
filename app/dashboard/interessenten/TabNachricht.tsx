import HabeGeantwortetButton from '@/components/interessenten/HabeGeantwortetButton'

interface Props {
  interessent: Record<string, unknown>
}

export default function TabNachricht({ interessent }: Props) {
  return (
    <div className="space-y-4">
      <HabeGeantwortetButton
        interessentId={interessent.id as string}
        antwortetAm={(interessent.antwortet_am as string) ?? null}
      />

      {interessent.nachricht ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-tertiary mb-2">
            Übermittelte Nachricht
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">
            {interessent.nachricht as string}
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-text-tertiary italic">
          Keine Nachricht hinterlegt.
        </p>
      )}
    </div>
  )
}

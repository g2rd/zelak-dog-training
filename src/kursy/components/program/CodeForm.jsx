import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useRedeemCode } from '@/kursy/hooks/useProgram'
import { Field } from '@/kursy/components/Field'
import { Notice } from '@/kursy/components/Notice'
import { applyErrorMessage } from '@/kursy/lib/program'

/**
 * Wpisanie kodu od trenera. Pies jest albo z góry wiadomy (`dogId`),
 * albo do wyboru z listy (`dogs`) — wtedy pole wyboru pojawia się tylko,
 * gdy psów jest więcej niż jeden.
 */
export function CodeForm({ dogId, dogs, onRedeemed, label = 'Kod od trenera', submitLabel = 'Wejdź z kodem' }) {
  const redeem = useRedeemCode()
  const [code, setCode] = useState('')
  const [picked, setPicked] = useState('')
  const chosen = dogId || picked || dogs?.[0]?.id || ''

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!code.trim() || !chosen) return
    redeem.mutate({ code: code.trim(), dogId: chosen }, { onSuccess: onRedeemed })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[60ch] flex-col gap-4">
      {!dogId && dogs?.length > 1 && (
        <Field as="select" label="Pies" value={chosen} onChange={(e) => setPicked(e.target.value)}>
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.breed ? ` (${d.breed})` : ''}
            </option>
          ))}
        </Field>
      )}
      <Field
        label={label}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="ABCD-EFGH"
      />
      {redeem.isError && <Notice tone="error">{applyErrorMessage(redeem.error)}</Notice>}
      <Button type="submit" disabled={redeem.isPending || !code.trim() || !chosen} className="self-start">
        {redeem.isPending ? 'Sprawdzam…' : submitLabel}
      </Button>
    </form>
  )
}

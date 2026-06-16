import { DELETION_COPY, EXPORT_COPY, PRIVACY_DATA_ITEMS } from './privacy.copy'

const IMMEDIATE_DELETION =
  /eliminaci[oó]n inmediata|borrado instant[aá]neo|eliminamos?.* inmediatamente/i
// Detects affirmative diagnostic/medical claims but not the word in negated context
// (e.g. "no diagnostica" is acceptable copy; "diagnosticamos tu piel" is not).
const MEDICAL_CLAIM =
  /(?<!no )diagn[oó]stic[ao]|protecci[oó]n m[eé]dica|previene c[aá]ncer|seguimiento m[eé]dico/i
const OVERCLAIM = /100% an[oó]nimo|borrado garantizado|sin riesgo|datos? segur/i

describe('DELETION_COPY', () => {
  const allCopy = Object.values(DELETION_COPY).join('\n')

  it('does not claim immediate deletion', () => {
    expect(allCopy).not.toMatch(IMMEDIATE_DELETION)
  })

  it('references a processing window of 30 days', () => {
    expect(allCopy).toMatch(/30 d[ií]as/)
  })

  it('uses "solicitud" / "registrada" framing, not instant action', () => {
    expect(allCopy).toMatch(/solicitud/)
    expect(allCopy).toMatch(/registr/)
  })

  it('does not make medical or legal overclaims', () => {
    expect(allCopy).not.toMatch(MEDICAL_CLAIM)
    expect(allCopy).not.toMatch(OVERCLAIM)
  })

  it('success copy clarifies the request is pending, not completed', () => {
    expect(DELETION_COPY.successBody).toMatch(/procesaremos/)
    expect(DELETION_COPY.successBody).not.toMatch(IMMEDIATE_DELETION)
  })
})

describe('EXPORT_COPY', () => {
  const allCopy = Object.values(EXPORT_COPY).join('\n')

  it('does not claim to export all data', () => {
    expect(allCopy).not.toMatch(/todos los datos|todos tus datos|todo tu historial/i)
  })

  it('does not make legal compliance claims', () => {
    expect(allCopy).not.toMatch(/cumplimiento legal|cumplimos|conforme a la ley|garantizamos/i)
  })

  it('does not claim immediate deletion', () => {
    expect(allCopy).not.toMatch(IMMEDIATE_DELETION)
  })

  it('does not make medical or legal overclaims', () => {
    expect(allCopy).not.toMatch(MEDICAL_CLAIM)
    expect(allCopy).not.toMatch(OVERCLAIM)
  })
})

describe('PRIVACY_DATA_ITEMS', () => {
  const joined = PRIVACY_DATA_ITEMS.join('\n')

  it('does not make medical or legal overclaims', () => {
    expect(joined).not.toMatch(MEDICAL_CLAIM)
    expect(joined).not.toMatch(OVERCLAIM)
  })

  it('explains that location is only used for UV estimation', () => {
    expect(joined).toMatch(/ubicaci[oó]n/)
    expect(joined).toMatch(/UV/)
  })

  it('clarifies that Bronze IQ does not diagnose skin', () => {
    expect(joined).toMatch(/no diagnostica/)
  })

  it('mentions the right to request data deletion', () => {
    expect(joined).toMatch(/eliminaci[oó]n/)
  })

  it('does not claim photos are stored or analysed', () => {
    expect(joined).toMatch(/no.*im[aá]genes|im[aá]genes.*no/)
  })
})

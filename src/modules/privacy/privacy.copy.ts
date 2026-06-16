/** Static copy used in deletion request and privacy flows. Extracted here so
 *  it can be tested for overclaims without rendering components. */

export const DELETION_COPY = {
  alertTitle: '¿Solicitar eliminación?',
  alertBody:
    'Registraremos una solicitud de eliminación de tus datos. La solicitud será procesada en un máximo de 30 días.',
  explanation:
    'Puedes solicitar la eliminación de tus datos asociados a Bronze IQ. La solicitud quedará registrada y será procesada en un máximo de 30 días.',
  notice:
    'Esta acción no elimina tu cuenta de forma inmediata. Registra la solicitud y la tramitaremos conforme a nuestra política de privacidad.',
  successTitle: 'Solicitud registrada',
  successBody:
    'Hemos registrado tu solicitud. La procesaremos en un máximo de 30 días conforme a nuestra política de privacidad.',
} as const

/** Bullet points for the "Tus datos" section in Settings. */
export const PRIVACY_DATA_ITEMS: readonly string[] = [
  'Tu perfil y fototipo ajustan las estimaciones de exposición solar.',
  'Las sesiones registradas calibran el ritmo estimado de tu plan.',
  'La ubicación se consulta solo para obtener el índice UV de tu zona.',
  'Bronze IQ no diagnostica tu piel ni almacena imágenes.',
  'Puedes solicitar la eliminación de todos tus datos en cualquier momento.',
]

/** Copy for the data export flow. */
export const EXPORT_COPY = {
  settingsLabel: 'Exportar mis datos',
  settingsDescription: 'Descarga tus sesiones, perfil y plan en formato JSON.',
  shareTitle: 'Mis datos de Bronze IQ',
  errorMessage: 'No se han podido exportar tus datos. Inténtalo de nuevo.',
} as const

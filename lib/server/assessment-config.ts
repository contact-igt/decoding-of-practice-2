export function sheetAssessmentEnabled() {
  return process.env.DOP_UNSCORED_ASSESSMENT === '1' &&
    Boolean(process.env.DOP_GOOGLE_SHEETS_URL && (
      process.env.DATABASE_URL || (process.env.VERCEL !== '1' && process.env.DOP_ASSESSMENT_STORE)
    ));
}

import type { FormConfig } from '@webmcp-jobs/ats-core'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const GENDER = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'decline', label: 'Decline to self-identify' },
]

const RACE = [
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black or African American' },
  { value: 'hispanic', label: 'Hispanic or Latino' },
  { value: 'white', label: 'White' },
  { value: 'native', label: 'Native American or Alaska Native' },
  { value: 'pacific', label: 'Native Hawaiian or Pacific Islander' },
  { value: 'two_or_more', label: 'Two or more races' },
  { value: 'decline', label: 'Decline to self-identify' },
]

const VETERAN = [
  { value: 'not_veteran', label: 'I am not a protected veteran' },
  { value: 'veteran', label: 'I identify as one or more classifications of protected veteran' },
  { value: 'decline', label: 'Decline to self-identify' },
]

const DISABILITY = [
  { value: 'yes', label: 'Yes, I have a disability (or previously had one)' },
  { value: 'no', label: 'No, I do not have a disability' },
  { value: 'decline', label: 'Decline to answer' },
]

// Greenhouse-style: a 5-step wizard, first/last name split, resume-parsed work
// history, screening ("knockout") questions, and a full EEO self-id block.
export const greenholdForm: FormConfig = {
  provider: 'greenhouse',
  brand: 'Greenhold',
  tagline: 'Applicant tracking',
  layout: 'wizard',
  pages: [
    {
      id: 'basic',
      title: 'Basic info',
      fields: [
        { id: 'firstName', label: 'First name', type: 'text', required: true },
        { id: 'lastName', label: 'Last name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', required: true },
        { id: 'location', label: 'Location (city, state)', type: 'text' },
      ],
    },
    {
      id: 'documents',
      title: 'Resume & links',
      fields: [
        { id: 'resume', label: 'Resume / CV', type: 'file', kind: 'resume', required: true, help: 'PDF, DOCX, or paste text.' },
        { id: 'coverLetter', label: 'Cover letter', type: 'textarea', kind: 'coverLetter', help: 'Optional.' },
        { id: 'linkedin', label: 'LinkedIn URL', type: 'url', kind: 'link', placeholder: 'https://linkedin.com/in/…' },
        { id: 'portfolio', label: 'Website / portfolio', type: 'url', kind: 'link', placeholder: 'https://…' },
      ],
    },
    {
      id: 'experience',
      title: 'Work experience',
      description: 'Your most recent role. Normally parsed from your resume — edit as needed.',
      fields: [
        { id: 'recentTitle', label: 'Most recent job title', type: 'text' },
        { id: 'recentCompany', label: 'Company', type: 'text' },
        { id: 'startDate', label: 'Start date', type: 'date' },
        { id: 'endDate', label: 'End date', type: 'date' },
        { id: 'currentlyWork', label: 'I currently work here', type: 'boolean', placeholder: 'Yes, this is my current role' },
        { id: 'roleSummary', label: 'What did you do in this role?', type: 'textarea' },
      ],
    },
    {
      id: 'screening',
      title: 'Screening questions',
      fields: [
        { id: 'workAuthorized', label: 'Are you legally authorized to work in the US?', type: 'radio', options: YES_NO, required: true },
        { id: 'requiresSponsorship', label: 'Will you now or in the future require visa sponsorship?', type: 'radio', options: YES_NO, required: true },
        {
          id: 'yearsExperience',
          label: 'Years of professional experience',
          type: 'select',
          required: true,
          options: [
            { value: '0-1', label: '0–1 years' },
            { value: '2-3', label: '2–3 years' },
            { value: '4-6', label: '4–6 years' },
            { value: '7-10', label: '7–10 years' },
            { value: '10+', label: '10+ years' },
          ],
        },
        { id: 'desiredSalary', label: 'Desired base salary (USD)', type: 'text', placeholder: 'e.g. 180000' },
        { id: 'whyInterested', label: 'Why are you interested in this role?', type: 'textarea', required: true },
        {
          id: 'howHeard',
          label: 'How did you hear about us?',
          type: 'select',
          options: [
            { value: 'linkedin', label: 'LinkedIn' },
            { value: 'job_board', label: 'Job board' },
            { value: 'referral', label: 'Employee referral' },
            { value: 'company_site', label: 'Company website' },
            { value: 'recruiter', label: 'Recruiter' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      id: 'eeo',
      title: 'Voluntary self-identification',
      description: 'Completion is voluntary and does not affect your application. Each question can be declined.',
      fields: [
        { id: 'gender', label: 'Gender', type: 'select', options: GENDER },
        { id: 'raceEthnicity', label: 'Race / ethnicity', type: 'select', options: RACE },
        { id: 'veteranStatus', label: 'Veteran status', type: 'select', options: VETERAN },
        { id: 'disabilityStatus', label: 'Disability status', type: 'select', options: DISABILITY },
      ],
    },
  ],
}

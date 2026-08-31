import type { FormConfig } from '@webmcp-jobs/ats-core'
import { COUNTRIES } from '@webmcp-jobs/ats-core'

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
  { value: 'not_veteran', label: 'Not a protected veteran' },
  { value: 'veteran', label: 'Protected veteran' },
  { value: 'decline', label: 'Decline to self-identify' },
]

const DISABILITY = [
  { value: 'yes', label: 'Yes, I have a disability' },
  { value: 'no', label: 'No' },
  { value: 'decline', label: 'Decline to answer' },
]

// Lever-style: a single scrolling page with sections, a combined full-name
// field, a dedicated Links section, one free-text catch-all, and a separate EEO
// survey block. Structurally different from Greenhold so an agent must adapt.
export const leverlyForm: FormConfig = {
  provider: 'lever',
  brand: 'Leverly',
  tagline: 'Submit your application',
  layout: 'single',
  pages: [
    {
      id: 'apply',
      title: 'Submit your application',
      fields: [
        // Contact
        { id: 'fullName', label: 'Full name', type: 'text', required: true, group: 'Contact information' },
        { id: 'email', label: 'Email', type: 'email', required: true, group: 'Contact information' },
        { id: 'confirmEmail', label: 'Confirm email', type: 'email', required: true, matchField: 'email', group: 'Contact information' },
        { id: 'phone', label: 'Phone', type: 'tel', group: 'Contact information' },
        { id: 'currentCompany', label: 'Current company', type: 'text', group: 'Contact information' },
        { id: 'location', label: 'Current location', type: 'text', group: 'Contact information' },
        { id: 'country', label: 'Country', type: 'select', required: true, options: COUNTRIES, group: 'Contact information' },
        { id: 'resume', label: 'Resume / CV', type: 'file', kind: 'resume', required: true, group: 'Contact information', help: 'PDF, DOCX, or paste text.' },

        // Links (Lever's distinctive URL section)
        { id: 'linkedin', label: 'LinkedIn URL', type: 'url', kind: 'link', group: 'Links', placeholder: 'https://linkedin.com/in/…' },
        { id: 'github', label: 'GitHub URL', type: 'url', kind: 'link', group: 'Links', placeholder: 'https://github.com/…' },
        { id: 'portfolio', label: 'Portfolio / other URL', type: 'url', kind: 'link', group: 'Links', placeholder: 'https://…' },

        // Additional info — a single free-text catch-all
        {
          id: 'additionalInfo',
          label: "Anything else you'd like us to know?",
          type: 'textarea',
          group: 'Additional information',
        },

        // Custom questions
        { id: 'workAuthorized', label: 'Are you authorized to work in the US?', type: 'radio', options: YES_NO, required: true, group: 'Application questions' },
        {
          id: 'preferredLocation',
          label: 'Preferred work location',
          type: 'select',
          group: 'Application questions',
          options: [
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
            { value: 'no_pref', label: 'No preference' },
          ],
        },
        { id: 'fit', label: 'What experience makes you a fit for this role?', type: 'textarea', required: true, group: 'Application questions' },

        // EEO survey block
        { id: 'gender', label: 'Gender', type: 'select', options: GENDER, group: 'Voluntary self-identification (EEO)' },
        { id: 'raceEthnicity', label: 'Race / ethnicity', type: 'select', options: RACE, group: 'Voluntary self-identification (EEO)' },
        { id: 'veteranStatus', label: 'Veteran status', type: 'select', options: VETERAN, group: 'Voluntary self-identification (EEO)' },
        { id: 'disabilityStatus', label: 'Disability status', type: 'select', options: DISABILITY, group: 'Voluntary self-identification (EEO)' },

        {
          id: 'agreeTerms',
          label: 'Terms & conditions',
          type: 'boolean',
          required: true,
          scrollGate: true,
          placeholder: 'I have read and agree to the terms and conditions',
          group: 'Before you submit',
        },
      ],
    },
  ],
}

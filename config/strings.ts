export const strings = {
  app: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || 'OKRFlow',
    tagline:
      process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
      'Build, track, and align your OKRs.',
  },
  navigation: {
    items: {
      company: 'Company',
      teams: 'Teams',
      myOkrs: 'My OKRs',
      alerts: 'Alerts',
      reports: 'Reports',
      settings: 'Settings',
    },
    signOut: 'Sign out',
    signedInAs: 'Signed in as',
    signedInStatus: 'Signed in',
    fallbackUser: 'User',
  },
  breadcrumbs: {
    details: 'Details',
    okrs: 'Objectives',
    myWorkspace: 'My Workspace',
    myOkrs: 'My OKRs',
    admin: 'Settings',
    new: 'New',
  },
  titles: {
    okrs: 'OKR Dashboard',
    myOkrs: 'My OKRs',
    objectiveCreate: 'Create Objective',
    objectiveEdit: 'Edit Objective',
    keyResults: 'Key Results',
  },
  descriptions: {
    okrs: 'Manage objectives, track key results, and align your team.',
    myOkrs: 'View and update your assigned objectives and key results.',
    objectiveForm: 'Fill in the objective details below.',
  },
  buttons: {
    newObjective: 'New Objective',
    createObjective: 'Create Objective',
    saveObjective: 'Save Changes',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    deleting: 'Deleting…',
    manage: 'Manage',
    deleteObjective: 'Delete Objective',
    deleteKeyResult: 'Delete Key Result',
    deleteInitiative: 'Delete Initiative',
    createFirstObjective: 'Create your first Objective',
  },
  selects: {
    cycleLabel: 'OKR Cycle',
    allCycles: 'All Objectives',
    currentCycle: 'Active Objectives',
  },
  inputs: {
    objectiveSearch: 'Search by title or owner',
    optionalComment: 'Optional comment',
  },
  emptyStates: {
    noObjectives: {
      title: 'No objectives yet',
      description: 'Create your first objective to start tracking your goals.',
      actionLabel: 'Create your first Objective',
    },
    myOkrs: {
      title: 'No OKRs assigned',
      description: 'When objectives or key results are assigned to you, they will appear here.',
    },
    missingObjective: {
      title: 'Objective not found',
      description: 'The objective you are looking for is unavailable or may have been removed.',
      actionLabel: 'Back to objectives',
    },
  },
  toasts: {
    checkIns: {
      loading: 'Saving update…',
      success: 'Update saved',
      error: 'Failed to save update',
    },
    objectives: {
      creating: 'Creating objective…',
      updating: 'Saving changes…',
      created: 'Objective created',
      updated: 'Objective updated',
      deleted: 'Objective deleted',
      error: 'Unable to save objective',
      deleteError: 'Failed to delete objective',
      weightsExceeded: 'Key result progress must be valid',
    },
    keyResults: {
      deleted: 'Key result deleted',
      error: 'Failed to delete key result',
    },
    initiatives: {
      deleted: 'Initiative deleted',
      error: 'Failed to delete initiative',
    },
  },
  errors: {
    objectivesLoad: 'Failed to load objectives',
    myOkrsLoad: 'Failed to load OKRs',
    objectiveMissing: 'Objective not found',
    weightsExceeded: 'Invalid progress values.',
  },
  labels: {
    ownerPrefix: 'Owner:',
    alignedUnder: 'Objective',
    topLevelObjective: 'Top-level Objective',
    start: 'Start',
    end: 'End',
    fiscalQuarter: 'Fiscal Quarter',
    weightsTotal: 'Progress updated',
    initiatives: 'Initiatives',
    initiativesEmpty: 'No initiatives yet.',
  },
  toggles: {
    showHistory: 'Show history',
    hideHistory: 'Hide history',
  },
  dialogs: {
    deleteObjective: {
      title: 'Delete objective?',
      description: 'This will remove the objective and all of its key results and initiatives.',
      confirmLabel: 'Delete Objective',
      cancelLabel: 'Cancel',
    },
    deleteKeyResult: {
      title: 'Delete key result?',
      description: 'This will remove the key result and all of its initiatives.',
      confirmLabel: 'Delete Key Result',
      cancelLabel: 'Cancel',
    },
    deleteInitiative: {
      title: 'Delete initiative?',
      description: 'This initiative will be permanently removed.',
      confirmLabel: 'Delete Initiative',
      cancelLabel: 'Cancel',
    },
  },
}

export type Strings = typeof strings

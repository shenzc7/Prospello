export const strings = {
  app: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Prospello',
    tagline:
      process.env.NEXT_PUBLIC_BRAND_TAGLINE ||
      'Project management and team collaboration for software development.',
  },
  navigation: {
    items: {
      company: 'Company',
      teams: 'Teams',
      myOkrs: 'My OKRs',
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
    okrs: 'Projects',
    myWorkspace: 'My Workspace',
    myOkrs: 'My Tasks',
    admin: 'Settings',
    new: 'New',
  },
  titles: {
    okrs: 'Project Dashboard',
    myOkrs: 'My Tasks',
    objectiveCreate: 'Create Project',
    objectiveEdit: 'Edit Project',
    keyResults: 'Tasks',
  },
  descriptions: {
    okrs: 'Manage projects, track progress, and collaborate with your team.',
    myOkrs: 'View and update your assigned tasks.',
    objectiveForm: 'Fill in the project details below.',
  },
  buttons: {
    newObjective: 'New Project',
    createObjective: 'Create Project',
    saveObjective: 'Save Changes',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving…',
    deleting: 'Deleting…',
    manage: 'Manage',
    deleteObjective: 'Delete Project',
    deleteKeyResult: 'Delete Task',
    deleteInitiative: 'Delete Task',
    createFirstObjective: 'Create your first Project',
  },
  selects: {
    cycleLabel: 'Project Type',
    allCycles: 'All Projects',
    currentCycle: 'Active Projects',
  },
  inputs: {
    objectiveSearch: 'Search by title or owner',
    optionalComment: 'Optional comment',
  },
  emptyStates: {
    noObjectives: {
      title: 'No projects yet',
      description: 'Create your first project to start organizing your work.',
      actionLabel: 'Create your first Project',
    },
    myOkrs: {
      title: 'No tasks assigned',
      description: 'When tasks are assigned to you, they will appear here.',
    },
    missingObjective: {
      title: 'Project not found',
      description: 'The project you are looking for is unavailable or may have been removed.',
      actionLabel: 'Back to projects',
    },
  },
  toasts: {
    checkIns: {
      loading: 'Saving update…',
      success: 'Update saved',
      error: 'Failed to save update',
    },
    objectives: {
      creating: 'Creating project…',
      updating: 'Saving changes…',
      created: 'Project created',
      updated: 'Project updated',
      deleted: 'Project deleted',
      error: 'Unable to save project',
      deleteError: 'Failed to delete project',
      weightsExceeded: 'Task progress must be valid',
    },
    keyResults: {
      deleted: 'Task deleted',
      error: 'Failed to delete task',
    },
    initiatives: {
      deleted: 'Task deleted',
      error: 'Failed to delete task',
    },
  },
  errors: {
    objectivesLoad: 'Failed to load projects',
    myOkrsLoad: 'Failed to load tasks',
    objectiveMissing: 'Project not found',
    weightsExceeded: 'Invalid progress values.',
  },
  labels: {
    ownerPrefix: 'Owner:',
    alignedUnder: 'Project',
    topLevelObjective: 'Main project',
    start: 'Start',
    end: 'End',
    fiscalQuarter: 'Fiscal Quarter',
    weightsTotal: 'Progress updated',
    initiatives: 'Tasks',
    initiativesEmpty: 'No tasks yet.',
  },
  toggles: {
    showHistory: 'Show history',
    hideHistory: 'Hide history',
  },
  dialogs: {
    deleteObjective: {
      title: 'Delete project?',
      description: 'This will remove the project and all of its tasks.',
      confirmLabel: 'Delete Project',
      cancelLabel: 'Cancel',
    },
    deleteKeyResult: {
      title: 'Delete task?',
      description: 'This removes the task.',
      confirmLabel: 'Delete Task',
      cancelLabel: 'Cancel',
    },
    deleteInitiative: {
      title: 'Delete task?',
      description: 'This task will be permanently removed.',
      confirmLabel: 'Delete Task',
      cancelLabel: 'Cancel',
    },
  },
}

export type Strings = typeof strings

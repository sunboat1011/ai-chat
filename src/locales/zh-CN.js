/**
 * UI text dictionary for Chinese locale.
 * Designed for easy i18n extension in the future.
 * Key conventions: dot-separated path, all lowercase with hyphens.
 */

export const zhCN = {
  // ─── App ───
  app: {
    undoToast: 'Message deleted',
    undo: 'Undo',
  },

  // ─── Sidebar ───
  sidebar: {
    newChat: 'New Chat',
    searchPlaceholder: 'Search conversations...',
    noConversations: 'No conversations found',
    settings: 'Settings',
    deleteConversation: 'Delete conversation',
    close: 'Close sidebar',
  },

  // ─── Chat Input ───
  chatInput: {
    placeholder: 'Send a message...',
    placeholderGenerating: 'Generating response...',
    send: 'Send message',
    stop: 'Stop generating',
    hint: 'Press {enter} to send, {shiftEnter} for new line',
  },

  // ─── Message Item ───
  message: {
    user: 'You',
    assistant: 'AI Assistant',
    edit: 'Edit message',
    delete: 'Delete message',
    regenerate: 'Regenerate response',
    copy: 'Copy message',
    copied: 'Message copied',
    branch: 'Branch conversation from this message',
    cancelEdit: 'Cancel edit',
    saveAndSubmit: 'Save & Submit',
    deleteConfirmTitle: 'Delete Message',
    deleteConfirmMessage:
      'Are you sure you want to delete this message? This action cannot be undone.',
    deleteConfirmBtn: 'Delete',
    cancel: 'Cancel',
    codeCopied: 'Code copied',
    copyCode: 'Copy code',
    copyCodeBtn: 'Copy',
    copiedBtn: 'Copied!',
    messageSingular: 'message',
    messagePlural: 'messages',
  },

  // ─── Chat View ───
  chatView: {
    searchPlaceholder: 'Search in conversation...',
    previousMatch: 'Previous match',
    nextMatch: 'Next match',
    closeSearch: 'Close search',
    searchTitle: 'Search in conversation',
    roleLabel: 'Role:',
    generalAssistant: 'General Assistant',
    editSystemPrompt: 'Edit system prompt',
    editSystemPromptTitle: 'Edit System Prompt',
    editSystemPromptHint: 'Changes affect all future messages in this conversation.',
    save: 'Save',
    welcomeTitle: 'How can I help you today?',
    welcomeSub: 'Ask me anything — code, writing, analysis, or just chat.',
    loadEarlier: 'Load earlier',
    loadEarlierCount: 'Load earlier ({count} {messages})',
    openSidebar: 'Open sidebar',
  },

  // ─── Role Select Modal ───
  roleModal: {
    title: 'Choose a Template',
    subtitle: 'Select a preset template or create your own',
    custom: 'Custom',
    customDesc: 'Write your own system prompt',
    systemPrompt: 'System Prompt',
    systemPromptHint: 'The system prompt defines how the AI behaves throughout this conversation.',
    initialMessages: 'Initial Messages',
    skip: 'Skip',
    startChat: 'Start Chat',
    startChatAria: 'Start chat with selected template',
    customAria: 'Use custom system prompt',
    selectTemplate: 'Select template: {name}',
  },

  // ─── Settings Modal ───
  settings: {
    title: 'Settings',
    close: 'Close',

    // Appearance
    appearance: 'Appearance',
    theme: 'Theme',
    themeDark: 'Use dark theme',
    themeLight: 'Use light theme',
    themeSystem: 'Use system theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    accentColor: 'Accent Color',
    accentColorLabel: 'Use {name} accent color',

    // API
    apiConfig: 'API Configuration',
    apiBaseUrl: 'API Base URL',
    apiBaseUrlHint: 'The base URL of your AI backend service.',
    defaultModel: 'Default Model',
    builtIn: 'Built-in',
    custom: 'Custom',

    // Custom Models
    customModels: 'Custom Models',
    addCustomModel: 'Add custom model',
    add: 'Add',
    noCustomModels: 'No custom models. Click "Add" to configure your own endpoint.',
    editCustomModel: 'Edit custom model',
    deleteCustomModel: 'Delete custom model',
    addModelTitle: 'Add Custom Model',
    editModelTitle: 'Edit Custom Model',
    modelFormHint: 'Configure a custom OpenAI-compatible endpoint.',
    displayName: 'Display Name',
    displayNamePlaceholder: 'e.g., My Local LLM',
    modelId: 'Model ID',
    modelIdPlaceholder: 'e.g., gpt-4, llama-3-70b',
    apiUrlOptional: 'API URL (optional)',
    apiUrlPlaceholder: 'e.g., http://localhost:8080/api',
    apiUrlHint: 'Leave empty to use the global API Base URL.',
    apiKeyOptional: 'API Key (optional)',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHint: 'Stored with base64 encoding. Cleared on edit if left blank.',
    cancel: 'Cancel',
    save: 'Save',
    update: 'Update',
    deleteModelConfirm: 'Delete custom model "{name}"?',
    enterDisplayName: 'Please enter a display name.',
    enterModelId: 'Please enter a model ID.',

    // Templates
    templates: 'Conversation Templates',
    addTemplate: 'Add custom template',
    noCustomTemplates: 'No custom templates. Click "Add" to create your own.',
    builtInBadge: 'Built-in',
    editTemplate: 'Edit template',
    deleteTemplate: 'Delete template',
    addTemplateTitle: 'Add Template',
    editTemplateTitle: 'Edit Template',
    templateFormHint: 'Create a reusable conversation template.',
    name: 'Name',
    namePlaceholder: 'e.g., Bug Fixer',
    icon: 'Icon',
    iconPlaceholder: '✨',
    description: 'Description',
    descriptionPlaceholder: 'Short description...',
    templatePromptHint: 'Defines how the AI behaves in conversations started from this template.',
    deleteTemplateConfirm: 'Delete template "{name}"?',
    enterTemplateName: 'Please enter a template name.',

    // Model Parameters
    modelParams: 'Model Parameters',
    resetToDefault: 'Reset model parameters to defaults',
    resetToDefaultShort: 'Reset to default',
    temperature: 'Temperature',
    temperatureHint:
      'Controls randomness: 0 is deterministic, 2 is highly random. Default is {default}.',
    maxTokens: 'Max Tokens',
    maxTokensHint: 'Maximum number of tokens to generate. Default is {default}.',
    topP: 'Top P',
    topPHint: 'Nucleus sampling: consider only the top probability mass. Default is {default}.',

    // System Prompt
    systemPrompt: 'System Prompt',
    defaultSystemPrompt: 'Default System Prompt',
    defaultSystemPromptPlaceholder: 'e.g., You are a helpful coding assistant...',
    defaultSystemPromptHint:
      'Applied to all new conversations. Each conversation can override this independently.',

    // Footer
    resetAll: 'Reset all settings to defaults',
    resetAllConfirm: 'Reset all settings to defaults?',
    resetParamsConfirm: 'Reset model parameters to defaults?',
    done: 'Done',
  },

  // ─── Confirm Modal ───
  confirm: {
    title: 'Confirm',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },

  // ─── Error Toast ───
  errorToast: {
    close: 'Close notification',
    region: 'Notifications',
  },

  // ─── Errors (user-facing messages) ───
  errors: {
    networkFailed: 'Network connection failed. Please check your network and try again.',
    cors: 'API endpoint is misconfigured — unable to reach the server.',
    streamInterrupted: 'Connection interrupted. Partial response kept.',
    unauthorized: 'Unauthorized (401). Please check your API key in Settings.',
    forbidden: 'Access forbidden (403). Your API key may lack permission.',
    notFound: 'API endpoint not found (404). Please check the API Base URL in Settings.',
    rateLimited: 'Too many requests (429). Please wait a moment and try again.',
    serverError: 'Server error ({status}). Please try again later.',
    serviceUnavailable: 'Service unavailable (503). The server is temporarily down.',
    httpGeneric: 'Request failed ({status}). Please try again.',
    unhandledRejection: 'An unexpected error occurred. Please try again.',
    unknownError: 'Something went wrong.',
  },

  // ─── Auth / Login ───
  auth: {
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    loginSubtitle: 'Sign in to your account',
    registerSubtitle: 'Join us today',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    email: 'Email (optional)',
    emailPlaceholder: 'your@email.com',
    loginTab: 'Login',
    registerTab: 'Register',
    loginBtn: 'Sign In',
    registerBtn: 'Sign Up',
    loggingIn: 'Signing in…',
    registering: 'Signing up…',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: 'Don\'t have an account?',
    switchToLogin: 'Sign In',
    switchToRegister: 'Sign Up',
    usernameRule: '3–64 characters, letters / numbers / underscores only',
    passwordRule: '6–128 characters',
    confirmPasswordRule: 'Passwords must match',
    usernameRequired: 'Please enter a username',
    passwordRequired: 'Please enter a password',
    confirmPasswordRequired: 'Please confirm your password',
    invalidUsername: 'Username must be 3–64 characters (letters, numbers, underscores only)',
    invalidPassword: 'Password must be 6–128 characters',
    passwordMismatch: 'Passwords do not match',
    logout: 'Log Out',
    logoutConfirmTitle: 'Log Out',
    logoutConfirmMessage: 'Are you sure you want to log out?',
    logoutConfirmBtn: 'Log Out',
    loggedInAs: 'Logged in as {username}',
  },

  // ─── Error Boundary ───
  errorBoundary: {
    title: 'Something went wrong',
    message:
      'The page encountered an error. Try refreshing — your conversations are saved locally.',
    refresh: 'Refresh page',
    reset: 'Dismiss and continue',
  },
}

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo / Title -->
      <div class="login-header">
        <svg
          class="login-logo"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h1 class="login-title">
          {{ isLogin ? $t('auth.welcomeBack') : $t('auth.createAccount') }}
        </h1>
        <p class="login-subtitle">
          {{ isLogin ? $t('auth.loginSubtitle') : $t('auth.registerSubtitle') }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="login-tabs" role="tablist">
        <button
          class="tab-btn"
          :class="{ active: isLogin }"
          role="tab"
          :aria-selected="isLogin"
          @click="switchTab(true)"
        >
          {{ $t('auth.loginTab') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: !isLogin }"
          role="tab"
          :aria-selected="!isLogin"
          @click="switchTab(false)"
        >
          {{ $t('auth.registerTab') }}
        </button>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleSubmit">
        <!-- Username -->
        <div class="form-group">
          <label for="login-username">{{ $t('auth.username') }}</label>
          <input
            id="login-username"
            v-model="form.username"
            type="text"
            class="animal-input"
            :placeholder="$t('auth.usernamePlaceholder')"
            autocomplete="username"
            required
            minlength="3"
            maxlength="64"
            pattern="[a-zA-Z0-9_]{3,64}"
          />
          <span class="form-hint">{{ $t('auth.usernameRule') }}</span>
        </div>

        <!-- Email (register only) -->
        <div v-if="!isLogin" class="form-group">
          <label for="login-email">{{ $t('auth.email') }}</label>
          <input
            id="login-email"
            v-model="form.email"
            type="email"
            class="animal-input"
            :placeholder="$t('auth.emailPlaceholder')"
            autocomplete="email"
          />
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="login-password">{{ $t('auth.password') }}</label>
          <input
            id="login-password"
            v-model="form.password"
            type="password"
            class="animal-input"
            :placeholder="$t('auth.passwordPlaceholder')"
            autocomplete="current-password"
            required
            minlength="6"
            maxlength="128"
          />
          <span class="form-hint">{{ $t('auth.passwordRule') }}</span>
        </div>

        <!-- Confirm Password (register only) -->
        <div v-if="!isLogin" class="form-group">
          <label for="login-confirm">{{ $t('auth.confirmPassword') }}</label>
          <input
            id="login-confirm"
            v-model="form.confirmPassword"
            type="password"
            class="animal-input"
            :placeholder="$t('auth.confirmPasswordPlaceholder')"
            autocomplete="new-password"
            required
            minlength="6"
            maxlength="128"
          />
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="form-error" role="alert">
          {{ errorMessage }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="animal-btn animal-btn-primary submit-btn"
          :disabled="isSubmitting"
        >
          {{ submitButtonText }}
        </button>
      </form>

      <!-- Migration prompt -->
      <div v-if="showMigratePrompt" class="migrate-prompt">
        <div class="migrate-icon">☁️</div>
        <div class="migrate-text">
          <div class="migrate-title">{{ $t('migrate.promptTitle') }}</div>
          <div class="migrate-desc">{{ $t('migrate.promptMessage') }}</div>
        </div>
        <div class="migrate-actions">
          <button class="migrate-btn migrate-skip" @click="skipMigrate">
            {{ $t('migrate.skipBtn') }}
          </button>
          <button class="migrate-btn migrate-confirm" :disabled="isMigrating" @click="doMigrate">
            {{ isMigrating ? $t('migrate.migrating') : $t('migrate.migrateBtn') }}
          </button>
        </div>
      </div>

      <!-- Switch link -->
      <div class="login-switch">
        <span>{{ isLogin ? $t('auth.noAccount') : $t('auth.alreadyHaveAccount') }}</span>
        <button class="switch-link" @click="switchTab(!isLogin)">
          {{ isLogin ? $t('auth.switchToRegister') : $t('auth.switchToLogin') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/composables/useText.js'
import { login, register } from '@/api/auth.js'
import { getToken, isTokenExpired } from '@/utils/token.js'
import { hasLocalData, migrateLocalData } from '@/api/migrate.js'
import { showInfo } from '@/composables/useErrorToast'

const router = useRouter()

const isLogin = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref('')
const showMigratePrompt = ref(false)
const isMigrating = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const submitButtonText = computed(() => {
  if (isSubmitting.value) {
    return isLogin.value ? t('auth.loggingIn') : t('auth.registering')
  }
  return isLogin.value ? t('auth.loginBtn') : t('auth.registerBtn')
})

onMounted(() => {
  // Already logged in — redirect to home
  const token = getToken()
  if (token && !isTokenExpired()) {
    router.push('/')
  }
})

function switchTab(toLogin) {
  isLogin.value = toLogin
  errorMessage.value = ''
  showMigratePrompt.value = false
  // Reset form on tab switch
  form.username = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
}

function skipMigrate() {
  showMigratePrompt.value = false
  router.push('/')
}

async function doMigrate() {
  isMigrating.value = true
  try {
    const result = await migrateLocalData()
    showInfo(t('migrate.success', result))
    showMigratePrompt.value = false
    router.push('/')
  } catch (err) {
    errorMessage.value = err.friendlyMessage || err.message || 'Migration failed'
    isMigrating.value = false
  }
}

function validate() {
  if (!form.username || form.username.length < 3 || form.username.length > 64) {
    return t('auth.invalidUsername')
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(form.username)) {
    return t('auth.invalidUsername')
  }
  if (!form.password || form.password.length < 6 || form.password.length > 128) {
    return t('auth.invalidPassword')
  }
  if (!isLogin.value) {
    if (form.password !== form.confirmPassword) {
      return t('auth.passwordMismatch')
    }
  }
  return null
}

async function handleSubmit() {
  errorMessage.value = ''

  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    if (isLogin.value) {
      await login({
        username: form.username.trim(),
        password: form.password,
      })
    } else {
      await register({
        username: form.username.trim(),
        password: form.password,
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      })
    }

    // After successful auth, check for local data to migrate
    if (hasLocalData()) {
      showMigratePrompt.value = true
    } else {
      router.push('/')
    }
  } catch (err) {
    errorMessage.value = err.friendlyMessage || err.message || 'Authentication failed'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: var(--bg-primary);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-subtle);
  border-radius: 20px;
  padding: 2rem 1.75rem;
  box-shadow: 0 8px 32px rgba(107, 92, 67, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-logo {
  color: var(--accent-primary);
  margin-bottom: 0.75rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.login-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.login-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  background: var(--bg-tertiary);
  border-radius: 50px;
  padding: 4px;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border-radius: 50px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.form-error {
  padding: 0.625rem 0.875rem;
  background: rgba(224, 90, 90, 0.1);
  border: 1.5px solid rgba(224, 90, 90, 0.3);
  border-radius: 12px;
  color: #e05a5a;
  font-size: 0.8125rem;
  font-weight: 600;
}

.submit-btn {
  width: 100%;
  height: 48px;
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  border-radius: 50px;
}

.login-switch {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.switch-link {
  margin-left: 0.25rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--accent-primary);
  font-weight: 700;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.switch-link:hover {
  color: var(--accent-hover);
}

/* ─── Migration Prompt ─── */
.migrate-prompt {
  margin-top: 1.25rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border: 1.5px solid var(--border-subtle);
  border-radius: 16px;
  text-align: center;
}

.migrate-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.migrate-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.migrate-desc {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.migrate-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.migrate-btn {
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.migrate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.migrate-skip {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.migrate-skip:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.migrate-confirm {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  box-shadow: 0 4px 0 0 #11a89b;
}

.migrate-confirm:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* ─── Mobile Responsive ─── */
@media (max-width: 768px) {
  .login-card {
    padding: 1.5rem 1.25rem;
  }

  .login-title {
    font-size: 1.25rem;
  }

  .submit-btn {
    height: 44px;
    min-height: 44px;
  }
}
</style>

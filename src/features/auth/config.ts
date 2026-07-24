/**
 * Cognito / OIDC settings loaded from Vite env vars ({@code VITE_*}).
 *
 * <p>See {@code .env.example} in the management-web project root.
 */
export type AuthConfig = {
  /** AWS region of the user pool (e.g. {@code ap-southeast-1}). */
  region: string
  /** Cognito user pool id. */
  userPoolId: string
  /** App client id for the management web (public SPA, no secret). */
  clientId: string
  /**
   * Hosted UI host only (no {@code https://}), e.g.
   * {@code myapp-dev-abc.auth.ap-southeast-1.amazoncognito.com}.
   */
  cognitoDomain: string
  /** Where Cognito returns after login (must match the app client callback URLs). */
  redirectUri: string
  /** Where Cognito returns after logout (must match the app client logout URLs). */
  logoutUri: string
}

/**
 * @param name - env var name (for the error message)
 * @param value - raw env value
 * @returns the value if present
 * @throws if {@code value} is missing / empty
 */
function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

/**
 * Reads Cognito OIDC config from {@code import.meta.env}.
 *
 * <p>Required: region, user pool id, client id, Cognito domain.
 * Optional redirect/logout URIs default to localhost:3000.
 *
 * @returns parsed {@link AuthConfig}
 * @throws if a required env var is missing
 */
export function loadAuthConfig(): AuthConfig {
  return {
    region: requiredEnv(
      'VITE_COGNITO_REGION',
      import.meta.env.VITE_COGNITO_REGION,
    ),
    userPoolId: requiredEnv(
      'VITE_COGNITO_USER_POOL_ID',
      import.meta.env.VITE_COGNITO_USER_POOL_ID,
    ),
    clientId: requiredEnv(
      'VITE_COGNITO_CLIENT_ID',
      import.meta.env.VITE_COGNITO_CLIENT_ID,
    ),
    cognitoDomain: requiredEnv(
      'VITE_COGNITO_DOMAIN',
      import.meta.env.VITE_COGNITO_DOMAIN,
    ),
    redirectUri:
      import.meta.env.VITE_AUTH_REDIRECT_URI ?? 'http://localhost:3000/callback',
    logoutUri:
      import.meta.env.VITE_AUTH_LOGOUT_URI ?? 'http://localhost:3000/',
  }
}

/**
 * Cognito issuer / authority URL used by OIDC discovery and token validation.
 *
 * @param config - auth config
 * @returns {@code https://cognito-idp.{region}.amazonaws.com/{userPoolId}}
 */
export function getAuthority(config: AuthConfig): string {
  return `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`
}

/**
 * Base URL for Cognito Hosted UI authorize / token / logout endpoints.
 *
 * @param config - auth config
 * @returns {@code https://} + hosted UI host
 */
export function getHostedUiBaseUrl(config: AuthConfig): string {
  const host = config.cognitoDomain.replace(/^https?:\/\//, '')
  return `https://${host}`
}

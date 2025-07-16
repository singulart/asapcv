# AWS Secrets Manager for sensitive configuration

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.name_prefix}-jwt"
  description             = "JWT secret key for ASAP CV authentication"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-jwt-secret"
  })
}

# JWT Secret Version (initial placeholder - should be updated manually)
resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    JWT_SECRET = "CHANGE_ME_IN_AWS_CONSOLE"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Google OAuth Secrets (optional)
resource "aws_secretsmanager_secret" "google_oauth" {
  count                   = var.enable_google_oauth ? 1 : 0
  name                    = "${local.name_prefix}-google-oauth"
  description             = "Google OAuth credentials for ASAP CV"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-google-oauth"
  })
}

resource "aws_secretsmanager_secret_version" "google_oauth" {
  count     = var.enable_google_oauth ? 1 : 0
  secret_id = aws_secretsmanager_secret.google_oauth[0].id
  secret_string = jsonencode({
    GOOGLE_CLIENT_ID     = "CHANGE_ME_IN_AWS_CONSOLE"
    GOOGLE_CLIENT_SECRET = "CHANGE_ME_IN_AWS_CONSOLE"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
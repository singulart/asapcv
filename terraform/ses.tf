# Amazon SES Configuration for ASAP CV

# SES Domain Identity
resource "aws_ses_domain_identity" "main" {
  domain = var.email_domain
}

# SES Domain DKIM
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# SES Email Identity for the specific sender address
resource "aws_ses_email_identity" "sender" {
  email = "asapcv@${var.email_domain}"
}

# SES Configuration Set for tracking
resource "aws_ses_configuration_set" "main" {
  name = "${local.name_prefix}-config-set"

  delivery_options {
    tls_policy = "Require"
  }

  reputation_metrics_enabled = true
}

# SES Event Destination for CloudWatch (optional)
resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true
  matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "MessageTag"
    value_source   = "messageTag"
  }
}

# CloudWatch Log Group for SES events
resource "aws_cloudwatch_log_group" "ses_logs" {
  name              = "/aws/ses/${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ses-logs"
  })
}
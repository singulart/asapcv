# Terraform Outputs

output "dynamodb_tables" {
  description = "DynamoDB table names and ARNs"
  value = {
    users = {
      name = aws_dynamodb_table.users.name
      arn  = aws_dynamodb_table.users.arn
    }
    cvs = {
      name = aws_dynamodb_table.cvs.name
      arn  = aws_dynamodb_table.cvs.arn
    }
    job_analyses = {
      name = aws_dynamodb_table.job_analyses.name
      arn  = aws_dynamodb_table.job_analyses.arn
    }
    email_requests = {
      name = aws_dynamodb_table.email_requests.name
      arn  = aws_dynamodb_table.email_requests.arn
    }
    rate_limits = {
      name = aws_dynamodb_table.rate_limits.name
      arn  = aws_dynamodb_table.rate_limits.arn
    }
  }
}

output "s3_bucket" {
  description = "S3 bucket information"
  value = {
    name = aws_s3_bucket.cv_files.bucket
    arn  = aws_s3_bucket.cv_files.arn
  }
}

output "iam_roles" {
  description = "IAM roles for App Runner"
  value = {
    instance_role = {
      name = aws_iam_role.app_runner_instance_role.name
      arn  = aws_iam_role.app_runner_instance_role.arn
    }
    access_role = {
      name = aws_iam_role.app_runner_access_role.name
      arn  = aws_iam_role.app_runner_access_role.arn
    }
  }
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "app_runner_service" {
  description = "App Runner service information"
  value = {
    service_arn = aws_apprunner_service.backend.arn
    service_id  = aws_apprunner_service.backend.service_id
    service_url = aws_apprunner_service.backend.service_url
    status      = aws_apprunner_service.backend.status
  }
}

output "ecr_repository" {
  description = "ECR repository information"
  value = {
    repository_url = aws_ecr_repository.backend.repository_url
    registry_id    = aws_ecr_repository.backend.registry_id
  }
}

output "bedrock_configuration" {
  description = "Bedrock model configuration"
  value = {
    models = local.bedrock_models
    log_group = aws_cloudwatch_log_group.bedrock_logs.name
    available_models = data.aws_bedrock_foundation_models.available.model_summaries
  }
}

output "secrets_manager" {
  description = "Secrets Manager resources"
  value = {
    jwt_secret_arn = aws_secretsmanager_secret.jwt_secret.arn
    jwt_secret_name = aws_secretsmanager_secret.jwt_secret.name
  }
}

output "ses_configuration" {
  description = "SES configuration"
  value = {
    domain_identity = aws_ses_domain_identity.main.domain
    email_identity = aws_ses_email_identity.sender.email
    configuration_set = aws_ses_configuration_set.main.name
    dkim_tokens = aws_ses_domain_dkim.main.dkim_tokens
  }
}
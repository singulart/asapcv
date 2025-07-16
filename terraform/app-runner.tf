# AWS App Runner Service for ASAP CV Backend

# ECR Repository for the backend container
resource "aws_ecr_repository" "backend" {
  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend-ecr"
  })
}

# ECR Repository Policy
resource "aws_ecr_repository_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAppRunnerAccess"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetAuthorizationToken"
        ]
      }
    ]
  })
}

# App Runner VPC Connector (optional - for VPC access)
resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${local.name_prefix}-vpc-connector"
  subnets           = var.vpc_subnet_ids
  security_groups   = var.vpc_security_group_ids

  tags = local.common_tags

  # Only create if VPC configuration is provided
  count = length(var.vpc_subnet_ids) > 0 ? 1 : 0
}

# App Runner Service
resource "aws_apprunner_service" "backend" {
  service_name = var.app_runner_service_name

  source_configuration {
    auto_deployments_enabled = true
    
    image_repository {
      image_identifier      = "${aws_ecr_repository.backend.repository_url}:latest"
      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV                    = var.environment
          AWS_REGION                 = var.aws_region
          DYNAMODB_TABLE_PREFIX      = local.name_prefix
          S3_BUCKET_NAME             = aws_s3_bucket.cv_files.bucket
          S3_REGION                  = var.aws_region
          BEDROCK_REGION             = var.aws_region
          BEDROCK_MODEL_JOB_ANALYSIS = "anthropic.claude-3-haiku-20240307-v1:0"
          BEDROCK_MODEL_CV_TAILORING = "anthropic.claude-3-sonnet-20240229-v1:0"
          SES_REGION                 = var.aws_region
          SES_FROM_EMAIL             = "asapcv@${var.email_domain}"
          RATE_LIMIT_WINDOW_SECONDS  = "15"
          RATE_LIMIT_MAX_REQUESTS    = "1"
        }
        runtime_environment_secrets = merge(
          {
            JWT_SECRET = aws_secretsmanager_secret.jwt_secret.arn
          },
          var.enable_google_oauth ? {
            GOOGLE_CREDENTIALS     = aws_secretsmanager_secret.google_oauth[0].arn
          } : {}
        )
      }
      image_repository_type = "ECR"
    }
    
    # Authentication configuration for ECR access
    authentication_configuration {
      access_role_arn = aws_iam_role.app_runner_access_role.arn
    }
  }

  instance_configuration {
    cpu               = var.app_runner_cpu
    memory            = var.app_runner_memory
    instance_role_arn = aws_iam_role.app_runner_instance_role.arn
  }

  # VPC configuration (optional)
  dynamic "network_configuration" {
    for_each = length(var.vpc_subnet_ids) > 0 ? [1] : []
    content {
      egress_configuration {
        egress_type       = "VPC"
        vpc_connector_arn = aws_apprunner_vpc_connector.main[0].arn
      }
    }
  }

  health_check_configuration {
    healthy_threshold   = 1
    interval            = 10
    path                = "/health"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 5
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.backend.arn

  tags = merge(local.common_tags, {
    Name = var.app_runner_service_name
  })

  depends_on = [
    aws_iam_role_policy_attachment.app_runner_dynamodb,
    aws_iam_role_policy_attachment.app_runner_s3,
    aws_iam_role_policy_attachment.app_runner_bedrock,
    aws_iam_role_policy_attachment.app_runner_ses
  ]
}

# App Runner Auto Scaling Configuration
resource "aws_apprunner_auto_scaling_configuration_version" "backend" {
  auto_scaling_configuration_name = "${local.name_prefix}-autoscaling"

  max_concurrency = var.app_runner_max_concurrency
  max_size        = var.app_runner_max_size
  min_size        = var.app_runner_min_size

  tags = local.common_tags
}

# Custom Domain (optional)
resource "aws_apprunner_custom_domain_association" "backend" {
  count           = var.custom_domain_name != "" ? 1 : 0
  domain_name     = var.custom_domain_name
  service_arn     = aws_apprunner_service.backend.arn
  enable_www_subdomain = false
}
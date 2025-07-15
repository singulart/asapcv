# Amazon Bedrock Configuration for ASAP CV

# Note: Bedrock foundation models must be enabled manually in the AWS Console
# or via AWS CLI before they can be used. Terraform doesn't currently support
# enabling foundation models directly.

# Data source to check if Bedrock models are available
data "aws_bedrock_foundation_models" "available" {
  by_provider = "anthropic"
}

# Local values for Bedrock model configurations
locals {
  bedrock_models = {
    job_analysis = {
      model_id = "anthropic.claude-3-haiku-20240307-v1:0"
      name     = "Claude 3 Haiku"
      use_case = "Job description analysis and keyword extraction"
    }
    cv_tailoring = {
      model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
      name     = "Claude 3 Sonnet"
      use_case = "CV content tailoring and optimization"
    }
    embeddings = {
      model_id = "amazon.titan-embed-text-v1"
      name     = "Titan Text Embeddings"
      use_case = "Text similarity and semantic search"
    }
  }
}

# CloudWatch Log Group for Bedrock model invocations (optional)
resource "aws_cloudwatch_log_group" "bedrock_logs" {
  name              = "/aws/bedrock/${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-bedrock-logs"
  })
}

# Bedrock Model Invocation Logging Configuration (optional)
resource "aws_bedrock_model_invocation_logging_configuration" "main" {
  logging_config {
    cloudwatch_config {
      log_group_name = aws_cloudwatch_log_group.bedrock_logs.name
      role_arn       = aws_iam_role.bedrock_logging_role.arn
    }
    embedding_data_delivery_enabled = true
    image_data_delivery_enabled     = false
    text_data_delivery_enabled      = true
  }
}

# IAM Role for Bedrock Logging
resource "aws_iam_role" "bedrock_logging_role" {
  name = "${local.name_prefix}-bedrock-logging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Bedrock Logging
resource "aws_iam_policy" "bedrock_logging_policy" {
  name        = "${local.name_prefix}-bedrock-logging-policy"
  description = "Policy for Bedrock model invocation logging"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.bedrock_logs.arn}:*"
      }
    ]
  })

  tags = local.common_tags
}

# Attach logging policy to Bedrock logging role
resource "aws_iam_role_policy_attachment" "bedrock_logging" {
  role       = aws_iam_role.bedrock_logging_role.name
  policy_arn = aws_iam_policy.bedrock_logging_policy.arn
}
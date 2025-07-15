# IAM Roles and Policies for ASAP CV

# App Runner Instance Role
resource "aws_iam_role" "app_runner_instance_role" {
  name = "${local.name_prefix}-app-runner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${local.name_prefix}-dynamodb-policy"
  description = "Policy for DynamoDB access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.cvs.arn,
          aws_dynamodb_table.job_analyses.arn,
          aws_dynamodb_table.email_requests.arn,
          aws_dynamodb_table.rate_limits.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          "${aws_dynamodb_table.cvs.arn}/index/*",
          "${aws_dynamodb_table.job_analyses.arn}/index/*",
          "${aws_dynamodb_table.email_requests.arn}/index/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Policy for S3 access
resource "aws_iam_policy" "s3_policy" {
  name        = "${local.name_prefix}-s3-policy"
  description = "Policy for S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cv_files.arn,
          "${aws_s3_bucket.cv_files.arn}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Policy for Amazon Bedrock access
resource "aws_iam_policy" "bedrock_policy" {
  name        = "${local.name_prefix}-bedrock-policy"
  description = "Policy for Amazon Bedrock access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.titan-embed-text-v1"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Policy for SES access
resource "aws_iam_policy" "ses_policy" {
  name        = "${local.name_prefix}-ses-policy"
  description = "Policy for SES access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = "asapcv@${var.email_domain}"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to the App Runner instance role
resource "aws_iam_role_policy_attachment" "app_runner_dynamodb" {
  role       = aws_iam_role.app_runner_instance_role.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_runner_s3" {
  role       = aws_iam_role.app_runner_instance_role.name
  policy_arn = aws_iam_policy.s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_runner_bedrock" {
  role       = aws_iam_role.app_runner_instance_role.name
  policy_arn = aws_iam_policy.bedrock_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_runner_ses" {
  role       = aws_iam_role.app_runner_instance_role.name
  policy_arn = aws_iam_policy.ses_policy.arn
}

# App Runner Access Role (for ECR access)
resource "aws_iam_role" "app_runner_access_role" {
  name = "${local.name_prefix}-app-runner-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach ECR access policy to App Runner access role
resource "aws_iam_role_policy_attachment" "app_runner_ecr_access" {
  role       = aws_iam_role.app_runner_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}
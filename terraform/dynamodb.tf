# DynamoDB Tables for ASAP CV

# Users Table
resource "aws_dynamodb_table" "users" {
  name           = "${local.name_prefix}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Global Secondary Index for email lookups
  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-users"
  })
}

# CVs Table
resource "aws_dynamodb_table" "cvs" {
  name           = "${local.name_prefix}-cvs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "cvId"

  attribute {
    name = "cvId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index for user CV lookups
  global_secondary_index {
    name            = "UserCVsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cvs"
  })
}

# Job Analyses Table
resource "aws_dynamodb_table" "job_analyses" {
  name           = "${local.name_prefix}-job-analyses"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "jobId"

  attribute {
    name = "jobId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index for user job analyses
  global_secondary_index {
    name            = "UserJobsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-job-analyses"
  })
}

# Email Requests Table
resource "aws_dynamodb_table" "email_requests" {
  name           = "${local.name_prefix}-email-requests"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "requestId"

  attribute {
    name = "requestId"
    type = "S"
  }

  attribute {
    name = "userEmail"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index for user email requests
  global_secondary_index {
    name            = "UserEmailsIndex"
    hash_key        = "userEmail"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # TTL for automatic cleanup of old requests (30 days)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-email-requests"
  })
}

# Rate Limits Table
resource "aws_dynamodb_table" "rate_limits" {
  name           = "${local.name_prefix}-rate-limits"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  range_key      = "endpoint"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "endpoint"
    type = "S"
  }

  # TTL for automatic cleanup of rate limit records
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rate-limits"
  })
}
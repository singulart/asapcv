locals  {
  source_bucket    = aws_s3_bucket.cv_files.bucket
  dynamodb_table   = aws_dynamodb_table.cvs.arn
  jobmap_table_arn = aws_dynamodb_table.cvid_textract_jobs.arn
}

# DynamoDB table for JobId → cvId mapping
resource "aws_dynamodb_table" "cvid_textract_jobs" {
  name         = "cvid-textract-jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "jobId"

  attribute {
    name = "jobId"
    type = "S"
  }
}

# SNS Topic
resource "aws_sns_topic" "textract_complete" {
  name = "textract-complete-topic"
}

# IAM role for Textract to publish to SNS
resource "aws_iam_role" "textract_sns_publish" {
  name = "textract_publish_to_sns"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "textract.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "textract_sns_publish_policy" {
  name = "textract_publish_policy"
  role = aws_iam_role.textract_sns_publish.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Action = ["sns:Publish"],
      Resource = aws_sns_topic.textract_complete.arn
    }]
  })
}

# IAM role for start_textract_lambda
resource "aws_iam_role" "start_lambda_exec" {
  name = "start-textract-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "start_lambda_policy" {
  name = "start-textract-policy"
  role = aws_iam_role.start_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["textract:StartDocumentTextDetection"],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = ["s3:GetObject", "s3:GetObjectTagging", "s3:GetObjectAttributes"],
        Resource = "arn:aws:s3:::${local.source_bucket}/cvs/*"
      },
      {
        Effect = "Allow",
        Action = ["dynamodb:PutItem"],
        Resource = local.jobmap_table_arn
      },
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# IAM role for complete_textract_lambda
resource "aws_iam_role" "complete_lambda_exec" {
  name = "complete-textract-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "complete_lambda_policy" {
  name = "complete-textract-policy"
  role = aws_iam_role.complete_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["textract:GetDocumentTextDetection"],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = ["dynamodb:GetItem"],
        Resource = local.jobmap_table_arn
      },
      {
        Effect = "Allow",
        Action = ["dynamodb:PutItem"],
        Resource = local.dynamodb_table
      },
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# start_textract_lambda
resource "aws_lambda_function" "start_textract" {
  function_name = "start_textract_lambda"
  role          = aws_iam_role.start_lambda_exec.arn
  s3_bucket     = "argorand-lambdas-repository"
  s3_key        = "start_textract_lambda.zip"
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 30

  environment {
    variables = {
      SNS_TOPIC_ARN       = aws_sns_topic.textract_complete.arn
      TEXTRACT_ROLE_ARN   = aws_iam_role.textract_sns_publish.arn
      JOBMAP_TABLE_NAME   = aws_dynamodb_table.cvid_textract_jobs.name
    }
  }
}

# complete_textract_lambda
resource "aws_lambda_function" "complete_textract" {
  function_name = "complete_textract_lambda"
  role          = aws_iam_role.complete_lambda_exec.arn
  s3_bucket     = "argorand-lambdas-repository"
  s3_key        = "complete_textract_lambda.zip"
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60

  environment {
    variables = {
      JOBMAP_TABLE_NAME = aws_dynamodb_table.cvid_textract_jobs.name
    }
  }
}

# Allow SNS to invoke complete_textract_lambda
resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.complete_textract.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.textract_complete.arn
}

# SNS subscription
resource "aws_sns_topic_subscription" "sns_to_lambda" {
  topic_arn = aws_sns_topic.textract_complete.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.complete_textract.arn
}

# S3 Notification → start_textract_lambda
resource "aws_s3_bucket_notification" "s3_lambda_trigger" {
  bucket = local.source_bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.start_textract.arn
    events     = ["s3:ObjectCreated:*"]
    filter_prefix = "cvs/"
  }

  depends_on = [
    aws_lambda_permission.allow_s3
  ]
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.start_textract.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${local.source_bucket}"
}
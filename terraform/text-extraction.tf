locals  {
  source_bucket    = aws_s3_bucket.cv_files.bucket
  dynamodb_table   = aws_dynamodb_table.cvs.arn
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ECR Repository for the docling Lambda container
resource "aws_ecr_repository" "docling" {
  name                 = "${local.name_prefix}-docling"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-docling"
  })
}

# ECR Repository Policy
resource "aws_ecr_repository_policy" "docling" {
  repository = aws_ecr_repository.docling.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAppRunnerAccess"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
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


resource "aws_efs_file_system" "docling_models" {
  creation_token = "docling-models"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_7_DAYS"
  }

  tags = {
    Name = "docling-models"
  }
}

resource "aws_efs_access_point" "docling_models_ap" {
  file_system_id = aws_efs_file_system.docling_models.id

  posix_user {
    uid = 1000
    gid = 1000
  }

  root_directory {
    path = "/docling"
    creation_info {
      owner_uid   = 1000
      owner_gid   = 1000
      permissions = "755"
    }
  }
}

resource "aws_security_group" "efs_sg" {
  name   = "efs-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "lambda_sg" {
  name   = "lambda-sg"
  vpc_id = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_efs_mount_target" "docling" {
  for_each        = toset(data.aws_subnets.default.ids)
  file_system_id  = aws_efs_file_system.docling_models.id
  subnet_id       = each.key
  security_groups = [aws_security_group.efs_sg.id]
}

# IAM role for docling_lambda
resource "aws_iam_role" "docling_lambda_exec" {
  name = "docling-lambda-exec"

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

resource "aws_iam_role_policy" "docling_lambda_policy" {
  name = "docling-policy"
  role = aws_iam_role.docling_lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["s3:GetObject", "s3:GetObjectTagging", "s3:GetObjectAttributes"],
        Resource = "arn:aws:s3:::${local.source_bucket}/cvs/*"
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

# docling Lambda
resource "aws_lambda_function" "docling" {
  function_name = "docling"
  role          = aws_iam_role.docling_lambda_exec.arn
  package_type  = "Image"
  image_uri     = "794689098735.dkr.ecr.us-east-1.amazonaws.com/asap-cv-dev-docling:latest"
  timeout     = 120
  memory_size = 2048
  architectures = ["arm64"]

  file_system_config {
    arn              = aws_efs_access_point.docling_models_ap.arn
    local_mount_path = "/mnt/docling-models"
  }

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}

# VPC endpoints 
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = data.aws_vpc.default.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = data.aws_vpc.default.main_route_table_id[*] 
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id             = data.aws_vpc.default.id
  service_name       = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type  = "Gateway"
  route_table_ids    = data.aws_vpc.default.main_route_table_id[*]
}

# S3 Notification → docling lambda
resource "aws_s3_bucket_notification" "s3_lambda_trigger" {
  bucket = local.source_bucket

  lambda_function {
    lambda_function_arn = aws_lambda_function.docling.arn
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
  function_name = aws_lambda_function.docling.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${local.source_bucket}"
}

resource "aws_iam_role_policy" "lambda_efs_access" {
  name = "lambda-efs-access"
  role = aws_iam_role.docling_lambda_exec.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess"
        ],
        Resource = aws_efs_access_point.docling_models_ap.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.docling_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.docling_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
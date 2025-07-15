# S3 Bucket for CV file storage

# S3 Bucket
resource "aws_s3_bucket" "cv_files" {
  bucket = "${local.name_prefix}-cv-files"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cv-files"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "cv_files" {
  bucket = aws_s3_bucket.cv_files.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cv_files" {
  bucket = aws_s3_bucket.cv_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "cv_files" {
  bucket = aws_s3_bucket.cv_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "cv_files" {
  bucket = aws_s3_bucket.cv_files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE"]
    allowed_origins = [
      "http://localhost:4200",
      "https://*.${var.domain_name}",
      "https://${var.domain_name}"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "cv_files" {
  bucket = aws_s3_bucket.cv_files.id

  rule {
    id     = "delete_old_versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "delete_incomplete_multipart_uploads"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
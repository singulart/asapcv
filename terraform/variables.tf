# Variables for ASAP CV Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "asap-cv"
}

variable "app_runner_service_name" {
  description = "Name for the App Runner service"
  type        = string
  default     = "asap-cv-api"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "argorand.io"
}

variable "email_domain" {
  description = "Email domain for SES"
  type        = string
  default     = "argorand.io"
}

# Local values for consistent naming
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
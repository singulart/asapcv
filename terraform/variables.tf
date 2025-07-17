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
  default     = "asap-cv"
}

variable "app_runner_cpu" {
  description = "CPU units for App Runner service (0.25 vCPU, 0.5 vCPU, 1 vCPU, 2 vCPU, 4 vCPU)"
  type        = string
  default     = "0.25 vCPU"
}

variable "app_runner_memory" {
  description = "Memory for App Runner service (0.5 GB, 1 GB, 2 GB, 3 GB, 4 GB, 6 GB, 8 GB, 10 GB, 12 GB)"
  type        = string
  default     = "0.5 GB"
}

variable "app_runner_max_concurrency" {
  description = "Maximum number of concurrent requests per instance"
  type        = number
  default     = 100
}

variable "app_runner_max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "app_runner_min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "custom_domain_name" {
  description = "Custom domain name for the App Runner service (optional)"
  type        = string
  default     = "asapcv.argorand.io"
}

variable "vpc_subnet_ids" {
  description = "VPC subnet IDs for App Runner VPC connector (optional)"
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "VPC security group IDs for App Runner VPC connector (optional)"
  type        = list(string)
  default     = []
}

variable "enable_google_oauth" {
  description = "Enable Google OAuth integration"
  type        = bool
  default     = true
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
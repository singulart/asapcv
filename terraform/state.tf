terraform {
  backend "s3" {
    bucket         = "asap-cv-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
  }
}
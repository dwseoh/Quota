provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "main" {
  identifier           = "fintech-core-db"
  allocated_storage    = 1000
  storage_type         = "io1"
  iops                 = 30000
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.r5.24xlarge"
  name                 = "fintech"
  username             = "admin"
  password             = "securepassword"
  skip_final_snapshot  = true
}

resource "aws_instance" "app_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p4d.24xlarge"
  
  tags = {
    Name = "RiskAnalyzer-Worker"
  }
}

resource "aws_cloudwatch_log_group" "app_logs" {
  name = "/aws/lambda/fintech-logs"
  retention_in_days = 0 
}

# Flaw: NAT Gateway for every subnet instead of shared
resource "aws_nat_gateway" "ngw_1" {
    # ...
}

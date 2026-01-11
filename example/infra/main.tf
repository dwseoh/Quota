resource "aws_instance" "app_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  
  # FLAW: Extremely expensive instance type (~$32/hr)
  instance_type = "ml.p4d.24xlarge" 

  tags = {
    Name = "ExampleAppServerInstance"
  }
}

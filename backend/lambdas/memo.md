# Manual step to download docling models

Because `docling` Lambda function sits in a VPC without a NAT gateway, it can't download anything from the open internet. Deploying a NAT just for this purpose is not worth it: NAT is billed by the hour. That said, an alternative would be a manual pre-download of Huggingface models from the EC2 that has internet connectivity.

Example list of commands to run:

```sh

sudo yum install -y amazon-efs-utils
sudo mkdir -p /mnt/docling-models
sudo mount -t efs -o tls,accesspoint=fsap-<access point ID> fs-<my EFS id>.efs.us-east-1.amazonaws.com:/ /mnt/docling-models
sudo yum install -y python3-pip
python3 -m pip install docling

docling-tools models download

mv /home/ec2-user/.cache/* /mnt/docling-models/

```





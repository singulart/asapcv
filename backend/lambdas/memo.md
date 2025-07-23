# Manual step to download docling models

Because `docling` Lambda function sits in a VPC without a NAT gateway, it can't download anything from the open internet. Deploying a NAT just for this purpose is not worth it: NAT is billed by the hour. That said, an alternative would be a manual pre-download of Huggingface models from the EC2 that has internet connectivity.

Example list of commands to run:

```sh

sudo yum install -y amazon-efs-utils
sudo mkdir -p /mnt/docling-models
sudo mount -t efs -o tls fs-<my EFS id>.efs.us-east-1.amazonaws.com:/ /mnt/docling-models
export HUGGINGFACE_HUB_CACHE=/mnt/docling-models
sudo yum install -y python3-pip
python3 -m pip install huggingface_hub

sudo -E python3 -c "from huggingface_hub import snapshot_download; snapshot_download('ds4sd/CodeFormula')"
sudo -E python3 -c "from huggingface_hub import snapshot_download; snapshot_download('ds4sd/docling-layout-old')"
sudo -E python3 -c "from huggingface_hub import snapshot_download; snapshot_download('ds4sd/docling-models')"
sudo -E python3 -c "from huggingface_hub import snapshot_download; snapshot_download('ds4sd/DocumentFigureClassifier')"
sudo -E python3 -c "from huggingface_hub import snapshot_download; snapshot_download('qualcomm/EasyOcr')"
sudo ls -al /mnt/docling-models/docling/
sudo ls -al /mnt/docling-models/

sudo mkdir /mnt/docling-models/docling/models
sudo mv /mnt/docling-models/models--* /mnt/docling-models/docling/models/
sudo ls -al /mnt/docling-models/docling/models/

```





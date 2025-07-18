import json
import os
import boto3
from urllib.parse import unquote_plus

s3 = boto3.client('s3')
textract = boto3.client('textract')

SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
TEXTRACT_ROLE_ARN = os.environ['TEXTRACT_ROLE_ARN']

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))

    # Extract object details
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])

    # Get object metadata (to get cvID)
    head = s3.head_object(Bucket=bucket, Key=key)
    metadata = head.get('Metadata', {})
    cv_id = metadata.get('cvid')

    if not cv_id:
        raise ValueError("Missing required metadata field: x-amz-meta-cvid")

    print(f"Starting Textract job for key: {key}, cvID: {cv_id}")

    # Start async Textract text detection job
    response = textract.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        },
        NotificationChannel={
            'RoleArn': TEXTRACT_ROLE_ARN,
            'SNSTopicArn': SNS_TOPIC_ARN
        },
        ClientRequestToken=cv_id
    )

    print("Started Textract job:", response['JobId'])

    return {
        'statusCode': 200,
        'body': json.dumps({'jobId': response['JobId'], 'cvId': cv_id})
    }
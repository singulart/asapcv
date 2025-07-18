import json
import boto3
import os

textract = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')

DDB_TABLE_NAME = 'asap-cv-dev-cvs'

def lambda_handler(event, context):
    print("Received SNS event:", json.dumps(event))

    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        job_id = message.get('JobId')
        status = message.get('Status')
        cv_id = message.get('ClientRequestToken')

        print(f"Textract JobId: {job_id}, Status: {status}, cvID: {cv_id}")

        if status != 'SUCCEEDED':
            print(f"Textract job {job_id} failed with status {status}")
            continue

        # Paginate through Textract results
        full_text = []
        next_token = None
        while True:
            if next_token:
                response = textract.get_document_text_detection(JobId=job_id, NextToken=next_token)
            else:
                response = textract.get_document_text_detection(JobId=job_id)

            blocks = response.get('Blocks', [])
            for block in blocks:
                if block['BlockType'] == 'LINE':
                    full_text.append(block['Text'])

            next_token = response.get('NextToken')
            if not next_token:
                break

        combined_text = '\n'.join(full_text)
        print(f"Extracted text for cvID {cv_id}:\n{combined_text[:500]}...")  # Truncate log

        # Write to DynamoDB
        table = dynamodb.Table(DDB_TABLE_NAME)
        table.put_item(
            Item={
                'cvId': cv_id,
                'text': combined_text
            }
        )

    return {'statusCode': 200}
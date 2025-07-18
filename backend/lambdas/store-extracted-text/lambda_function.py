import json
import boto3
import os

textract = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')

CV_TABLE_NAME = 'asap-cv-dev-cvs'
JOBMAP_TABLE_NAME = os.environ['JOBMAP_TABLE_NAME']

def lambda_handler(event, context):
    print("Received SNS event:", json.dumps(event))

    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        job_id = message.get('JobId')
        status = message.get('Status')

        print(f"Textract JobId: {job_id}, Status: {status}")

        if status != 'SUCCEEDED':
            print(f"Textract job {job_id} failed with status {status}")
            continue

        # Lookup cvId from jobId mapping table
        jobmap_table = dynamodb.Table(JOBMAP_TABLE_NAME)
        mapping_response = jobmap_table.get_item(Key={'jobId': job_id})

        if 'Item' not in mapping_response:
            print(f"No cvId mapping found for jobId {job_id}")
            continue

        cv_id = mapping_response['Item']['cvId']
        print(f"Found cvId: {cv_id}")

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

        # Write to final CV table
        cv_table = dynamodb.Table(CV_TABLE_NAME)
        cv_table.put_item(
            Item={
                'cvId': cv_id,
                'text': combined_text
            }
        )

    return {'statusCode': 200}
import os
import sys
import json
import logging
import boto3
import tempfile
from urllib.parse import unquote_plus
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)


s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

CV_TABLE_NAME = 'asap-cv-dev-cvs'
MODEL_DIR = "/mnt/docling-models"

def lambda_handler(event, context):

    print("Received event:", json.dumps(event))

    # Extract object details from S3 event
    record = event['Records'][0]
    bucket = record['s3']['bucket']['name']
    key = unquote_plus(record['s3']['object']['key'])

    # Get object metadata to extract cvId
    head = s3.head_object(Bucket=bucket, Key=key)
    metadata = head.get('Metadata', {})
    cv_id = metadata.get('cvid')

    if not cv_id:
        raise ValueError("Missing required metadata field: x-amz-meta-cvid")

    # Download the file to a temporary path
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        s3.download_fileobj(bucket, key, tmp_file)
        local_path = tmp_file.name

    print(f"Downloaded file to {local_path}, processing with docling...")

    # Run docling to extract Markdown
    try:
        pipeline_options = PdfPipelineOptions(artifacts_path=f"{MODEL_DIR}/docling/models/")
        pipeline_options.do_ocr = False
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
                InputFormat.DOCX: WordFormatOption(pipeline_options=pipeline_options)
            }
        )
        doc = converter.convert(local_path).document
        markdown_text = doc.export_to_markdown()
        print(markdown_text)

        print(f"Extracted Markdown content (first 500 chars):\n{markdown_text[:500]}")

        # Save to DynamoDB
        cv_table = dynamodb.Table(CV_TABLE_NAME)
        cv_table.put_item(Item={
            'cvId': cv_id,
            'text': markdown_text
        })

        print(f"Saved extracted content to DynamoDB for cvId: {cv_id}")
        
    except Exception as e:
        print(f"docling failed to extract from {key}: {e}")
        raise


    return {
        'statusCode': 200,
        'body': json.dumps({'cvId': cv_id})
    }

### ---------- Builder Stage ----------
FROM python:3.13-slim AS builder

# Install build tools and system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libffi-dev \
    libssl-dev \
    python3-dev \
    curl

WORKDIR /build

RUN pip install --upgrade pip \
 && pip install --target python/ docling


### ---------- Final Stage ----------
FROM public.ecr.aws/lambda/python:3.13 AS production

ENV PYTHONPATH="/opt/python"

COPY --from=builder /build/python /opt/python

COPY app/ ./app/

# https://github.com/DiscreteTom/onnx-on-aws-lambda-arm64/blob/main/hello_world/Dockerfile
COPY patch.txt /sys/devices/system/cpu/possible
COPY patch.txt /sys/devices/system/cpu/present

CMD ["app.lambda_function.lambda_handler"]

FROM python:3.9-slim

ENV PYTHONUNBUFFERED 1
EXPOSE 8000
WORKDIR /imf_explorer
# Copy requirements from host, to docker container in /app
COPY ./requirements.txt .
# Copy everything from ./src directory to /app in the container
COPY ./ ./

RUN pip install uvicorn
RUN pip install requests
RUN pip install fastapi
RUN pip install pandas
# Run the application in the port 8000
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "imf_explorer.api.app:app"]
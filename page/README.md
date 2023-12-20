# Page for receiving detection data

This is a code for server used in capturing detections from drone.

### Run

```bash
docker-compose up
```

Then connect to page through localhost:3000 if you ran it locally or host:3000 if it's ran on a server.

### Usage

To reset DB send a GET request to a `reset-db` endpoint.

To add new detection send a POST request to `/detection` endpoint.
In body of this request should be a JSON that follows this structure:

```JSON
{
    "timestamp": 123456789,
    "latidude": 120.0,
    "longitude": 50.0,
    "image": "ouioewihuoihguoihg=="
}
```

Field `image` is a base64 encoded image.
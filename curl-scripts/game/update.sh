#!/bin/bash

API="http://localhost:4741"
URL_PATH="/games"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
--header "Authorization: Bearer ${TOKEN}" \
--data '{
    "game": {
      "text": "'"${TEXT}"'"
    }
  }'

echo

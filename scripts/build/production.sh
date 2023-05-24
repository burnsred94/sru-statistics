#!/bin/sh

# check for env values
if [ -z ${INFRA_API_IMAGE_TAG+x} ];
then echo "env not provided; do not call this script directly."; exit;
fi

# executing
BUILD_TAG=${BUILD_TAG:-$INFRA_API_IMAGE_TAG}
echo "<<RUNNING PRODUCTION BUILD>>>
    📦 ${INFRA_API_IMAGE} with tag ${BUILD_TAG}"


docker build \
    -t $INFRA_API_APP_IMAGE:$(date +%F-%H) \
    -t $INFRA_API_APP_IMAGE:$BUILD_TAG \
    --progress=plain \
    -f $INFRA_API_PATH/Dockerfile $INFRA_API_PATH/

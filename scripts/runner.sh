echo "START RUNNER"

load_prod_env () {
  PWD_ENV=$PWD/envs
  . $PWD_ENV/.production.env
}

run_api_dev () {
echo "RUNNING API DEVELOPMENT"
 docker compose up --build -d
}



run_api_prod () {
  echo "RUNNING API PRODUCATION"
  docker stop $INFRA_API_APP
  sh builder.sh api:prod && 
  docker run \
  --rm \
  --name $INFRA_API_APP \
  -d \
  -p $INFRA_API_PORT:$INFRA_API_PORT \
  -t $INFRA_API_APP_IMAGE 

  docker container prune

}

_PARAM_TARGET=$1

case $_PARAM_TARGET in
  "dev") run_api_dev;;
  "prod") load_prod_env; run_api_prod;;
  *)
esac
#!/bin/sh

load_dev_env () {
  PWD_ENV=$PWD/envs
  . $PWD_ENV/.development.env
  echo "Loaded development environment successfully"
}

load_prod_env () {
  PWD_ENV=$PWD/envs
  . $PWD_ENV/.production.env
  echo "Load productin environment successfully"
}


run_api_builder_dev () {
  . build/development.sh
}

run_api_builder_prod () {
  . build/production.sh
}

_PARAM_TARGET=$1

case $_PARAM_TARGET in
  "api:dev") load_dev_env; run_api_builder_dev;;
  "api:prod") load_prod_env; run_api_builder_prod;;
  *)
esac

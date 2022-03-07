#!/usr/bin/env bash
source ~/.evoenv

# export VUE_APP_DAPIADDRESSES='["34.220.41.134", "18.236.216.191", "54.191.227.118"]'
unset VUE_APP_DAPIADDRESSES
unset VUE_APP_DPNS_CONTRACT_ID

export VUE_APP_ENV_RUN="build_testnet"
export VUE_APP_AUTOFAUCET="http://autofaucet-1.dashevo.io:5050/drip/"

node ./scripts/registerContracts.js

source ./env/datacontracts_$VUE_APP_ENV_RUN.env

echo
echo "ENV VARS"
echo
printenv | grep VUE_APP
echo


ionic build
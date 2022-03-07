# Completely reset old docker data
# docker stop $(docker ps -aq); docker rm -f -v $(docker ps -a -q); docker volume prune -f; rm -rf ~/.dashmate/

# Setup new dashmate group for local development
# dashmate setup local

# or
#  ./scripts/lib/dashmate_temporary_reset_script.sh
. ~/.evoenv

SCRIPT_DIR=$(pwd)
echo $SCRIPT_DIR
# Remove stale contractIds
rm env/registeredContracts_local.json 


cd $PLATFORM_DIR
pwd
######################
echo "Removing all docker containers and volumes..."
docker rm -f -v $(docker ps -a -q) || true

docker system prune -f --volumes

echo "Remove dashmate configuration..."
sudo rm -rf ~/.dashmate/

#####################
#yarn run setup
yarn run dashmate setup local

# chmod -R 777 ~/.dashmate
 
# Fund service account to register contracts
# 'rival estate inside turn journey charge window rhythm marble audit amateur bus'
yarn dashmate wallet:mint 10 --address=ySPRMNDVBhZVZvDS4wGn4Ujuq2wP4AcwLK --config=local_seed

# Fund testuser accounts
# Bob 'proud group frequent erase retire approve produce race wealth picnic alert pear'
yarn dashmate wallet:mint 10 --address=yR5sQ16UZ3Rpni9bqueF81bsHTkJdioSgN --config=local_seed

# HoneyBadger 'sphere ozone bachelor raise clutch mercy mansion cook teach eager sleep gadget'
yarn dashmate wallet:mint 10 --address=yTQousskoh6e2rGvThtYktzbqXc5MYuATF --config=local_seed

# 'legend chase bless great skirt street member push calm real menu flee'
yarn dashmate wallet:mint 10 --address=yUwkuzCY9U5aLTTaEenf7jnnRK9LmXAQ2o --config=local_seed

# Start dashmate
yarn dashmate group:start  --wait-for-readiness


echo "" >> ~/.evoenv
echo "export NUXT_DPNS_CONTRACT_ID=$(yarn dashmate config:get platform.dpns.contract.id --config=local_1)" >> ~/.evoenv
echo "export VUE_APP_DPNS_CONTRACT_ID=$(yarn dashmate config:get platform.dpns.contract.id --config=local_1)" >> ~/.evoenv
echo "export NUXT_DASHPAY_CONTRACT_ID=$(yarn dashmate config:get platform.dashpay.contract.id --config=local_1)" >> ~/.evoenv
echo "export VUE_APP_DASHPAY_CONTRACT_ID=$(yarn dashmate config:get platform.dashpay.contract.id --config=local_1)" >> ~/.evoenv
echo "export NUXT_DAPIADDRESSES='[\"127.0.0.1:3000\"]'" >> ~/.evoenv
echo "export VUE_APP_DAPIADDRESSES='[\"127.0.0.1:3000\"]'" >> ~/.evoenv
echo "export NUXT_MNEMONIC=\"rival estate inside turn journey charge window rhythm marble audit amateur bus\"" >> ~/.evoenv
echo "export VUE_APP_MNEMONIC=\"rival estate inside turn journey charge window rhythm marble audit amateur bus\"" >> ~/.evoenv
echo "" >> ~/.evoenv

pm2 restart autofaucet

cd $SCRIPT_DIR
pwd

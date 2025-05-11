sudo apt update
sudo apt install docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo apt install docker-compose
or sudo apt install docker-compose-plugin
docker-compose version
or docker compose version

sudo usermod -aG docker $USER
newgrp docker

docker-compose build


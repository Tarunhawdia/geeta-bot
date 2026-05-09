#!/bin/bash
sudo env PATH=$PATH:/home/tarunhawdia/.nvm/versions/node/v22.12.0/bin pm2 startup systemd -u tarunhawdia --hp /home/tarunhawdia

#!/bin/bash
scp -i ~/Downloads/ssh-key-2026-05-09\(2\).key -r \
  /home/tarunhawdia/Desktop/Projects/geetaProject/index.js \
  /home/tarunhawdia/Desktop/Projects/geetaProject/config.js \
  /home/tarunhawdia/Desktop/Projects/geetaProject/package.json \
  /home/tarunhawdia/Desktop/Projects/geetaProject/package-lock.json \
  /home/tarunhawdia/Desktop/Projects/geetaProject/services \
  /home/tarunhawdia/Desktop/Projects/geetaProject/data \
  ubuntu@92.4.92.81:~/geeta-bot/

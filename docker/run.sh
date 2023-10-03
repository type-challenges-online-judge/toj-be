#!/bin/bash

docker run --publish 3000:3000 --name toj-be --cpus 1 --memory 300mb --detach toj-be 

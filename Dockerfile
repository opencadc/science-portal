FROM gradle:8-jdk21 AS base
ARG NODE_VERSION=v22.21.0
ARG NVM_DIR=/nvm
ARG NVM_VERSION=v0.40.3

FROM base AS builder
ARG NODE_VERSION=v22.21.0
ARG NVM_DIR=/nvm
ARG NVM_VERSION=v0.40.3

RUN \
    mkdir -p ${NVM_DIR} \
    # installs nvm (Node Version Manager)
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh | bash \
    # download and install Node.js (you may need to restart the terminal)
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    # verifies the right Node.js version is in the environment
    && node -v # should print `v22.21.0` \
    # verifies the right npm version is in the environment
    && npm -v # should print `10.9.0`
COPY . /science-portal
WORKDIR /science-portal

RUN \
    . ${NVM_DIR}/nvm.sh \
    && gradle -i clean build test --no-daemon

FROM images.opencadc.org/library/cadc-tomcat:1.4 AS production

COPY --from=builder /science-portal/build/libs/science-portal.war /usr/share/tomcat/webapps/

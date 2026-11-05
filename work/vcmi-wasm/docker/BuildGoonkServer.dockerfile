FROM debian:trixie-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang cmake lld ninja-build libboost-date-time-dev libboost-filesystem-dev \
    libboost-locale-dev libboost-program-options-dev libminizip-dev \
    libsqlite3-dev libtbb-dev zlib1g-dev && rm -rf /var/lib/apt/lists/*

COPY . /src
ARG BUILD_JOBS=6
RUN cmake -S /src -B /build -G Ninja \
    -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/opt/vcmi \
    -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ \
    -DCMAKE_EXE_LINKER_FLAGS=-fuse-ld=lld -DCMAKE_SHARED_LINKER_FLAGS=-fuse-ld=lld \
    -DENABLE_HTML5_BUILD=OFF -DENABLE_CLIENT=OFF -DENABLE_LAUNCHER=OFF \
    -DENABLE_EDITOR=OFF -DENABLE_TEST=OFF -DENABLE_GITVERSION=OFF \
    -DENABLE_SERVER=ON -DENABLE_LOBBY=ON \
    && cmake --build /build --parallel "${BUILD_JOBS}" --target vcmiserver vcmilobby \
    && cmake --install /build --strip

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libboost-atomic1.83.0 libboost-chrono1.83.0t64 libboost-date-time1.83.0 libboost-filesystem1.83.0 \
    libboost-locale1.83.0 libboost-thread1.83.0 \
    libboost-program-options1.83.0 libminizip1t64 libsqlite3-0 libtbb12 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home vcmi
COPY --from=build /opt/vcmi /opt/vcmi

ENV HOME=/home/vcmi
ENV XDG_DATA_HOME=/home/vcmi/data XDG_DATA_DIRS=/game
WORKDIR /home/vcmi
USER vcmi
ENTRYPOINT ["/opt/vcmi/bin/vcmiserver"]

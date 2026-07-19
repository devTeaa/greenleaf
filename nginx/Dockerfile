# Custom nginx image — wipes the default welcome page so requests MUST route
# through our reverse-proxy config. The stock nginx:alpine image leaves
# /usr/share/nginx/html/index.html in place which can shadow proxy_pass
# when no server block explicitly matches.
FROM nginx:1.27-alpine

# Remove default static site and default config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Custom config is mounted at runtime via docker-compose volumes.

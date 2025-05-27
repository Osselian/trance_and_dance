server.host: "0.0.0.0"
server.port: 5601

server.ssl.enabled: true
server.ssl.certificate: /usr/share/kibana/config/certs/ELK.crt
server.ssl.key:         /usr/share/kibana/config/certs/ELK.key

xpack.security.encryptionKey: "4Xz2H8Lg9FmP5rQwUv3KjTn0BcYdR7Ea"
xpack.encryptedSavedObjects.encryptionKey: "4Xz2H8Lg9FmP5rQwUv3KjTn0BcYdR7Ea"
xpack.reporting.encryptionKey: "A7bC9dEf2Gh3IjKl4Mn5OpQr6StUvWxY"
xpack.reporting.kibanaServer.hostname: "localhost"

elasticsearch.hosts: ["https://elasticsearch:9200"]
elasticsearch.serviceAccountToken: "${KIBANA_SERVICE_TOKEN}"
elasticsearch.ssl.certificateAuthorities: [ "/usr/share/kibana/config/certs/rootCA.pem" ]
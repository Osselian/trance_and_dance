FROM prom/prometheus:v2.53.0

WORKDIR /etc/prometheus

COPY configs/prometheus.yml .
#COPY configs/prometheus_rules.yml .

EXPOSE 9090

#RUN /bin/promtool check rules /etc/prometheus/prometheus_rules.yml

CMD ["--config.file=/etc/prometheus/prometheus.yml", "--web.listen-address=:9090"]
# "--storage.tsdb.path=/prometheus"
# если потребуется кастовать путь вместо prometheus-data:/var/lib/prometheus

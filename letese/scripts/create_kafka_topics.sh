#!/bin/bash
# LETESE● Kafka Topic Creation Script
# Creates all 8 Kafka topics for the LETESE AIPOT system
# Usage: ./create_kafka_topics.sh [--bootstrap-server localhost:9092]
set -e

BOOTSTRAP="${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"
PARTITIONS=()

usage() {
  echo "Usage: $0 [--bootstrap-server HOST:PORT]"
  echo "  --bootstrap-server  Kafka bootstrap server (default: localhost:9092 or \$KAFKA_BOOTSTRAP_SERVERS)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --bootstrap-server)
      BOOTSTRAP="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

echo "=== LETESE● Creating Kafka Topics on ${BOOTSTRAP} ==="

# Topic definitions: name | retention_ms | partitions
# 1h = 3600000 ms, 24h = 86400000 ms, 2h = 7200000 ms, 7d = 604800000 ms
TOPICS=(
  "letese.scraper.jobs|3600000|6"
  "letese.diary.updates|86400000|3"
  "letese.orders.new|86400000|3"
  "letese.communications.dispatch|86400000|6"
  "letese.police.heartbeats|7200000|1"
  "letese.police.errors|604800000|3"
  "letese.police.metrics|604800000|1"
  "letese.build.status|604800000|1"
)

for entry in "${TOPICS[@]}"; do
  IFS='|' read -r name retention partitions <<< "$entry"
  echo "--- Creating: $name (retention=$retention ms, partitions=$partitions) ---"
  kafka-topics.sh \
    --bootstrap-server "$BOOTSTRAP" \
    --create \
    --topic "$name" \
    --partitions "$partitions" \
    --replication-factor 1 \
    --config retention.ms="$retention" \
    || echo "Topic $name may already exist (skipping)"
done

echo ""
echo "=== Topic List ==="
kafka-topics.sh --bootstrap-server "$BOOTSTRAP" --list | grep letese

echo ""
echo "=== Done ==="

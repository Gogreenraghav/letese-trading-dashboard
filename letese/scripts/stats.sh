#!/bin/bash
echo "LETESE Project Statistics"
echo "========================"
echo ""
echo "Files by type:"
find /root/clawd/letese -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20
echo ""
echo "Files by frontend app:"
for dir in flutter_app super-admin customer-admin landing; do
    count=$(find /root/clawd/letese/frontend/$dir -type f 2>/dev/null | wc -l)
    echo "  $dir: $count files"
done
echo ""
echo "Backend Python files: $(find /root/clawd/letese/backend -name '*.py' | wc -l)"
echo "Test files: $(find /root/clawd/letese/backend/tests -name 'test_*.py' | wc -l)"
echo "K8s manifests: $(find /root/clawd/letese/infrastructure/k8s -name '*.yaml' | wc -l)"
echo "Contracts: $(find /root/clawd/letese/contracts -name '*.json' | wc -l)"
echo ""
echo "Total files: $(find /root/clawd/letese -type f | wc -l)"

#!/bin/bash

# Script de test des endpoints après déploiement du sharding
# Usage: ./scripts/test-sharded-endpoints.sh [API_BASE_URL]
# Exemple: ./scripts/test-sharded-endpoints.sh https://api.example.com

API_BASE_URL="${1:-http://localhost:3000}"

echo "🧪 Test des endpoints avec sharding"
echo "API Base URL: $API_BASE_URL"
echo ""

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction helper pour tester un endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    echo -n "Test: $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK (${http_code})${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL (${http_code}, attendu ${expected_status})${NC}"
        echo "  Response: $body" | head -c 200
        echo ""
        return 1
    fi
}

# Tests
tests_passed=0
tests_failed=0

# Test 1: Get account by PUUID (si un PUUID est connu)
echo "1. Test de récupération d'un compte par PUUID"
if test_endpoint \
    "GET /api/league-accounts/get-by-puuid" \
    "POST" \
    "$API_BASE_URL/api/league-accounts/get-by-puuid" \
    '{"puuid": "test-puuid-12345"}' \
    "404"; then
    ((tests_passed++))
else
    ((tests_failed++))
fi
echo ""

# Test 2: Search summoners
echo "2. Test de recherche de summoners"
if test_endpoint \
    "POST /api/search/summoners" \
    "POST" \
    "$API_BASE_URL/api/search/summoners" \
    '{"query": "test", "limit": 10}' \
    "200"; then
    ((tests_passed++))
else
    ((tests_failed++))
fi
echo ""

# Test 3: Get account details (Riot API endpoint)
echo "3. Test de récupération des détails d'un compte Riot"
if test_endpoint \
    "POST /api/riot/get-account-details" \
    "POST" \
    "$API_BASE_URL/api/riot/get-account-details" \
    '{"puuid": "test-puuid", "region": "euw1"}' \
    "404"; then
    ((tests_passed++))
else
    ((tests_failed++))
fi
echo ""

# Test 4: Champion leadership
echo "4. Test du leadership des champions"
if test_endpoint \
    "GET /api/champions/[championId]/leadership" \
    "GET" \
    "$API_BASE_URL/api/champions/Aatrox/leadership" \
    "" \
    "200"; then
    ((tests_passed++))
else
    ((tests_failed++))
fi
echo ""

# Test 5: Admin stats
echo "5. Test des statistiques admin"
if test_endpoint \
    "GET /api/admin/stats" \
    "GET" \
    "$API_BASE_URL/api/admin/stats" \
    "" \
    "200"; then
    ((tests_passed++))
else
    ((tests_failed++))
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Résumé des tests:"
echo -e "  ${GREEN}✓ Passés: $tests_passed${NC}"
if [ $tests_failed -gt 0 ]; then
    echo -e "  ${RED}✗ Échoués: $tests_failed${NC}"
else
    echo -e "  ${GREEN}✗ Échoués: $tests_failed${NC}"
fi
echo ""

if [ $tests_failed -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.${NC}"
    exit 1
fi


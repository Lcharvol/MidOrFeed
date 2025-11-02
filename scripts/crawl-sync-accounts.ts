const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function syncAccounts() {
  console.log("🔄 Synchronisation des comptes League of Legends...\n");

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/sync-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Synchronisation terminée!\n");
      console.log(`📊 PUUIDs analysés: ${result.data.totalPUUIDs}`);
      console.log(`✨ Comptes créés: ${result.data.accountsCreated}`);
      console.log(`🔄 Comptes mis à jour: ${result.data.accountsUpdated}`);
    } else {
      console.error("❌ Erreur:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error);
    process.exit(1);
  }
}

syncAccounts();

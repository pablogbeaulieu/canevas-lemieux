import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "../api";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

function AdminPage() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [canevasList, setCanevasList] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newCanevasTitle, setNewCanevasTitle] = useState("");
  const [newCanevasContent, setNewCanevasContent] = useState("");

  const [editingCanevasId, setEditingCanevasId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");

  const [users, setUsers] = useState([]);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsSection, setShowSuggestionsSection] = useState(false);

  const [newsList, setNewsList] = useState([]);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [showNewsSection, setShowNewsSection] = useState(false);

  // Secteur (sert à filtrer l’édition)
  const [adminSector, setAdminSector] = useState("particulier");

  // Sections rétractables
  const [showCanevasSection, setShowCanevasSection] = useState(false);

  // Reset requests
  const [resetRequests, setResetRequests] = useState([]);

  // ✅ Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);

  // ------------------------------------------------------------
  // ✅ FIX GoTrueClient: instance unique "confirm client"
  // ------------------------------------------------------------
  const confirmSupabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Missing Supabase env vars for confirm client.");
      return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          "x-delete-confirm": "SUPPRIMER",
        },
      },
      auth: {
        storageKey: "sb-confirm-delete-client",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // Helpers “SUPPRIMER”
  // ------------------------------------------------------------
  const getEnv = (key) => {
    // Vite
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) return import.meta.env[key];
    // CRA
    if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
    return undefined;
  };

  const SUPABASE_URL = getEnv("VITE_SUPABASE_URL") || getEnv("REACT_APP_SUPABASE_URL") || "";
  const SUPABASE_ANON_KEY =
    getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("REACT_APP_SUPABASE_ANON_KEY") || "";

  void SUPABASE_URL;
  void SUPABASE_ANON_KEY;

  const countRealCanevasInCategory = async (sector, category) => {
    const { count, error } = await supabase
      .from("canevas")
      .select("id", { count: "exact", head: true })
      .eq("sector", sector)
      .eq("category", category)
      .neq("title", "-");

    if (error) throw error;
    return count || 0;
  };

  const countRealCanevasInSubCategory = async (sector, category, subCategory) => {
    const { count, error } = await supabase
      .from("canevas")
      .select("id", { count: "exact", head: true })
      .eq("sector", sector)
      .eq("category", category)
      .eq("subCategory", subCategory)
      .neq("title", "-");

    if (error) throw error;
    return count || 0;
  };

  const requireTypeSUPPRIMER = (message) => {
    const typed = window.prompt(message);
    return (typed || "").trim().toUpperCase() === "SUPPRIMER";
  };

  // ------------------------------------------------------------
  // ✅ Helper: DELETE via PostgREST avec header x-delete-confirm
  // ------------------------------------------------------------
  const postgrestDelete = async ({ table, filters, confirm = false }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw { message: "Session introuvable (access_token manquant). Reconnecte-toi." };
    }

    const query = Object.entries(filters)
      .map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(String(v))}`)
      .join("&");

    const url = `${supabaseUrl}/rest/v1/${table}?${query}`;

    const headers = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    };

    if (confirm) headers["x-delete-confirm"] = "SUPPRIMER";

    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = { message: res.statusText };
      }
      throw payload || { message: "Erreur inconnue" };
    }

    return true;
  };

  // ------------------------------------------------------------
  // ✅ BACKUP MANUEL (Edge Function)
  // ------------------------------------------------------------
  const handleManualBackup = async () => {
    const confirmRun = window.confirm(
      `Lancer une sauvegarde manuelle pour le secteur "${adminSector}" ?\n\nRecommandé si vous souhaitez effectuer plusieurs modifications aux canevas`
    );
    if (!confirmRun) return;

    try {
      setIsBackingUp(true);

      // on passe le secteur (si ta function l'utilise)
      const { data, error } = await supabase.functions.invoke("backup-canevas-admin", {
        body: { sector: adminSector },
      });

      if (error) {
        console.error("backup-canevas-admin error:", error);
        alert(`❌ Sauvegarde échouée.\n${error.message || "Erreur"}`);
        return;
      }

      // si la function renvoie un message
      const msg =
        data?.message ||
        data?.status ||
        "✅ Sauvegarde terminée ! ";

      alert(msg);
      console.log("Backup result:", data);
    } catch (e) {
      console.error("handleManualBackup catch:", e);
      alert(`❌ Sauvegarde échouée.\n${e?.message || "Erreur inconnue"}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // ------------------------------------------------------------
  // Fetchers
  // ------------------------------------------------------------
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, isApproved, role, last_active");

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement utilisateurs.");
      return;
    }
    setUsers(data || []);
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from("suggestions")
      .select("id, category, content, created_at, users(email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement suggestions.");
      return;
    }
    setSuggestions(data || []);
  };

  const fetchNews = async () => {
    const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement nouveautés.");
      return;
    }
    setNewsList(data || []);
  };

  const fetchResetRequests = async () => {
    const { data, error } = await supabase
      .from("password_reset_requests")
      .select("*")
      .order("requested_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement demandes de reset.");
      return;
    }
    setResetRequests(data || []);
  };

  // Catégories filtrées par secteur
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("canevas").select("category").eq("sector", adminSector);

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement catégories.");
      return;
    }

    const unique = [...new Set((data || []).map((i) => i.category))].filter(Boolean);
    setCategories(unique);
  };

  // Sous-catégories filtrées par secteur + catégorie
  const fetchSubCategories = async () => {
    if (!selectedCategory) return;

    const { data, error } = await supabase
      .from("canevas")
      .select("subCategory")
      .eq("sector", adminSector)
      .eq("category", selectedCategory);

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement sous-catégories.");
      return;
    }

    const unique = [...new Set((data || []).map((i) => i.subCategory))].filter(Boolean);
    setSubCategories(unique);
  };

  // Canevas filtrés par secteur + catégorie + sous-catégorie
  const fetchCanevas = async () => {
    if (!selectedCategory || !selectedSubCategory) return;

    const { data, error } = await supabase
      .from("canevas")
      .select("*")
      .eq("sector", adminSector)
      .eq("category", selectedCategory)
      .eq("subCategory", selectedSubCategory);

    if (error) {
      console.error(error);
      alert("❌ Erreur chargement canevas.");
      return;
    }

    setCanevasList(data || []);
  };

  // ------------------------------------------------------------
  // Initial load + effets
  // ------------------------------------------------------------
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSelectedCategory("");
    setSelectedSubCategory("");
    setSubCategories([]);
    setCanevasList([]);
    cancelEditing();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSector]);

  useEffect(() => {
    fetchSubCategories();
    setSelectedSubCategory("");
    setCanevasList([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    fetchCanevas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubCategory]);

  useEffect(() => {
    if (showSuggestionsSection) fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuggestionsSection]);

  useEffect(() => {
    if (showNewsSection) fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewsSection]);

  useEffect(() => {
    if (showUserManagement) {
      fetchUsers();
      fetchResetRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUserManagement]);

  // ------------------------------------------------------------
  // CRUD Canevas
  // ------------------------------------------------------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    const { error } = await supabase.from("canevas").insert([
      {
        sector: adminSector,
        category: newCategory.trim(),
        subCategory: "-",
        title: "-",
        content: "-",
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Impossible d'ajouter la catégorie (Supabase a refusé).");
      return;
    }

    setNewCategory("");
    fetchCategories();
  };

  const deleteCategory = async (cat) => {
    const confirmDelete = window.confirm(
      `⚠️ Supprimer la catégorie "${cat}" dans le secteur "${adminSector}" ?`
    );
    if (!confirmDelete) return;

    try {
      const realCount = await countRealCanevasInCategory(adminSector, cat);

      if (realCount === 0) {
        const { error } = await supabase
          .from("canevas")
          .delete()
          .eq("sector", adminSector)
          .eq("category", cat);

        if (error) {
          console.error("deleteCategory error:", error);
          alert(`❌ Suppression refusée.\n${error.message}`);
          return;
        }

        fetchCategories();
        setSelectedCategory("");
        setSelectedSubCategory("");
        setSubCategories([]);
        setCanevasList([]);
        return;
      }

      const ok = requireTypeSUPPRIMER(
        `⚠️ Cette catégorie contient ${realCount} canevas réels.\n\nTape SUPPRIMER pour confirmer la suppression.`
      );
      if (!ok) return;

      await postgrestDelete({
        table: "canevas",
        filters: { sector: adminSector, category: cat },
        confirm: true,
      });

      fetchCategories();
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSubCategories([]);
      setCanevasList([]);
    } catch (e) {
      console.error("deleteCategory catch:", e);
      alert(`❌ Erreur lors de la suppression.\n${e?.message || "Erreur"}`);
    }
  };

  const addSubCategory = async () => {
    if (!selectedCategory || !newSubCategory.trim()) return;

    const { error } = await supabase.from("canevas").insert([
      {
        sector: adminSector,
        category: selectedCategory,
        subCategory: newSubCategory.trim(),
        title: "-",
        content: "-",
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Impossible d'ajouter la sous-catégorie.");
      return;
    }

    setNewSubCategory("");
    fetchSubCategories();
  };

  const deleteSubCategory = async (sub) => {
    const confirmDelete = window.confirm(
      `⚠️ Supprimer la sous-catégorie "${sub}" dans "${selectedCategory}" (${adminSector}) ?`
    );
    if (!confirmDelete) return;

    try {
      const realCount = await countRealCanevasInSubCategory(adminSector, selectedCategory, sub);

      if (realCount === 0) {
        const { error } = await supabase
          .from("canevas")
          .delete()
          .eq("sector", adminSector)
          .eq("category", selectedCategory)
          .eq("subCategory", sub);

        if (error) {
          console.error("deleteSubCategory error:", error);
          alert(`❌ Suppression refusée.\n${error.message}`);
          return;
        }

        fetchSubCategories();
        setSelectedSubCategory("");
        setCanevasList([]);
        return;
      }

      const ok = requireTypeSUPPRIMER(
        `⚠️ Cette sous-catégorie contient ${realCount} canevas réels.\n\nTape SUPPRIMER pour confirmer la suppression.`
      );
      if (!ok) return;

      await postgrestDelete({
        table: "canevas",
        filters: { sector: adminSector, category: selectedCategory, subCategory: sub },
        confirm: true,
      });

      fetchSubCategories();
      setSelectedSubCategory("");
      setCanevasList([]);
    } catch (e) {
      console.error("deleteSubCategory catch:", e);
      alert(`❌ Erreur lors de la suppression.\n${e?.message || "Erreur"}`);
    }
  };

  const addCanevas = async () => {
    if (!selectedCategory || !selectedSubCategory || !newCanevasTitle.trim()) return;

    const { error } = await supabase.from("canevas").insert([
      {
        sector: adminSector,
        category: selectedCategory,
        subCategory: selectedSubCategory,
        title: newCanevasTitle.trim(),
        content: newCanevasContent,
      },
    ]);

    if (error) {
      console.error(error);
      alert("❌ Impossible d'ajouter le canevas.");
      return;
    }

    setNewCanevasTitle("");
    setNewCanevasContent("");
    fetchCanevas();
  };

  const deleteCanevas = async (id) => {
    const confirmDelete = window.confirm("⚠️ Supprimer ce canevas ?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("canevas")
      .delete()
      .eq("sector", adminSector)
      .eq("id", id);

    if (!error) {
      fetchCanevas();
      return;
    }

    console.error("deleteCanevas error:", error);

    const msg = error?.message || "";
    const code = error?.code || "";

    if (code === "P0001" || msg.toLowerCase().includes("tapez supprimer")) {
      const ok = requireTypeSUPPRIMER(
        `⚠️ Suppression protégée par sécurité.\n\n${msg}\n\nTape SUPPRIMER pour confirmer.`
      );
      if (!ok) return;

      try {
        await postgrestDelete({
          table: "canevas",
          filters: { sector: adminSector, id },
          confirm: true,
        });

        fetchCanevas();
        return;
      } catch (e) {
        console.error("deleteCanevas confirm error:", e);
        alert(`❌ Suppression refusée.\n${e?.message || "Erreur"}`);
        return;
      }
    }

    alert(`❌ Suppression refusée.\n${msg}`);
  };

  const startEditing = (canevas) => {
    setEditingCanevasId(canevas.id);
    setEditedTitle(canevas.title);
    setEditedContent(canevas.content);
  };

  const cancelEditing = () => {
    setEditingCanevasId(null);
    setEditedTitle("");
    setEditedContent("");
  };

  const saveCanevasChanges = async () => {
    if (!editedTitle.trim()) {
      alert("Le titre ne peut pas être vide.");
      return;
    }

    const { error } = await supabase
      .from("canevas")
      .update({ title: editedTitle.trim(), content: editedContent })
      .eq("sector", adminSector)
      .eq("id", editingCanevasId);

    if (error) {
      console.error(error);
      alert("❌ Erreur lors de la mise à jour.");
      return;
    }

    cancelEditing();
    fetchCanevas();
    alert("✅ Canevas mis à jour !");
  };

  // ------------------------------------------------------------
  // CRUD Suggestions / News / Users
  // ------------------------------------------------------------
  const deleteSuggestion = async (id) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("❌ Impossible de supprimer la suggestion.");
      return;
    }
    fetchSuggestions();
  };

  const approveUser = async (userId) => {
    const { error } = await supabase.from("users").update({ isApproved: true }).eq("id", userId);
    if (error) {
      console.error(error);
      alert("❌ Impossible d'approuver.");
      return;
    }
    fetchUsers();
  };

  const disapproveUser = async (userId) => {
    const { error } = await supabase.from("users").update({ isApproved: false }).eq("id", userId);
    if (error) {
      console.error(error);
      alert("❌ Impossible de désapprouver.");
      return;
    }
    fetchUsers();
  };

  const deleteResetRequest = async (id) => {
    const { error } = await supabase.from("password_reset_requests").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("❌ Impossible de supprimer la demande.");
      return;
    }
    fetchResetRequests();
  };

  const deleteUser = async (userId) => {
    const confirmDelete = window.confirm("⚠️ Supprimer COMPLETEMENT ce compte (Auth + base de données) ?");
    if (!confirmDelete) return;

    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { userId },
    });

    if (error) {
      console.error(error);
      alert("❌ Erreur lors de la suppression (Edge Function).");
      return;
    }

    if (!data?.success) {
      alert("❌ Suppression échouée.");
      return;
    }

    alert("✅ Compte supprimé (Auth + DB).");
    fetchUsers();
  };

  const promoteToAdmin = async (userId) => {
    const { error } = await supabase.from("users").update({ role: "admin" }).eq("id", userId);
    if (error) {
      console.error(error);
      alert("❌ Impossible de promouvoir.");
      return;
    }
    setTimeout(fetchUsers, 300);
  };

  const demoteToUser = async (userId) => {
    const { error } = await supabase.from("users").update({ role: "user" }).eq("id", userId);
    if (error) {
      console.error(error);
      alert("❌ Impossible de rétrograder.");
      return;
    }
    setTimeout(fetchUsers, 300);
  };

  const getLastActiveText = (timestamp) => {
    if (!timestamp) return { text: "Dernière activité inconnue", isOnline: false };

    const last = new Date(timestamp);
    const now = new Date();
    const diffMs = now - last;
    const diffMin = Math.floor(diffMs / 1000 / 60);

    if (diffMin < 1) return { text: "En ligne maintenant", isOnline: true };
    if (diffMin === 1) return { text: "Il y a 1 minute", isOnline: false };
    if (diffMin < 60) return { text: `Il y a ${diffMin} minutes`, isOnline: false };

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return { text: "Il y a 1 heure", isOnline: false };
    if (diffHr < 24) return { text: `Il y a ${diffHr} heures`, isOnline: false };

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return { text: "Il y a 1 jour", isOnline: false };
    return { text: `Il y a ${diffDay} jours`, isOnline: false };
  };

  // ------------------------------------------------------------
  // ✅ UI helpers
  // ------------------------------------------------------------
  const sectionBtnBase =
    "flex-1 rounded-lg px-4 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-300";
  const sectionBtnOn = "bg-blue-800 text-white hover:bg-blue-900";
  const sectionBtnOff = "bg-white text-blue-900 border border-blue-200 hover:bg-blue-50";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      className="p-6 bg-white"
    >
      {/* Header */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Panneau d’administration</h1>
            <p className="text-white/80 text-sm mt-1">
              Gestion des accès, canevas, suggestions et nouveautés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              Secteur: <b className="font-semibold">{adminSector}</b>
            </span>
            <span className="text-xs bg-white/15 px-3 py-1 rounded-full">
              Sections:{" "}
              <b className="font-semibold">
                {[showUserManagement, showCanevasSection, showSuggestionsSection, showNewsSection].filter(Boolean).length}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Boutons sections */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <button
          onClick={() => setShowUserManagement(!showUserManagement)}
          className={`${sectionBtnBase} ${showUserManagement ? sectionBtnOn : sectionBtnOff}`}
        >
          {showUserManagement ? "Masquer — Utilisateurs" : "Utilisateurs"}
        </button>

        <button
          onClick={() => setShowCanevasSection(!showCanevasSection)}
          className={`${sectionBtnBase} ${showCanevasSection ? sectionBtnOn : sectionBtnOff}`}
        >
          {showCanevasSection ? "Masquer — Canevas" : "Canevas"}
        </button>

        <button
          onClick={() => setShowSuggestionsSection(!showSuggestionsSection)}
          className={`${sectionBtnBase} ${showSuggestionsSection ? sectionBtnOn : sectionBtnOff}`}
        >
          {showSuggestionsSection ? "Masquer — Suggestions" : "Suggestions"}
        </button>

        <button
          onClick={() => setShowNewsSection(!showNewsSection)}
          className={`${sectionBtnBase} ${showNewsSection ? sectionBtnOn : sectionBtnOff}`}
        >
          {showNewsSection ? "Masquer — Nouveautés" : "Nouveautés"}
        </button>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Gestion utilisateurs */}
      {/* ------------------------------------------------------------ */}
      <AnimatePresence>
        {showUserManagement && (
          <motion.div
            key="user-management"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mb-8 border rounded-xl p-5 bg-gray-50 shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Gestion des utilisateurs</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Approbation, rôles et suppression des comptes.
                </p>
              </div>
              <span className="text-xs bg-white border px-3 py-1 rounded-full text-gray-700">
                {users.length} utilisateurs
              </span>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">Liste des utilisateurs</h3>
              </div>

              <ul className="divide-y">
                {users.map((user) => {
                  const { text, isOnline } = getLastActiveText(user.last_active);
                  return (
                    <li key={user.id} className="px-4 py-3">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.email}</span>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-400"}`}
                              title={text}
                            />
                            <span className="text-xs text-gray-500">
                              {user.role === "admin" ? "Admin" : "Utilisateur"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">{text}</div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {user.isApproved ? (
                            <button
                              onClick={() => disapproveUser(user.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Désapprouver
                            </button>
                          ) : (
                            <button
                              onClick={() => approveUser(user.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Approuver
                            </button>
                          )}

                          {user.role !== "admin" ? (
                            <button
                              onClick={() => promoteToAdmin(user.id)}
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Promouvoir admin
                            </button>
                          ) : (
                            <button
                              onClick={() => demoteToUser(user.id)}
                              className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Rétrograder
                            </button>
                          )}

                          <button
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-900">
                Demandes de réinitialisation de mot de passe
              </h3>

              {resetRequests.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune demande pour le moment.</p>
              ) : (
                <ul className="divide-y bg-yellow-50 border border-yellow-300 rounded-xl overflow-hidden">
                  {resetRequests.map((req) => (
                    <li key={req.id} className="py-3 px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{req.email}</p>
                        <p className="text-xs text-gray-600">
                          Reçue le {new Date(req.requested_at).toLocaleString("fr-CA")}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteResetRequest(req.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------ */}
      {/* Gestion canevas */}
      {/* ------------------------------------------------------------ */}
      <AnimatePresence>
        {showCanevasSection && (
          <motion.div
            key="canevas-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mb-8 border rounded-xl p-5 bg-gray-50 shadow-sm overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Gestion des canevas</h2>
                <p className="text-sm text-gray-600 mt-1">Catégories, sous-catégories et canevas.</p>
              </div>

              <div className="flex items-center gap-3 p-2 bg-white border rounded-xl">
                <label className="font-semibold text-gray-800">Secteur</label>
                <select
                  className="border rounded-lg p-2"
                  value={adminSector}
                  onChange={(e) => setAdminSector(e.target.value)}
                >
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
            </div>

            {/* ✅ BARRE ACTIONS (Backup) */}
            <div className="bg-white border rounded-xl p-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                  <p className="text-sm text-gray-600">
                    Backup manuel du contenu (selon la Edge Function).
                  </p>
                </div>

                <button
                  onClick={handleManualBackup}
                  disabled={isBackingUp}
                  className={`px-5 py-3 rounded-lg font-semibold text-white transition ${
                    isBackingUp ? "bg-blue-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
                  }`}
                  title="Lancer une sauvegarde manuelle"
                >
                  {isBackingUp ? "⏳ Sauvegarde en cours..." : "💾 Sauvegarde manuelle"}
                </button>
              </div>
            </div>

            {/* Catégories */}
            <div className="bg-white border rounded-xl p-4 mb-5">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Catégories</h3>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nouvelle catégorie"
                  className="p-3 border rounded-lg w-full"
                />
                <button
                  onClick={addCategory}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold"
                >
                  Ajouter
                </button>
              </div>

              <ul className="mt-4 divide-y">
                {categories.map((cat, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2">
                    <span className="font-medium text-gray-900">{cat}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      className="text-red-700 hover:text-red-900 font-semibold text-sm"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sous-catégories */}
            <div className="bg-white border rounded-xl p-4 mb-5">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Sous-catégories</h3>

              <select
                onChange={(e) => setSelectedCategory(e.target.value)}
                value={selectedCategory}
                className="p-3 border rounded-lg w-full mb-3"
              >
                <option value="">Choisir une catégorie</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <>
                  <select
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    value={selectedSubCategory}
                    className="p-3 border rounded-lg w-full mb-3"
                  >
                    <option value="">Choisir une sous-catégorie</option>
                    {subCategories.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      placeholder="Nouvelle sous-catégorie"
                      className="p-3 border rounded-lg w-full"
                    />
                    <button
                      onClick={addSubCategory}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold"
                    >
                      Ajouter
                    </button>
                  </div>

                  <ul className="mt-4 divide-y">
                    {subCategories.map((sub, idx) => (
                      <li key={idx} className="flex justify-between items-center py-2">
                        <span className="font-medium text-gray-900">{sub}</span>
                        <button
                          onClick={() => deleteSubCategory(sub)}
                          className="text-red-700 hover:text-red-900 font-semibold text-sm"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Canevas */}
            {selectedCategory && selectedSubCategory && (
              <div className="bg-white border rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Canevas</h3>

                <div className="grid gap-3">
                  <input
                    value={newCanevasTitle}
                    onChange={(e) => setNewCanevasTitle(e.target.value)}
                    placeholder="Titre du canevas"
                    className="p-3 border rounded-lg w-full"
                  />
                  <textarea
                    value={newCanevasContent}
                    onChange={(e) => setNewCanevasContent(e.target.value)}
                    placeholder="Contenu"
                    className="p-3 border rounded-lg w-full"
                    rows={5}
                  />
                  <button
                    onClick={addCanevas}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg font-semibold"
                  >
                    Ajouter le canevas
                  </button>
                </div>

                <ul className="mt-4 divide-y">
                  {canevasList.map((canevas) => (
                    <li key={canevas.id} className="py-3">
                      {editingCanevasId === canevas.id ? (
                        <div className="bg-gray-50 border rounded-xl p-3">
                          <input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="p-3 border rounded-lg w-full mb-3"
                          />
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="p-3 border rounded-lg w-full mb-3"
                            rows={5}
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={saveCanevasChanges}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Sauvegarder
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="font-semibold text-gray-900">{canevas.title}</div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEditing(canevas)}
                              className="text-blue-700 hover:text-blue-900 font-semibold text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => deleteCanevas(canevas.id)}
                              className="text-red-700 hover:text-red-900 font-semibold text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------ */}
      {/* Suggestions */}
      {/* ------------------------------------------------------------ */}
      <AnimatePresence>
        {showSuggestionsSection && (
          <motion.div
            key="suggestions-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mb-8 border rounded-xl p-5 bg-gray-50 shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Suggestions</h2>
                <p className="text-sm text-gray-600 mt-1">Messages envoyés par les utilisateurs.</p>
              </div>
              <span className="text-xs bg-white border px-3 py-1 rounded-full text-gray-700">
                {suggestions.length} suggestions
              </span>
            </div>

            {suggestions.length === 0 ? (
              <p className="text-gray-500 italic">Aucune suggestion pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {suggestions.map((sugg) => (
                  <li key={sugg.id} className="bg-white border rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">
                      <b>Type :</b> {sugg.category} · <b>Par :</b> {sugg.users?.email || "Inconnu"}
                    </div>
                    <p className="text-gray-900 mb-2 whitespace-pre-wrap">{sugg.content}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Reçue le {new Date(sugg.created_at).toLocaleString("fr-CA")}
                    </div>
                    <button
                      onClick={() => deleteSuggestion(sugg.id)}
                      className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------ */}
      {/* Nouveautés */}
      {/* ------------------------------------------------------------ */}
      <AnimatePresence>
        {showNewsSection && (
          <motion.div
            key="news-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mb-8 border rounded-xl p-5 bg-gray-50 shadow-sm overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Nouveautés</h2>
                <p className="text-sm text-gray-600 mt-1">Contenu affiché dans “Quoi de neuf ?”.</p>
              </div>
              <span className="text-xs bg-white border px-3 py-1 rounded-full text-gray-700">
                {newsList.length} items
              </span>
            </div>

            <div className="bg-white border rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ajouter une nouveauté</h3>

              <input
                type="text"
                placeholder="Titre de la nouveauté"
                value={newNewsTitle}
                onChange={(e) => setNewNewsTitle(e.target.value)}
                className="w-full p-3 border rounded-lg mb-3"
              />
              <textarea
                placeholder="Contenu"
                value={newNewsContent}
                onChange={(e) => setNewNewsContent(e.target.value)}
                className="w-full p-3 border rounded-lg mb-3"
                rows={5}
              />

              <button
                onClick={async () => {
                  if (!newNewsTitle.trim() || !newNewsContent.trim()) {
                    alert("Titre et contenu requis.");
                    return;
                  }
                  const { error } = await supabase.from("news").insert([{ title: newNewsTitle, content: newNewsContent }]);
                  if (error) {
                    console.error(error);
                    alert("❌ Erreur");
                    return;
                  }
                  alert("✅ Nouvelle ajoutée !");
                  setNewNewsTitle("");
                  setNewNewsContent("");
                  fetchNews();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold"
              >
                Ajouter
              </button>
            </div>

            {newsList.length === 0 ? (
              <p className="text-gray-500 italic">Aucune nouveauté pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {newsList.map((news) => (
                  <li key={news.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{news.title}</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{news.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Publié le {new Date(news.created_at).toLocaleString("fr-CA")}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        const confirmDelete = window.confirm("⚠️ Supprimer cette nouveauté ?");
                        if (!confirmDelete) return;

                        const { error } = await supabase.from("news").delete().eq("id", news.id);
                        if (error) {
                          console.error(error);
                          alert("❌ Erreur lors de la suppression");
                          return;
                        }
                        alert("🗑️ Nouvelle supprimée !");
                        fetchNews();
                      }}
                      className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminPage;
